import { ML_SERVICE_URL } from '../../config/constants';

export interface MLPredictionRequest {
  amount: number; // Stored in DB as Paise, ML expects INR, we convert before sending
  payment_method: string;
  failure_reason: string;
  customer_success_rate: number;
  retry_count: number;
  day_of_week: number;
  hour_of_day: number;
}

export interface MLPredictionResponse {
  recovery_probability: number;
  model_version: string;
}

export class MLClient {
  async predictRecovery(payload: MLPredictionRequest): Promise<MLPredictionResponse> {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`ML Service returned status ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (typeof data.recovery_probability !== 'number' || data.recovery_probability < 0 || data.recovery_probability > 1) {
         throw new Error(`ML Service returned invalid probability: ${data.recovery_probability}`);
      }
      
      return {
        recovery_probability: data.recovery_probability,
        model_version: data.model_version || 'unknown'
      };
    } catch (error) {
      console.error('[MLClient] Error predicting recovery:', error);
      throw new Error(`MLClient Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
