from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..services.assistance_matcher import assistance_matcher
from ..core.models import (
    InsuranceInfo,
    MedicalBill,
    AssistanceMatch,
    FinancialHardshipLevel,
)


router = APIRouter()


class AssistanceMatchRequest(BaseModel):
    insurance: InsuranceInfo
    monthly_income: float
    household_size: int
    medical_bills: Optional[List[MedicalBill]] = None
    hardship_level: Optional[FinancialHardshipLevel] = None
    diagnoses: Optional[List[str]] = None
    prescriptions: Optional[List[str]] = None


@router.post("/match", response_model=AssistanceMatch)
async def match_assistance(request: AssistanceMatchRequest):
    try:
        match = assistance_matcher.match_assistance(
            insurance=request.insurance,
            monthly_income=request.monthly_income,
            household_size=request.household_size,
            medical_bills=request.medical_bills,
            hardship_level=request.hardship_level,
            diagnoses=request.diagnoses,
            prescriptions=request.prescriptions,
        )
        return match
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/programs")
async def get_assistance_programs():
    try:
        programs = assistance_matcher.get_programs()
        return {"programs": programs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
