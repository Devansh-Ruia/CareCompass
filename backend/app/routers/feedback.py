from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os

router = APIRouter(tags=["feedback"])

# Feedback data model
class FeedbackRequest(BaseModel):
    name: str
    email: str
    category: str
    rating: int
    comments: str

class FeedbackResponse(BaseModel):
    success: bool
    message: str
    feedback_id: Optional[str] = None

# File to store feedback
FEEDBACK_FILE = "feedback.json"

def load_feedback():
    """Load existing feedback from JSON file"""
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
    return []

def save_feedback(feedback_data: dict):
    """Save feedback to JSON file"""
    feedback_list = load_feedback()
    feedback_data['id'] = f"fb_{len(feedback_list) + 1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    feedback_data['timestamp'] = datetime.now().isoformat()
    feedback_list.append(feedback_data)
    
    with open(FEEDBACK_FILE, 'w', encoding='utf-8') as f:
        json.dump(feedback_list, f, indent=2, ensure_ascii=False)
    
    return feedback_data['id']

@router.post("/", response_model=FeedbackResponse)
async def submit_feedback(feedback: FeedbackRequest):
    """Submit new feedback"""
    try:
        # Validate rating
        if feedback.rating < 1 or feedback.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        # Validate email format (basic)
        if '@' not in feedback.email or '.' not in feedback.email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Validate category
        valid_categories = ["general", "bug", "feature", "improvement"]
        if feedback.category not in valid_categories:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        # Save feedback
        feedback_id = save_feedback(feedback.dict())
        
        return FeedbackResponse(
            success=True,
            message="Thank you for your feedback! We appreciate your input.",
            feedback_id=feedback_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save feedback: {str(e)}")

@router.get("/", response_model=List[dict])
async def get_feedback():
    """Get all feedback (for admin purposes)"""
    try:
        feedback_list = load_feedback()
        return feedback_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load feedback: {str(e)}")

@router.get("/stats")
async def get_feedback_stats():
    """Get feedback statistics"""
    try:
        feedback_list = load_feedback()
        
        total_feedback = len(feedback_list)
        average_rating = sum(f['rating'] for f in feedback_list) / total_feedback if total_feedback > 0 else 0
        
        category_counts = {}
        for feedback in feedback_list:
            category_counts[feedback['category']] = category_counts.get(feedback['category'], 0) + 1
        
        return {
            "total_feedback": total_feedback,
            "average_rating": round(average_rating, 2),
            "category_counts": category_counts,
            "recent_feedback": feedback_list[-5:]  # Last 5 feedbacks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load stats: {str(e)}")
