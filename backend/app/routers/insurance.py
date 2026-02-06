from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..services.insurance_analyzer import insurance_analyzer
from ..core.models import InsuranceInfo, MedicalBill


router = APIRouter(tags=["insurance"])


class InsuranceAnalysisRequest(BaseModel):
    insurance: InsuranceInfo
    bills: Optional[List[MedicalBill]] = None


class BillsAnalysisRequest(BaseModel):
    bills: List[MedicalBill]


@router.post("/analyze")
async def analyze_insurance(request: InsuranceAnalysisRequest):
    try:
        analysis = insurance_analyzer.analyze_insurance(
            insurance=request.insurance, bills=request.bills
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/bills")
async def analyze_bills(request: BillsAnalysisRequest):
    import logging
    logging.info(f"Received bills analysis request with {len(request.bills)} bills")
    
    try:
        # Log bill details for debugging
        for i, bill in enumerate(request.bills):
            logging.info(f"Bill {i+1}: total=${bill.total_amount}, patient_responsibility=${bill.patient_responsibility}")
        
        analysis = insurance_analyzer.analyze_bills(request.bills)
        logging.info(f"Bills analysis completed successfully: {len(analysis.get('issues', []))} issues found")
        
        return analysis
    except Exception as e:
        logging.error(f"Error in bills analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Bills analysis failed: {str(e)}")


@router.get("/types")
async def get_insurance_types():
    try:
        types = insurance_analyzer.get_insurance_types()
        return {"insurance_types": types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
