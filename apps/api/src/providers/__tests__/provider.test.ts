import { MockLLMProvider } from '../llm/mock.llm.provider';
import { SyntheticPaymentProvider } from '../payment.provider';
import { describe, it, expect } from 'vitest';

describe('Providers', () => {
  it('MockLLMProvider returns valid recommendation', async () => {
    const provider = new MockLLMProvider();
    const recommendation = await provider.recommendAction({
      payment: { amount: 100, method: 'card', failureReason: 'insufficient_balance', retryCount: 0 },
      customer: { successRate: 0.8 },
      prediction: { recoveryProbability: 0.8, modelVersion: 'v1' },
      availableActions: ['RETRY']
    });
    expect(recommendation).toHaveProperty('recommended_action');
    expect(recommendation).toHaveProperty('reason');
  });

  it('SyntheticPaymentProvider retries successfully deterministically', async () => {
    const provider = new SyntheticPaymentProvider();
    provider.setDeterministicSuccess(true);
    const result = await provider.retryPayment('test_id');
    expect(result).toBe(true);
  });
});
