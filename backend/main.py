from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import (
    cost_router,
    insurance_router,
    bills_router,
    navigation_router,
    assistance_router,
    payment_plans_router,
)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    cost_router, prefix=f"{settings.api_v1_prefix}/cost", tags=["cost_estimation"]
)

app.include_router(
    insurance_router, prefix=f"{settings.api_v1_prefix}/insurance", tags=["insurance"]
)

app.include_router(
    bills_router, prefix=f"{settings.api_v1_prefix}/bills", tags=["bills"]
)

app.include_router(
    navigation_router,
    prefix=f"{settings.api_v1_prefix}/navigation",
    tags=["navigation"],
)

app.include_router(
    assistance_router,
    prefix=f"{settings.api_v1_prefix}/assistance",
    tags=["assistance"],
)

app.include_router(
    payment_plans_router,
    prefix=f"{settings.api_v1_prefix}/payment-plans",
    tags=["payment_plans"],
)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
