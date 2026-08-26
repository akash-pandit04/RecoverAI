import pandas as pd
import numpy as np
import argparse
import os

def generate_synthetic_data(num_records: int, seed: int, output_path: str):
    np.random.seed(seed)
    
    # Feature configurations
    failure_reasons = ['insufficient_balance', 'bank_timeout', 'network_error', 'account_issue', 'invalid_payment_details', 'temporary_bank_error']
    payment_methods = ['UPI', 'CARD', 'NETBANKING']
    
    # Generate features
    amounts = np.random.lognormal(mean=7, sigma=1, size=num_records)  # Amounts typical for payments (~1000 INR)
    amounts = np.round(amounts, 2)
    
    methods = np.random.choice(payment_methods, size=num_records, p=[0.6, 0.3, 0.1])
    reasons = np.random.choice(failure_reasons, size=num_records, p=[0.4, 0.2, 0.1, 0.1, 0.1, 0.1])
    
    customer_success_rates = np.random.beta(a=5, b=2, size=num_records) # Skewed towards higher success
    retry_counts = np.random.poisson(lam=1, size=num_records) # Mostly 0, 1, 2
    retry_counts = np.clip(retry_counts, 0, 5)
    
    day_of_week = np.random.randint(0, 7, size=num_records)
    hour_of_day = np.random.randint(0, 24, size=num_records)
    
    # Define a latent score for recovery probability (higher score = more likely to recover)
    # Start with a base log-odds
    latent_score = np.zeros(num_records)
    
    # Add noise
    latent_score += np.random.normal(0, 1, size=num_records)
    
    # Adjust based on failure reason
    # Temporary issues are more recoverable
    reason_effects = {
        'bank_timeout': 1.5,
        'network_error': 1.0,
        'temporary_bank_error': 1.2,
        'insufficient_balance': -0.5,
        'account_issue': -2.0,
        'invalid_payment_details': -2.5
    }
    latent_score += np.array([reason_effects[r] for r in reasons])
    
    # Adjust based on customer history (higher success rate -> more likely to recover)
    latent_score += (customer_success_rates * 3.0) - 1.5
    
    # Adjust based on retry counts (more retries already done -> less likely to recover now)
    latent_score -= (retry_counts * 0.5)
    
    # Adjust based on amount (very high amounts slightly harder to recover immediately)
    latent_score -= np.log1p(amounts) * 0.2
    
    # Convert latent score to probability using sigmoid
    probabilities = 1 / (1 + np.exp(-latent_score))
    
    # Generate target label based on probabilities
    is_recovered = (np.random.rand(num_records) < probabilities).astype(int)
    
    # Construct DataFrame
    df = pd.DataFrame({
        'amount': amounts,
        'payment_method': methods,
        'failure_reason': reasons,
        'customer_success_rate': customer_success_rates,
        'retry_count': retry_counts,
        'day_of_week': day_of_week,
        'hour_of_day': hour_of_day,
        'is_recovered': is_recovered
    })
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    
    print(f"Generated {num_records} records.")
    print(f"Class distribution (is_recovered): \n{df['is_recovered'].value_counts(normalize=True)}")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic payment recovery data")
    parser.add_argument("--num_records", type=int, default=25000, help="Number of records to generate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--output", type=str, default="services/ml/data/synthetic_payments.csv", help="Output CSV path")
    
    args = parser.parse_args()
    generate_synthetic_data(args.num_records, args.seed, args.output)
