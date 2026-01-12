from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from ..services.bill_analyzer import bill_analyzer
from ..core.models import MedicalBill, BillAnalysisIssue


router = APIRouter()


class BillAnalysisRequest(BaseModel):
    bills: List[MedicalBill]


@router.post("/analyze")
async def analyze_bills(request: BillAnalysisRequest):
    try:
        issues = bill_analyzer.analyze_bills(request.bills)
        return {"issues": issues}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/itemize")
async def generate_itemization_request(bill: MedicalBill):
    try:
        itemization = bill_analyzer.generate_itemization_request(bill)
        return itemization
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
