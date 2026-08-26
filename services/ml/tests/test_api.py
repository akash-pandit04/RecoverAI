import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Ensure app can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app

client = TestClient(app)

def test_health_check_no_model():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

import numpy as np

@patch('app.main.model_pipeline')
def test_predict_success(mock_model):
    # Mock the pipeline's predict_proba
    mock_model.predict_proba.return_value = np.array([[0.2, 0.85]])
    
    # We need to temporarily set the global in main
    import app.main
    app.main.model_pipeline = mock_model
    
    response = client.post("/predict", json={
        "amount": 2500,
        "payment_method": "UPI",
        "failure_reason": "insufficient_balance",
        "customer_success_rate": 0.9,
        "retry_count": 0,
        "day_of_week": 1,
        "hour_of_day": 14
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "recovery_probability" in data
    assert data["recovery_probability"] == 0.85
    assert data["model_version"] == "baseline-logistic-v1"
    
    # Reset
    app.main.model_pipeline = None

def test_predict_validation_error():
    # Negative amount should fail
    response = client.post("/predict", json={
        "amount": -50,
        "payment_method": "UPI",
        "failure_reason": "insufficient_balance",
        "customer_success_rate": 0.9,
        "retry_count": 0,
        "day_of_week": 1,
        "hour_of_day": 14
    })
    assert response.status_code == 422
