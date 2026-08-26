import pandas as pd
import numpy as np
import argparse
import os
import joblib
import json

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score, f1_score, confusion_matrix,
    brier_score_loss
)

def train_and_evaluate(data_path: str, model_output_path: str, metrics_output_path: str, seed: int):
    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Separate features and target
    target_col = 'is_recovered'
    
    # Verify no leakage - exclude target from features
    feature_cols = [c for c in df.columns if c != target_col]
    X = df[feature_cols]
    y = df[target_col]
    
    print(f"Features: {feature_cols}")
    
    # Train-test split (stratified because recovery might be imbalanced)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y
    )
    
    print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")
    
    # Preprocessing
    numeric_features = ['amount', 'customer_success_rate', 'retry_count', 'day_of_week', 'hour_of_day']
    categorical_features = ['payment_method', 'failure_reason']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', drop='first'), categorical_features)
        ])
    
    # Pipeline with baseline Logistic Regression
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', LogisticRegression(random_state=seed, max_iter=1000))
    ])
    
    print("Training model...")
    pipeline.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = pipeline.predict(X_test)
    y_pred_proba = pipeline.predict_proba(X_test)[:, 1]
    
    # Metrics
    metrics = {
        'roc_auc': roc_auc_score(y_test, y_pred_proba),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
        'f1_score': f1_score(y_test, y_pred),
        'brier_score': brier_score_loss(y_test, y_pred_proba), # measures probability calibration
        'class_distribution_test_set': y_test.value_counts(normalize=True).to_dict()
    }
    
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n--- Evaluation Metrics ---")
    for k, v in metrics.items():
        print(f"{k}: {v}")
    print("\nConfusion Matrix:")
    print(cm)
    
    # Probability buckets
    print("\n--- Probability Calibration (Buckets) ---")
    results = pd.DataFrame({'true': y_test, 'pred_proba': y_pred_proba})
    results['bucket'] = pd.cut(results['pred_proba'], bins=[0, 0.2, 0.4, 0.6, 0.8, 1.0])
    calibration = results.groupby('bucket').agg(
        count=('true', 'count'),
        actual_recovery_rate=('true', 'mean'),
        avg_predicted_proba=('pred_proba', 'mean')
    )
    print(calibration)
    
    # Feature Importance (Coefficients)
    # Extract feature names after one-hot encoding
    cat_encoder = pipeline.named_steps['preprocessor'].named_transformers_['cat']
    cat_feature_names = cat_encoder.get_feature_names_out(categorical_features)
    all_feature_names = numeric_features + list(cat_feature_names)
    
    coefs = pipeline.named_steps['classifier'].coef_[0]
    feature_importance = pd.DataFrame({
        'feature': all_feature_names,
        'coefficient': coefs
    }).sort_values(by='coefficient', key=abs, ascending=False)
    
    print("\n--- Top Features (by absolute coefficient) ---")
    print(feature_importance.head(10))
    
    # Save model artifact
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(pipeline, model_output_path)
    print(f"\nModel saved to {model_output_path}")
    
    # Save metrics
    metrics['feature_importance'] = feature_importance.to_dict('records')
    os.makedirs(os.path.dirname(metrics_output_path), exist_ok=True)
    with open(metrics_output_path, 'w') as f:
        json.dump(metrics, f, indent=4)
    print(f"Metrics saved to {metrics_output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, default="services/ml/data/synthetic_payments.csv")
    parser.add_argument("--model_out", type=str, default="services/ml/models/baseline_logistic_v1.joblib")
    parser.add_argument("--metrics_out", type=str, default="services/ml/models/metrics_v1.json")
    parser.add_argument("--seed", type=int, default=42)
    
    args = parser.parse_args()
    train_and_evaluate(args.data, args.model_out, args.metrics_out, args.seed)
