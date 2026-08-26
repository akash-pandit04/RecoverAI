import { z } from 'zod';
import { RecoveryActionType } from '../policy/policy.types';

export interface AgentContext {
  payment: {
    amount: number;
    method: string;
    failureReason: string;
    retryCount: number;
  };
  customer: {
    successRate: number;
  };
  prediction: {
    recoveryProbability: number;
    modelVersion: string;
  };
  availableActions: string[];
}

export const AgentRecommendationSchema = z.object({
  recommended_action: z.enum(['RETRY', 'MESSAGE', 'ESCALATE']),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  customer_message: z.string().nullable()
});

export type AgentRecommendation = z.infer<typeof AgentRecommendationSchema>;
