import { PaymentEvent } from '@recoverai/shared';

export interface PaymentProvider {
  retryPayment(paymentId: string): Promise<boolean>;
  getPaymentStatus(paymentId: string): Promise<PaymentEvent['status']>;
}

export class SyntheticPaymentProvider implements PaymentProvider {
  // Simulate retry success based on some random chance or fixed outcome
  async retryPayment(paymentId: string): Promise<boolean> {
    console.log(`[Synthetic] Executing simulated retry for payment ${paymentId}`);
    // For demo purposes, we can say 70% of retries succeed in synthetic
    const success = Math.random() > 0.3;
    return success;
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentEvent['status']> {
    return 'FAILED'; 
  }
}
