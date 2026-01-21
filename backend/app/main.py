from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import cost_router, insurance_router, bills_router, navigation_router, assistance_router, payment_plans_router, feedback_router


app = FastAPI(
    title="MedFin API",
    version="1.0.0",
    docs_url="/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://medfin-phi.vercel.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ ROOT-LEVEL HEALTH CHECK
@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(cost_router, prefix="/api/v1")
app.include_router(insurance_router, prefix="/api/v1")
app.include_router(bills_router, prefix="/api/v1")
app.include_router(navigation_router, prefix="/api/v1")
app.include_router(assistance_router, prefix="/api/v1")
app.include_router(payment_plans_router, prefix="/api/v1")
app.include_router(feedback_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
    }
