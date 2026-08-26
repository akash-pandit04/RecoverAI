import { describe, it, expect } from 'vitest';
import { PolicyEngine } from '../policy.engine';
import { POLICY_CONFIG } from '../../../config/constants';

describe('PolicyEngine', () => {
  const engine = new PolicyEngine();

  it('1. High probability + zero retries -> RETRY', () => {
    const decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: 0, failureReason: 'bank_timeout', recoveryProbability: 0.85
    });
    expect(decision.action).toBe('RETRY');
  });

  it('2. High probability + max retries -> ESCALATE', () => {
    const decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: POLICY_CONFIG.MAX_RETRIES, failureReason: 'bank_timeout', recoveryProbability: 0.85
    });
    expect(decision.action).toBe('ESCALATE');
  });

  it('3. Medium probability -> MESSAGE', () => {
    const decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: 0, failureReason: 'network_error', recoveryProbability: 0.50
    });
    expect(decision.action).toBe('MESSAGE');
  });

  it('4. Low probability -> ESCALATE', () => {
    const decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: 0, failureReason: 'insufficient_balance', recoveryProbability: 0.20
    });
    expect(decision.action).toBe('ESCALATE');
  });

  it('5. Invalid payment details -> no blind retry (ESCALATE)', () => {
    const decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: 0, failureReason: 'invalid_payment_details', recoveryProbability: 0.90
    });
    expect(decision.action).toBe('ESCALATE');
  });

  it('6. Successful payment -> no recovery action', () => {
    const decision = engine.evaluate({
      paymentStatus: 'SUCCESS', retryCount: 0, failureReason: '', recoveryProbability: 0.80
    });
    expect(decision.allowed).toBe(false);
    expect(decision.action).toBe('NONE');
  });

  it('7. Policy rejects an invalid action (Non FAILED)', () => {
    const decision = engine.evaluate({
      paymentStatus: 'PENDING', retryCount: 0, failureReason: '', recoveryProbability: 0.80
    });
    expect(decision.allowed).toBe(false);
  });

  it('8. Retry count boundaries', () => {
    // Just below limit
    let decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: POLICY_CONFIG.MAX_RETRIES - 1, failureReason: 'bank_timeout', recoveryProbability: 0.85
    });
    expect(decision.action).toBe('RETRY');

    // At limit
    decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: POLICY_CONFIG.MAX_RETRIES, failureReason: 'bank_timeout', recoveryProbability: 0.85
    });
    expect(decision.action).toBe('ESCALATE');
  });

  it('9. AI recommends RETRY + policy allows -> RETRY', () => {
    const decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: 0, failureReason: 'bank_timeout', recoveryProbability: 0.85,
      agentRecommendation: { recommended_action: 'RETRY', confidence: 0.9, reason: '', customer_message: null }
    });
    expect(decision.action).toBe('RETRY');
  });

  it('10. AI recommends RETRY + policy rejects -> ESCALATE', () => {
    // Prob 0.4 is below HIGH threshold for RETRY
    const decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: 0, failureReason: 'bank_timeout', recoveryProbability: 0.40,
      agentRecommendation: { recommended_action: 'RETRY', confidence: 0.9, reason: '', customer_message: null }
    });
    expect(decision.action).toBe('ESCALATE');
    expect(decision.reason).toContain('REJECTED AI RETRY');
  });

  it('11. AI recommends MESSAGE -> policy allows', () => {
    const decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: 0, failureReason: 'insufficient_balance', recoveryProbability: 0.50,
      agentRecommendation: { recommended_action: 'MESSAGE', confidence: 0.8, reason: '', customer_message: 'Hi' }
    });
    expect(decision.action).toBe('MESSAGE');
  });

  it('12. AI cannot bypass retry limit', () => {
    const decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: POLICY_CONFIG.MAX_RETRIES, failureReason: 'bank_timeout', recoveryProbability: 0.95,
      agentRecommendation: { recommended_action: 'RETRY', confidence: 0.9, reason: '', customer_message: null }
    });
    expect(decision.action).toBe('ESCALATE');
    expect(decision.reason).toContain('Retry limit reached');
  });

  it('13. Fatal failure -> no unnecessary LLM call (Policy escalates before AI)', () => {
    const decision = engine.evaluate({
      paymentStatus: 'FAILED', retryCount: 0, failureReason: 'invalid_payment_details', recoveryProbability: 0.95,
      agentRecommendation: { recommended_action: 'RETRY', confidence: 0.9, reason: '', customer_message: null }
    });
    expect(decision.action).toBe('ESCALATE');
    expect(decision.reason).toContain('Fatal');
  });
});
