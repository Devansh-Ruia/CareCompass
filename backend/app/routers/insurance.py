from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..services.insurance_analyzer import insurance_analyzer
from ..core.models import InsuranceInfo, MedicalBill


router = APIRouter()


class InsuranceAnalysisRequest(BaseModel):
    insurance: InsuranceInfo
    bills: Optional[List[MedicalBill]] = None


@router.post("/analyze")
async def analyze_insurance(request: InsuranceAnalysisRequest):
    try:
        analysis = insurance_analyzer.analyze_insurance(
            insurance=request.insurance, bills=request.bills
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types")
async def get_insurance_types():
    try:
        types = insurance_analyzer.get_insurance_types()
        return {"insurance_types": types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
