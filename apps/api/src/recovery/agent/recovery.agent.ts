import { LLMProvider } from '../../providers/llm/llm.provider';
import { AgentContext, AgentRecommendation, AgentRecommendationSchema } from './agent.types';
import { POLICY_CONFIG } from '../../config/constants';

export class RecoveryAgent {
  constructor(private llmProvider: LLMProvider) {}

  async getRecommendation(context: AgentContext): Promise<AgentRecommendation | null> {
    // Optimization: Do not call LLM unnecessarily for fatal errors
    if (POLICY_CONFIG.FATAL_FAILURE_REASONS.includes(context.payment.failureReason)) {
      console.log('[RecoveryAgent] Skipping LLM for fatal failure reason.');
      return {
        recommended_action: 'ESCALATE',
        confidence: 1.0,
        reason: 'Fatal failure reason detected, bypassing LLM.',
        customer_message: null
      };
    }

    try {
      const response = await this.llmProvider.recommendAction(context);
      
      // Strict Zod validation
      const validated = AgentRecommendationSchema.parse(response);
      return validated;
    } catch (error) {
      console.error('[RecoveryAgent] LLM failure or invalid response:', error);
      // Fail gracefully, return null so the system falls back to deterministic policy
      return null;
    }
  }
}
