export interface PaymentEvent {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'FAILED' | 'SUCCESS';
  failureReason?: string;
  method: string;
  customerId: string;
}

export interface Recommendation {
  action: string;
  reason: string;
}
