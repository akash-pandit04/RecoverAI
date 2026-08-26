import { POLICY_CONFIG } from '../../config/constants';
import { PolicyEvaluationInput, PolicyDecision } from './policy.types';

export class PolicyEngine {
  evaluate(input: PolicyEvaluationInput): PolicyDecision {
    const policyVersion = 'v1.1';

    // 1. Success check
    if (input.paymentStatus === 'SUCCESS') {
      return { allowed: false, action: 'NONE', reason: 'Payment already successful', policyVersion };
    }
    if (input.paymentStatus !== 'FAILED') {
      return { allowed: false, action: 'NONE', reason: 'Payment is not in FAILED state', policyVersion };
    }

    // 2. Fatal reason check
    if (POLICY_CONFIG.FATAL_FAILURE_REASONS.includes(input.failureReason)) {
      return { allowed: true, action: 'ESCALATE', reason: `Fatal failure reason (${input.failureReason}) - escalating immediately`, policyVersion };
    }

    // 3. Retry limit check
    if (input.retryCount >= POLICY_CONFIG.MAX_RETRIES && (!input.agentRecommendation || input.agentRecommendation.recommended_action === 'RETRY')) {
       // If agent wants to retry but we hit limit, we reject and escalate.
       return { allowed: true, action: 'ESCALATE', reason: `Retry limit reached (${input.retryCount}/${POLICY_CONFIG.MAX_RETRIES}). Policy Override.`, policyVersion };
    }

    // 4. Evaluate Agent Recommendation
    if (input.agentRecommendation) {
       const aiAction = input.agentRecommendation.recommended_action;
       
       if (aiAction === 'RETRY') {
          if (input.recoveryProbability < POLICY_CONFIG.HIGH_RECOVERY_THRESHOLD) {
             return { allowed: true, action: 'ESCALATE', reason: `Policy REJECTED AI RETRY: Probability (${input.recoveryProbability.toFixed(2)}) is below threshold.`, policyVersion };
          }
          return { allowed: true, action: 'RETRY', reason: `Policy APPROVED AI RETRY`, policyVersion };
       }

       if (aiAction === 'MESSAGE') {
          if (input.recoveryProbability < POLICY_CONFIG.MEDIUM_RECOVERY_THRESHOLD) {
             return { allowed: true, action: 'ESCALATE', reason: `Policy REJECTED AI MESSAGE: Probability too low.`, policyVersion };
          }
          return { allowed: true, action: 'MESSAGE', reason: `Policy APPROVED AI MESSAGE`, policyVersion };
       }

       if (aiAction === 'ESCALATE') {
          return { allowed: true, action: 'ESCALATE', reason: `Policy APPROVED AI ESCALATE`, policyVersion };
       }
    }

    // 5. Fallback deterministic rules (if no agent or agent failed)
    if (input.recoveryProbability >= POLICY_CONFIG.HIGH_RECOVERY_THRESHOLD) {
      return { allowed: true, action: 'RETRY', reason: `Fallback: High probability (${input.recoveryProbability.toFixed(2)})`, policyVersion };
    } else if (input.recoveryProbability >= POLICY_CONFIG.MEDIUM_RECOVERY_THRESHOLD) {
      return { allowed: true, action: 'MESSAGE', reason: `Fallback: Medium probability (${input.recoveryProbability.toFixed(2)})`, policyVersion };
    } else {
      return { allowed: true, action: 'ESCALATE', reason: `Fallback: Low probability (${input.recoveryProbability.toFixed(2)})`, policyVersion };
    }
  }
}
