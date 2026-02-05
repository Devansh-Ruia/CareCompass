"""
Security utilities for MedFin API
Rate limiting, input sanitization, file validation
"""

import os
import re
import uuid
from pathlib import Path
from typing import Optional
import bleach
from fastapi import HTTPException, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request
import logging

logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Security constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg'
}

def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks
    """
    if not text:
        return ""
    
    # Remove potentially dangerous characters
    cleaned = bleach.clean(
        text, 
        strip=True,
        tags=[],
        attributes={},
        styles=[],
        protocols=[]
    )
    
    # Remove any remaining script-like patterns
    cleaned = re.sub(r'[<>{}[\]]', '', cleaned)
    
    return cleaned.strip()

def validate_file(file: UploadFile) -> dict:
    """
    Validate uploaded file for security
    Returns validation result with details
    """
    result = {
        'valid': True,
        'error': None,
        'size': 0,
        'extension': None,
        'mime_type': None
    }
    
    # Check file size
    if hasattr(file, 'size') and file.size:
        result['size'] = file.size
        if file.size > MAX_FILE_SIZE:
            result['valid'] = False
            result['error'] = f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            return result
    
    # Check file extension
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        result['extension'] = ext
        if ext not in ALLOWED_EXTENSIONS:
            result['valid'] = False
            result['error'] = f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            return result
    
    # Check MIME type
    if file.content_type:
        result['mime_type'] = file.content_type
        if file.content_type not in ALLOWED_MIME_TYPES:
            result['valid'] = False
            result['error'] = f"Invalid file format. Allowed: PDF, PNG, JPG"
            return result
    
    return result

def generate_error_id() -> str:
    """Generate unique error ID for tracking"""
    return str(uuid.uuid4())[:8]

def get_client_ip(request: Request) -> str:
    """Get client IP address from request"""
    # Check for forwarded IP first (for proxy setups)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"

def validate_question_input(question: str, max_length: int = 1000) -> str:
    """
    Validate and sanitize question input
    """
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    question = question.strip()
    
    if len(question) < 3:
        raise HTTPException(status_code=400, detail="Question too short (minimum 3 characters)")
    
    if len(question) > max_length:
        raise HTTPException(status_code=400, detail=f"Question too long (maximum {max_length} characters)")
    
    # Sanitize the input
    sanitized = sanitize_input(question)
    
    if not sanitized:
        raise HTTPException(status_code=400, detail="Invalid question format")
    
    return sanitized

def log_security_event(event_type: str, details: dict, request: Request):
    """Log security-related events"""
    ip = get_client_ip(request)
    event_data = {
        'event_type': event_type,
        'ip_address': ip,
        'user_agent': request.headers.get('user-agent', 'unknown'),
        'details': details,
        'timestamp': str(uuid.uuid4())[:8]
    }
    
    logger.warning(f"Security Event: {event_type} from {ip} - {details}")

# Rate limit configurations
RATE_LIMITS = {
    'ai_question': '30/minute',
    'file_upload': '10/minute', 
    'appeal_generation': '5/minute',
    'pre_visit_checklist': '10/minute'
}
