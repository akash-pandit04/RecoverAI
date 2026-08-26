from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Payment amount")
    payment_method: str = Field(..., description="Method used, e.g., UPI, CARD")
    failure_reason: str = Field(..., description="Reason for failure, e.g., insufficient_balance")
    customer_success_rate: float = Field(..., ge=0, le=1, description="Customer's historical success rate")
    retry_count: int = Field(..., ge=0, description="Number of retries already attempted")
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour of the day 0-23")

class PredictionResponse(BaseModel):
    recovery_probability: float = Field(..., ge=0.0, le=1.0)
    model_version: str
