from fastapi import FastAPI, HTTPException
import joblib
import pandas as pd
import os
from contextlib import asynccontextmanager

from .schemas import PredictionRequest, PredictionResponse

MODEL_PATH = os.getenv("MODEL_PATH", "services/ml/models/baseline_logistic_v1.joblib")
MODEL_VERSION = os.getenv("MODEL_VERSION", "baseline-logistic-v1")

model_pipeline = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_pipeline
    try:
        if os.path.exists(MODEL_PATH):
            model_pipeline = joblib.load(MODEL_PATH)
            print(f"Loaded model from {MODEL_PATH}")
        else:
            print(f"WARNING: Model file not found at {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")
    yield
    model_pipeline = None

app = FastAPI(title="RecoverAI ML Service", lifespan=lifespan)

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": model_pipeline is not None}

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    if model_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Convert request to pandas DataFrame
        input_data = pd.DataFrame([{
            "amount": request.amount,
            "payment_method": request.payment_method,
            "failure_reason": request.failure_reason,
            "customer_success_rate": request.customer_success_rate,
            "retry_count": request.retry_count,
            "day_of_week": request.day_of_week,
            "hour_of_day": request.hour_of_day
        }])
        
        # Predict probability
        proba = model_pipeline.predict_proba(input_data)[0, 1]
        
        # Ensure bounds
        proba = float(max(0.0, min(1.0, proba)))
        
        return PredictionResponse(
            recovery_probability=proba,
            model_version=MODEL_VERSION
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
