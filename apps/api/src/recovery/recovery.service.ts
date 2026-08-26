import { prisma } from '../db/prisma';
import { MLClient } from './ml/ml.client';
import { PolicyEngine } from './policy/policy.engine';
import { SyntheticPaymentProvider } from '../providers/payment.provider';
import { RecoveryAgent } from './agent/recovery.agent';
import { MockLLMProvider } from '../providers/llm/mock.llm.provider';
import { OpenAILLMProvider } from '../providers/llm/openai.llm.provider';

export class RecoveryService {
  private mlClient = new MLClient();
  private policyEngine = new PolicyEngine();
  private paymentProvider = new SyntheticPaymentProvider();
  
  private getLLMProvider() {
    if (process.env.LLM_PROVIDER === 'openai') {
      console.log('[RecoveryService] Using OpenAILLMProvider');
      return new OpenAILLMProvider();
    }
    console.log('[RecoveryService] Using MockLLMProvider');
    return new MockLLMProvider();
  }
  
  private recoveryAgent = new RecoveryAgent(this.getLLMProvider());


  async evaluatePayment(paymentId: string) {
    // 1. Fetch Payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        customer: true,
        attempts: { orderBy: { timestamp: 'desc' } },
        recoveryCases: true
      }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const lastAttempt = payment.attempts[0];
    const failureReason = lastAttempt?.failureReason || 'unknown';
    const method = lastAttempt?.method || 'unknown';
    const retryCount = payment.attempts.length - 1; // 1 original + retries

    // 2. Create or find RecoveryCase (Idempotency)
    let recoveryCase = payment.recoveryCases[0];
    if (recoveryCase && ['RECOVERED', 'CLOSED'].includes(recoveryCase.status)) {
       return { status: 'IGNORED', reason: 'Case already recovered or closed' };
    }

    if (!recoveryCase) {
       recoveryCase = await prisma.recoveryCase.create({
         data: {
           paymentId: payment.id,
           status: 'OPEN'
         }
       });
       await this.audit(recoveryCase.id, 'RECOVERY_CASE_CREATED');
    }

    // 3. ML Prediction
    let probability = 0;
    try {
      // Build ML features. Date features are mocked using current time for this real-time execution.
      const now = new Date();
      const mlResponse = await this.mlClient.predictRecovery({
        amount: Number(payment.amount),
        payment_method: method,
        failure_reason: failureReason,
        customer_success_rate: payment.customer.historySuccessRate,
        retry_count: Math.max(0, retryCount),
        day_of_week: now.getDay() === 0 ? 6 : now.getDay() - 1,
        hour_of_day: now.getHours()
      });

      probability = mlResponse.recovery_probability;

      await prisma.modelPrediction.create({
        data: {
          paymentId: payment.id,
          recoveryCaseId: recoveryCase.id,
          modelVersion: mlResponse.model_version,
          probability: probability,
          featuresSnapshot: { method, failureReason, retryCount, amount: payment.amount }
        }
      });
      await this.audit(recoveryCase.id, 'ML_PREDICTION_CREATED');

      // Update case with latest probability
      await prisma.recoveryCase.update({
        where: { id: recoveryCase.id },
        data: { recoveryProbability: probability }
      });
    } catch (error) {
      await this.audit(recoveryCase.id, 'ML_SERVICE_ERROR');
      return { status: 'ERROR', reason: 'ML service failed' };
    }

    // 4. AI Agent Recommendation
    let agentRecommendation = null;
    try {
      const agentContext = {
        payment: {
          amount: Number(payment.amount),
          method,
          failureReason,
          retryCount
        },
        customer: {
          successRate: payment.customer.historySuccessRate
        },
        prediction: {
          recoveryProbability: probability,
          modelVersion: 'v1'
        },
        availableActions: ['RETRY', 'MESSAGE', 'ESCALATE']
      };

      agentRecommendation = await this.recoveryAgent.getRecommendation(agentContext);
      if (agentRecommendation) {
        await this.audit(recoveryCase.id, 'AI_RECOMMENDATION_GENERATED', { recommendation: agentRecommendation });
      }
    } catch (error) {
      console.error('[RecoveryService] Agent error:', error);
      // Fallback
    }

    // 5. Policy Engine
    const decision = this.policyEngine.evaluate({
      paymentStatus: payment.status,
      retryCount: retryCount,
      failureReason: failureReason,
      recoveryProbability: probability,
      agentRecommendation: agentRecommendation
    });

    await this.audit(recoveryCase.id, 'POLICY_EVALUATED', { decision });

    if (!decision.allowed || decision.action === 'NONE') {
      await this.audit(recoveryCase.id, 'ACTION_REJECTED', { reason: decision.reason });
      if (agentRecommendation) {
         await this.audit(recoveryCase.id, 'AI_RECOMMENDATION_REJECTED', { 
           aiAction: agentRecommendation.recommended_action,
           policyReason: decision.reason
         });
      }
      return { status: 'REJECTED', reason: decision.reason };
    }

    // Check if policy overrode AI
    if (agentRecommendation && decision.action !== agentRecommendation.recommended_action) {
      await this.audit(recoveryCase.id, 'AI_RECOMMENDATION_REJECTED', {
         aiAction: agentRecommendation.recommended_action,
         finalAction: decision.action,
         policyReason: decision.reason
      });
    }

    await this.audit(recoveryCase.id, 'ACTION_SELECTED', { action: decision.action });

    // 5. Execution
    const actionRecord = await prisma.recoveryAction.create({
      data: {
        recoveryCaseId: recoveryCase.id,
        actionType: decision.action,
        status: 'PENDING'
      }
    });

    let executionSuccess = false;
    if (decision.action === 'RETRY') {
       executionSuccess = await this.paymentProvider.retryPayment(payment.id);
       
       await prisma.recoveryAction.update({
         where: { id: actionRecord.id },
         data: { status: executionSuccess ? 'EXECUTED' : 'FAILED' }
       });

       if (executionSuccess) {
         await prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS' } });
         await prisma.recoveryCase.update({ where: { id: recoveryCase.id }, data: { status: 'RECOVERED' }});
         await this.audit(recoveryCase.id, 'ACTION_EXECUTED');
       } else {
         await prisma.paymentAttempt.create({
            data: { paymentId: payment.id, method: method, failureReason: 'retry_failed' }
         });
       }
    } else if (decision.action === 'ESCALATE') {
       await prisma.recoveryAction.update({ where: { id: actionRecord.id }, data: { status: 'EXECUTED' }});
       await prisma.recoveryCase.update({ where: { id: recoveryCase.id }, data: { status: 'ESCALATED' }});
       await this.audit(recoveryCase.id, 'RECOVERY_ESCALATED');
    } else if (decision.action === 'MESSAGE') {
       await prisma.recoveryAction.update({ where: { id: actionRecord.id }, data: { status: 'EXECUTED' }});
       await this.audit(recoveryCase.id, 'ACTION_EXECUTED');
    }

    return { status: 'PROCESSED', decision, executionSuccess };
  }

  private async audit(recoveryCaseId: string, event: string, details?: any) {
    await prisma.auditEvent.create({
      data: { recoveryCaseId, event, details: details || {} }
    });
  }
}
