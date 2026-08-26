import { AgentRecommendation } from '../agent/agent.types';

export type RecoveryActionType = 'RETRY' | 'MESSAGE' | 'ESCALATE' | 'NONE';

export interface PolicyEvaluationInput {
  paymentStatus: string;
  retryCount: number;
  failureReason: string;
  recoveryProbability: number;
  agentRecommendation?: AgentRecommendation | null;
}

export interface PolicyDecision {
  allowed: boolean;
  action: RecoveryActionType;
  reason: string;
  policyVersion: string;
}
