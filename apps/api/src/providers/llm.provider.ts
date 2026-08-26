export interface LLMProvider {
  getRecommendation(context: any): Promise<{ action: string; reason: string }>;
  generateMessage(context: any): Promise<string>;
}

export class MockLLMProvider implements LLMProvider {
  async getRecommendation(context: any): Promise<{ action: string; reason: string }> {
    return {
      action: 'RETRY_PAYMENT',
      reason: 'Mock recommendation based on synthetic context'
    };
  }

  async generateMessage(context: any): Promise<string> {
    return 'Your payment failed. Please try again.';
  }
}
