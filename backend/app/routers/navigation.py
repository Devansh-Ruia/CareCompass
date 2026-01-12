from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..services.navigation_engine import navigation_engine
from ..core.models import MedicalBill, InsuranceInfo, NavigationPlan


router = APIRouter()


class NavigationPlanRequest(BaseModel):
    bills: List[MedicalBill]
    insurance: InsuranceInfo
    monthly_income: float
    household_size: int


class SituationAnalysisRequest(BaseModel):
    bills: List[MedicalBill]
    insurance: InsuranceInfo
    monthly_income: float
    household_size: int


@router.post("/plan", response_model=NavigationPlan)
async def create_navigation_plan(request: NavigationPlanRequest):
    try:
        plan = navigation_engine.create_navigation_plan(
            bills=request.bills,
            insurance=request.insurance,
            monthly_income=request.monthly_income,
            household_size=request.household_size,
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-situation")
async def analyze_situation(request: SituationAnalysisRequest):
    try:
        analysis = navigation_engine.analyze_situation(
            bills=request.bills,
            insurance=request.insurance,
            monthly_income=request.monthly_income,
            household_size=request.household_size,
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
