// Policy Boundaries
export const POLICY_CONFIG = {
  MAX_RETRIES: 2,
  HIGH_RECOVERY_THRESHOLD: 0.60,
  MEDIUM_RECOVERY_THRESHOLD: 0.35,
  FATAL_FAILURE_REASONS: ['invalid_payment_details', 'account_issue']
};

export const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
