from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import resend
import os

router = APIRouter(prefix="/feedback", tags=["feedback"])

# Initialize Resend with API key from environment
resend.api_key = os.getenv("RESEND_API_KEY")

class FeedbackRequest(BaseModel):
    rating: int  # 1-5 stars
    category: Optional[str] = "general"  # general, bug, feature, other
    comments: str  # Changed from 'message' to match frontend
    name: Optional[str] = None  # User's name
    email: Optional[str] = None  # User's email if they want a response

class FeedbackResponse(BaseModel):
    success: bool
    message: str

@router.post("", response_model=FeedbackResponse)
async def submit_feedback(feedback: FeedbackRequest):
    """Submit user feedback via email."""
    
    try:
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
        
        # Send email using Resend
        params = {
            "from": "MedFin Feedback <feedback@resend.dev>",
            "to": ["ruiadevansh@gmail.com"],
            "subject": f"MedFin Feedback: {feedback.category} ({feedback.rating}/5 stars)",
            "html": html_content,
        }
        
        email = resend.Emails.send(params)
        
        return FeedbackResponse(
            success=True,
            message="Thank you for your feedback!"
        )
        
    except Exception as e:
        print(f"Failed to send feedback email: {e}")
        # Still return success to user even if email fails
        # Log the error for debugging
        raise HTTPException(status_code=500, detail="Failed to submit feedback")

@router.get("/health")
async def feedback_health():
    """Check if feedback service is configured."""
    return {
        "status": "ok",
        "email_configured": bool(os.getenv("RESEND_API_KEY"))
    }
