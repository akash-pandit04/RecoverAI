import { MockLLMProvider } from '../llm.provider';
import { SyntheticPaymentProvider } from '../payment.provider';
import { describe, it, expect } from 'vitest';

describe('Providers', () => {
  it('MockLLMProvider returns valid recommendation', async () => {
    const provider = new MockLLMProvider();
    const recommendation = await provider.getRecommendation({});
    expect(recommendation).toHaveProperty('action');
    expect(recommendation).toHaveProperty('reason');
  });

  it('SyntheticPaymentProvider retries successfully', async () => {
    const provider = new SyntheticPaymentProvider();
    const result = await provider.retryPayment('test_id');
    expect(result).toBe(true);
  });
});
