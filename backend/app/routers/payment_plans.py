from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..services.payment_planner import payment_planner
from ..core.models import PaymentPlanOption


router = APIRouter()


class PaymentPlansGenerateRequest(BaseModel):
    total_debt: float
    monthly_income: float
    credit_score: Optional[int] = None
    debt_to_income_ratio: float = 0.0
    hardship: bool = False


class PaymentPlansRecommendRequest(BaseModel):
    total_debt: float
    monthly_income: float
    credit_score: Optional[int] = None
    debt_to_income_ratio: float = 0.0
    hardship: bool = False


@router.post("/generate")
async def generate_payment_plans(request: PaymentPlansGenerateRequest):
    try:
        plans = payment_planner.generate_payment_plans(
            total_debt=request.total_debt,
            monthly_income=request.monthly_income,
            credit_score=request.credit_score,
            debt_to_income_ratio=request.debt_to_income_ratio,
            hardship=request.hardship,
        )
        return {"plans": plans}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend", response_model=PaymentPlanOption)
async def recommend_best_plan(request: PaymentPlansRecommendRequest):
    try:
        plan = payment_planner.recommend_best_plan(
            total_debt=request.total_debt,
            monthly_income=request.monthly_income,
            credit_score=request.credit_score,
            debt_to_income_ratio=request.debt_to_income_ratio,
            hardship=request.hardship,
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
