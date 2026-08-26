import { AgentContext, AgentRecommendation } from '../../recovery/agent/agent.types';

export interface LLMProvider {
  recommendAction(context: AgentContext): Promise<AgentRecommendation>;
}
