import logging
import time
import asyncio
import psutil
import os
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.logging import setup_logging, get_request_id, get_correlation_id

# Setup structured logging
setup_logging(settings.log_level)
logger = logging.getLogger(__name__)

# Initialize slowapi limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    startup_time = time.time()
    logger.info(
        "🚀 Starting MedFin API",
        extra={
            "version": settings.app_version,
            "environment": settings.environment,
            "startup_time": datetime.now().isoformat(),
        },
    )

    yield

    uptime = time.time() - startup_time
    logger.info(
        "🛑 Shutting down MedFin API",
        extra={"uptime_seconds": uptime, "shutdown_time": datetime.now().isoformat()},
    )


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Healthcare Financial Navigator API",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

# Add slowapi rate limiting exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security middleware
if settings.environment == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["medfin.onrender.com", "localhost", "127.0.0.1"],
    )

# Performance middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if settings.environment == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with correlation ID and timing"""
    correlation_id = get_correlation_id()
    request_id = get_request_id()
    start_time = time.time()

    # Add correlation ID to request state
    request.state.correlation_id = correlation_id
    request.state.request_id = request_id

    # Log request
    logger.info(
        "Request started",
        extra={
            "correlation_id": correlation_id,
            "request_id": request_id,
            "method": request.method,
            "url": str(request.url),
            "user_agent": request.headers.get("user-agent"),
            "client_ip": get_remote_address(request),
        },
    )

    try:
        response = await call_next(request)
        duration = time.time() - start_time

        # Log response
        logger.info(
            "Request completed",
            extra={
                "correlation_id": correlation_id,
                "request_id": request_id,
                "status_code": response.status_code,
                "duration": round(duration, 3),
            },
        )

        # Add correlation ID to response headers
        response.headers["X-Correlation-ID"] = correlation_id

        return response
    except Exception as exc:
        duration = time.time() - start_time
        logger.error(
            "Request failed",
            extra={
                "correlation_id": correlation_id,
                "request_id": request_id,
                "duration": round(duration, 3),
                "error": str(exc),
            },
            exc_info=True,
        )
        raise


# Enhanced global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions consistently"""
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    request_id = getattr(request.state, "request_id", "unknown")

    logger.error(
        "Unhandled exception",
        extra={
            "correlation_id": correlation_id,
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
        },
        exc_info=True,
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "code": "INTERNAL_ERROR",
            "message": "An internal error occurred. Please try again later.",
            "details": {"correlation_id": correlation_id, "request_id": request_id},
        },
    )


# Enhanced health checks
@app.get("/health")
def health():
    """Basic health check"""
    return {
        "status": "healthy",
        "version": settings.app_version,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/health/ready")
def readiness():
    """Readiness probe - check if app can serve traffic"""
    try:
        # Check if we can make basic operations
        test_dict = {"test": "ready"}
        return {
            "status": "ready",
            "environment": settings.environment,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as exc:
        logger.error(f"Readiness check failed: {exc}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "error": str(exc),
                "timestamp": datetime.now().isoformat(),
            },
        )


@app.get("/health/live")
def liveness():
    """Liveness probe - check if app is alive"""
    try:
        # Basic process check
        process = psutil.Process(os.getpid())
        return {
            "status": "alive",
            "uptime": time.time() - process.create_time(),
            "memory_usage": process.memory_info().rss / 1024 / 1024,  # MB
            "cpu_percent": process.cpu_percent(),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as exc:
        logger.error(f"Liveness check failed: {exc}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(exc),
                "timestamp": datetime.now().isoformat(),
            },
        )


@app.get("/api/v1/status")
@limiter.limit("60/minute")
async def get_system_status(request: Request):
    """Get comprehensive system status"""
    correlation_id = getattr(request.state, "correlation_id", "unknown")

    try:
        process = psutil.Process(os.getpid())
        uptime = time.time() - process.create_time()

        # Check external services (simplified email service check)
        email_status = "connected" if settings.resend_api_key else "not_configured"

        return {
            "status": "operational",
            "version": settings.app_version,
            "uptime": f"{uptime // 3600:.0f}h {(uptime % 3600) // 60:.0f}m",
            "environment": settings.environment,
            "services": {"email": email_status, "api": "healthy"},
            "system": {
                "memory_usage_mb": round(process.memory_info().rss / 1024 / 1024, 2),
                "cpu_percent": process.cpu_percent(),
                "disk_usage_percent": psutil.disk_usage("/").percent,
            },
            "metadata": {
                "correlation_id": correlation_id,
                "timestamp": datetime.now().isoformat(),
            },
        }
    except Exception as exc:
        logger.error(
            f"Status check failed: {exc}", extra={"correlation_id": correlation_id}
        )
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "error": "System status check failed",
                "services": {"api": "degraded"},
            },
        )


# Import and include routers
from app.routers.cost_estimation import router as cost_router
from app.routers.insurance import router as insurance_router
from app.routers.bills import router as bills_router
from app.routers.navigation import router as navigation_router
from app.routers.assistance import router as assistance_router
from app.routers.payment_plans import router as payment_plans_router
from app.routers.feedback import router as feedback_router

app.include_router(cost_router, prefix="/api/v1")
app.include_router(insurance_router, prefix="/api/v1")
app.include_router(bills_router, prefix="/api/v1")
app.include_router(navigation_router, prefix="/api/v1")
app.include_router(assistance_router, prefix="/api/v1")
app.include_router(payment_plans_router, prefix="/api/v1")
app.include_router(feedback_router, prefix="/api/v1")
