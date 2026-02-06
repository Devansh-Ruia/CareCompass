from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
import resend
import os
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(tags=["feedback"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)

# Initialize Resend with API key from environment
resend.api_key = os.getenv("RESEND_API_KEY")


class FeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    category: Optional[str] = Field(
        "general", max_length=50, description="Feedback category"
    )
    comments: str = Field(
        ..., min_length=1, max_length=2000, description="User comments"
    )
    name: Optional[str] = Field(None, max_length=100, description="User's name")
    email: Optional[EmailStr] = Field(None, description="User's email for response")

    @validator("category")
    def validate_category(cls, v):
        allowed_categories = ["general", "bug", "feature", "other", "ui", "performance"]
        if v and v not in allowed_categories:
            raise ValueError(
                f"Category must be one of: {', '.join(allowed_categories)}"
            )
        return v

    @validator("comments")
    def sanitize_comments(cls, v):
        # Basic XSS prevention
        dangerous_chars = ["<script", "</script>", "javascript:", "onerror=", "onload="]
        for char in dangerous_chars:
            if char.lower() in v.lower():
                raise ValueError("Comments contain potentially dangerous content")
        return v.strip()


class FeedbackResponse(BaseModel):
    success: bool
    message: str


class ErrorResponse(BaseModel):
    error: bool = True
    code: str
    message: str
    details: Optional[dict] = None


@router.post("", response_model=FeedbackResponse)
@limiter.limit("10/minute")
async def submit_feedback(request: Request, feedback: FeedbackRequest):
    """Submit user feedback via email with rate limiting."""
    client_ip = get_remote_address(request)

    try:
        # Log feedback submission
        logger.info(
            "Feedback submission received",
            extra={
                "rating": feedback.rating,
                "category": feedback.category,
                "client_ip": client_ip,
                "has_email": bool(feedback.email),
            },
        )

        # Format the email content
        rating_stars = "⭐" * feedback.rating + "☆" * (5 - feedback.rating)

        html_content = f"""
        <h2>New MedFin Feedback</h2>
        <p><strong>Rating:</strong> {rating_stars} ({feedback.rating}/5)</p>
        <p><strong>Category:</strong> {feedback.category}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">{feedback.comments}</p>
        """

        if feedback.name:
            html_content += f"<p><strong>Name:</strong> {feedback.name}</p>"

        if feedback.email:
            html_content += f"<p><strong>User Email:</strong> {feedback.email}</p>"

        html_content += f"<p><strong>IP Address:</strong> {client_ip}</p>"

        # Send email using Resend
        params = {
            "from": "MedFin Feedback <feedback@resend.dev>",
            "to": ["ruiadevansh@gmail.com"],
            "subject": f"MedFin Feedback: {feedback.category} ({feedback.rating}/5 stars)",
            "html": html_content,
        }

        email = resend.Emails.send(params)

        logger.info(
            "Feedback email sent successfully", extra={"email_id": email.get("id")}
        )

        return FeedbackResponse(
            success=True,
            message="Thank you for your feedback! We appreciate your input.",
        )

    except Exception as e:
        logger.error(
            f"Failed to send feedback email: {e}",
            extra={
                "rating": feedback.rating,
                "category": feedback.category,
                "client_ip": client_ip,
            },
            exc_info=True,
        )

        # Return error response
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                code="EMAIL_SEND_FAILED",
                message="Failed to submit feedback. Please try again later.",
                details={"error": str(e)},
            ).dict(),
        )


@router.get("/health")
@limiter.limit("60/minute")
async def feedback_health(request: Request):
    """Check if feedback service is configured."""
    email_configured = bool(os.getenv("RESEND_API_KEY"))

    return {
        "status": "healthy" if email_configured else "degraded",
        "email_configured": email_configured,
        "service": "feedback",
    }
