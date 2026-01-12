from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from ..services.cost_estimator import cost_estimator
from ..core.models import InsuranceInfo, CostEstimate


router = APIRouter()


class CostEstimateRequest(BaseModel):
    service_code: str
    insurance: InsuranceInfo
    location: str = "midwest"
    is_emergency: bool = False
    in_network: bool = True


@router.post("/estimate", response_model=CostEstimate)
async def estimate_cost(request: CostEstimateRequest):
    try:
        estimate = cost_estimator.estimate_cost(
            service_code=request.service_code,
            insurance=request.insurance,
            location=request.location,
            is_emergency=request.is_emergency,
            in_network=request.in_network,
        )
        return estimate
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/services")
async def get_services():
    try:
        services = cost_estimator.get_available_services()
        return {"services": services}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
