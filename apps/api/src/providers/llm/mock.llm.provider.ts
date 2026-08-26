import { LLMProvider } from './llm.provider';
import { AgentContext, AgentRecommendation } from '../../recovery/agent/agent.types';

export class MockLLMProvider implements LLMProvider {
  async recommendAction(context: AgentContext): Promise<AgentRecommendation> {
    // Deterministic mock logic based on context
    const prob = context.prediction.recoveryProbability;
    const reason = context.payment.failureReason;

    if (reason === 'force_llm_error') {
      throw new Error("LLM Connection Timeout");
    }

    if (reason === 'insufficient_balance' && prob > 0.4 && prob < 0.7) {
      return {
        recommended_action: 'MESSAGE',
        confidence: 0.81,
        reason: "A reminder may allow the customer to resolve the balance issue before another attempt.",
        customer_message: "We couldn't complete your recent payment due to insufficient funds. Please check your balance and try again."
      };
    }

    if (prob >= 0.7) {
      return {
        recommended_action: 'RETRY',
        confidence: 0.88,
        reason: `High probability (${prob.toFixed(2)}) for ${reason}. Retrying is optimal.`,
        customer_message: null
      };
    } else if (prob >= 0.4) {
      return {
        recommended_action: 'MESSAGE',
        confidence: 0.75,
        reason: "Moderate probability, safer to message than blindly retry.",
        customer_message: "We couldn't complete your recent payment. Please check your payment method and try again."
      };
    } else {
      // Simulate Scenario B (Agent recommends RETRY but low probability)
      // Or just ESCALATE usually. Let's make it so if prob is very low (e.g. 0.12), we deliberately return RETRY
      // to test policy rejection! Let's do it if prob == 0.12 or similar.
      if (prob < 0.2) {
        return {
          recommended_action: 'RETRY',
          confidence: 0.9,
          reason: "Agent thinks it can force a retry anyway.",
          customer_message: null
        };
      }

      return {
        recommended_action: 'ESCALATE',
        confidence: 0.95,
        reason: "Probability is too low to attempt automated recovery.",
        customer_message: null
      };
    }
  }
}
