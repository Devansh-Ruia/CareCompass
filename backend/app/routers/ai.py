from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
import base64
import json
import logging
import traceback
import io
import PyPDF2
from PIL import Image
from slowapi import Limiter
from slowapi.util import get_remote_address
from ..services.gemini_service import gemini_service
from ..security import (
    limiter, validate_file, sanitize_input, 
    validate_question_input, log_security_event,
    RATE_LIMITS
)

router = APIRouter(tags=["ai"])

class PolicyTextRequest(BaseModel):
    policy_text: str
    
    @validator('policy_text')
    def validate_policy_text(cls, v):
        if not v or not v.strip():
            raise ValueError('Policy text cannot be empty')
        if len(v.strip()) < 100:
            raise ValueError('Policy text too short to be valid')
        if len(v) > 50000:  # 50KB limit
            raise ValueError('Policy text too long')
        return sanitize_input(v)

class QuestionRequest(BaseModel):
    question: str
    policy_data: Dict[str, Any]
    conversation_history: Optional[List[Dict[str, str]]] = None
    
    @validator('question')
    def validate_question(cls, v):
        if not v or not v.strip():
            raise ValueError('Question cannot be empty')
        if len(v.strip()) < 3:
            raise ValueError('Question too short')
        if len(v) > 1000:
            raise ValueError('Question too long')
        return sanitize_input(v)

class BillValidationRequest(BaseModel):
    bill_image_base64: str
    policy_data: Dict[str, Any]
    
    @validator('bill_image_base64')
    def validate_base64(cls, v):
        if not v:
            raise ValueError('Bill image cannot be empty')
        # Basic base64 validation
        try:
            base64.b64decode(v)
        except Exception:
            raise ValueError('Invalid base64 format')
        return v

class OptimizationRequest(BaseModel):
    policy_data: Dict[str, Any]
    user_needs: Dict[str, Any]

class PreVisitRequest(BaseModel):
    visit_type: str
    policy_data: Dict[str, Any]
    provider_info: Optional[Dict[str, Any]] = None
    
    @validator('visit_type')
    def validate_visit_type(cls, v):
        valid_types = ['primary_care', 'specialist', 'emergency', 'urgent_care', 'surgery', 'imaging', 'lab_work']
        
        # Normalize: lowercase, strip, replace spaces/slashes with underscores
        normalized = v.lower().strip().split('/')[0].strip().replace(' ', '_')
        
        # Try to match against valid types
        if normalized in valid_types:
            return normalized
        
        # Fuzzy match: check if any valid type is contained in input
        for vt in valid_types:
            if vt in normalized or normalized in vt:
                return vt
        
        raise ValueError(f'Invalid visit type. Must be one of: {valid_types}')

class AppealRequest(BaseModel):
    denial_info: Dict[str, Any]
    policy_data: Dict[str, Any]
    tone: str = "professional"
    
    @validator('tone')
    def validate_tone(cls, v):
        valid_tones = ['professional', 'emphatic', 'detailed', 'concise']
        if v not in valid_tones:
            raise ValueError(f'Invalid tone. Must be one of: {valid_tones}')
        return v

@router.get("/health")
async def ai_health():
    """Check if AI service is configured."""
    return {
        "status": "ok",
        "ai_configured": gemini_service.is_configured(),
        "model": "gemini-2.5-flash" if gemini_service.is_configured() else None
    }

@router.get("/models")
async def list_models():
    """List available Gemini models."""
    try:
        # Since we're using the new SDK through gemini_service, return the model we're using
        if gemini_service.is_configured():
            return {
                "models": [
                    {
                        "name": "gemini-2.5-flash",
                        "display_name": "Gemini 2.5 Flash",
                        "description": "Fast and efficient multimodal model",
                        "input_token_limit": 1048576,  # 1M tokens
                        "supported_generation_methods": ["generateContent"]
                    }
                ]
            }
        else:
            return {"models": [], "error": "AI service not configured"}
    except Exception as e:
        return {"error": str(e)}

@router.post("/analyze-policy")
@limiter.limit("10/minute")
async def analyze_policy(request: PolicyTextRequest, http_request: Request):
    """Analyze insurance policy text and extract all parameters."""
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    try:
        result = await gemini_service.analyze_insurance_policy(request.policy_text)
        if "error" in result:
            log_security_event("ai_analysis_failed", {"error": result["error"]}, http_request)
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        log_security_event("ai_analysis_error", {"error": str(e)}, http_request)
        raise HTTPException(status_code=500, detail="Policy analysis failed")

@router.post("/upload-policy")
@limiter.limit("10/minute")
async def upload_policy(request: Request, file: UploadFile = File(...)):
    """Upload and analyze a policy document (PDF or image)."""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Received file upload: {file.filename}, content_type: {file.content_type}")
    
    # Validate file security
    validation_result = validate_file(file)
    if not validation_result['valid']:
        log_security_event("file_upload_rejected", validation_result, http_request)
        raise HTTPException(status_code=400, detail=validation_result['error'])
    
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    # Validate file type
    filename = file.filename.lower() if file.filename else ""
    allowed_extensions = ('.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp')
    
    if not filename.endswith(allowed_extensions):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        content = await file.read()
        logger.info(f"Read {len(content)} bytes from file")
        
        if not content:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        policy_text = ""
        
        # Extract text based on file type
        if filename.endswith('.pdf'):
            logger.info("Processing PDF file")
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                for page in pdf_reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        policy_text += extracted + "\n"
                logger.info(f"Extracted {len(policy_text)} characters from PDF")
            except Exception as pdf_error:
                logger.error(f"PDF extraction failed: {pdf_error}")
                raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(pdf_error)}")
        else:
            # For images, use Gemini's vision capability through gemini_service
            logger.info("Processing image file")
            try:
                from PIL import Image
                image = Image.open(io.BytesIO(content))
                logger.info(f"Image size: {image.size}, format: {image.format}")
                
                # Convert image to base64 for gemini_service
                import base64
                image_buffer = io.BytesIO()
                image.save(image_buffer, format=image.format or 'PNG')
                image_base64 = base64.b64encode(image_buffer.getvalue()).decode('utf-8')
                
                # Use gemini_service to extract text from image
                text_extraction_prompt = "Extract all text from this insurance policy document. Return only the extracted text, nothing else."
                
                model = gemini_service.client.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content([
                    text_extraction_prompt,
                    {"mime_type": f"image/{image.format.lower()}", "data": image_base64}
                ])
                policy_text = response.text
                logger.info(f"Extracted {len(policy_text)} characters from image")
            except Exception as img_error:
                logger.error(f"Image processing failed: {img_error}")
                raise HTTPException(status_code=400, detail=f"Failed to process image: {str(img_error)}")
        
        if not policy_text or len(policy_text.strip()) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract sufficient text from the document. Please ensure it's a clear policy document."
            )
        
        # Analyze the extracted text
        logger.info("Analyzing policy text with AI")
        result = await gemini_service.analyze_insurance_policy(policy_text)
        
        if "error" in result:
            logger.error(f"AI analysis failed: {result['error']}")
            raise HTTPException(status_code=500, detail=result["error"])
        
        logger.info("Policy analysis complete")
        return {
            "policy_data": result,
            "extracted_text_length": len(policy_text),
            "source_file": file.filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing policy: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process policy: {str(e)}")

@router.post("/ask-question")
@limiter.limit("30/minute")
async def ask_policy_question(request: QuestionRequest, http_request: Request):
    """Ask a question about the insurance policy."""
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    try:
        result = await gemini_service.answer_policy_question(
            request.question,
            request.policy_data,
            request.conversation_history
        )
        if "error" in result:
            log_security_event("question_failed", {"error": result["error"]}, http_request)
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        log_security_event("question_error", {"error": str(e)}, http_request)
        raise HTTPException(status_code=500, detail="Failed to process question")

@router.post("/validate-bill")
async def validate_bill(request: BillValidationRequest):
    """Validate a bill image against the policy."""
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    result = await gemini_service.validate_bill_against_policy(
        request.bill_image_base64,
        request.policy_data
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.post("/upload-bill")
async def upload_bill(
    file: UploadFile = File(...),
    policy_data: str = Form(...)
):
    """Upload a bill image and validate against policy."""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"=== UPLOAD BILL START ===")
    logger.info(f"Filename: {file.filename}, Content-Type: {file.content_type}")
    
    if not gemini_service.is_configured():
        logger.error("AI service not configured")
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    try:
        # Step 1: Parse policy data
        logger.info("Step 1: Parsing policy_data JSON")
        try:
            policy = json.loads(policy_data)
            logger.info(f"Policy parsed successfully, keys: {list(policy.keys())[:5]}...")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse policy_data: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid policy data JSON: {str(e)}")
        
        # Step 2: Read file content
        logger.info("Step 2: Reading file content")
        content = await file.read()
        if not content:
            logger.error("Empty file uploaded")
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        logger.info(f"Read {len(content)} bytes")
        
        # Step 3: Convert to base64
        logger.info("Step 3: Converting to base64")
        image_base64 = base64.b64encode(content).decode('utf-8')
        logger.info(f"Base64 length: {len(image_base64)}")
        
        # Step 4: Call Gemini service
        logger.info("Step 4: Calling gemini_service.validate_bill_against_policy")
        result = await gemini_service.validate_bill_against_policy(image_base64, policy)
        logger.info(f"Step 4 complete, result keys: {list(result.keys()) if isinstance(result, dict) else 'not a dict'}")
        
        # Step 5: Check for errors in result
        if isinstance(result, dict) and "error" in result:
            logger.error(f"Gemini service returned error: {result['error']}")
            # Return the error as a proper response instead of 500
            # This helps with debugging
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        logger.info("=== UPLOAD BILL SUCCESS ===")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"=== UPLOAD BILL FAILED ===")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception message: {str(e)}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to validate bill: {str(e)}")

@router.post("/optimize-policy")
async def optimize_policy(request: OptimizationRequest):
    """Get optimization recommendations for the policy."""
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    result = await gemini_service.recommend_policy_alternatives(
        request.policy_data,
        request.user_needs
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.post("/pre-visit-checklist")
async def generate_pre_visit_checklist(request: PreVisitRequest):
    """Generate a pre-visit checklist for a specific medical visit type."""
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    result = await gemini_service.generate_pre_visit_checklist(
        request.visit_type,
        request.policy_data,
        request.provider_info
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.post("/generate-appeal")
async def generate_appeal_letter(request: AppealRequest):
    """Generate an appeal letter for a denied claim."""
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    result = await gemini_service.generate_appeal_letter(
        request.denial_info,
        request.policy_data,
        request.tone
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.post("/upload-denial")
async def upload_denial_letter(
    file: UploadFile = File(...),
    policy_data: str = Form(...),
    tone: str = Form("professional")
):
    """Upload a denial letter and generate appeal letter."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"[upload-denial] Starting upload process")
        logger.info(f"[upload-denial] File: {file.filename}, Type: {file.content_type}")
        
        if not gemini_service.is_configured():
            logger.error("[upload-denial] AI service not configured")
            raise HTTPException(status_code=503, detail="AI service not configured")
        
        import json
        policy = json.loads(policy_data)
        logger.info(f"[upload-denial] Policy data parsed successfully")
        
        content = await file.read()
        logger.info(f"[upload-denial] Read {len(content)} bytes from file")
        
        # Reset file pointer if needed
        await file.seek(0)
        
        image_base64 = base64.b64encode(content).decode()
        logger.info(f"[upload-denial] Content encoded to base64")
        
        # First extract denial info from image
        denial_extraction_prompt = """Extract the following information from this denial letter image:
        - denial_date (when the denial was sent)
        - service_description (what was denied)
        - service_date (date of service)
        - amount_denied (numeric value)
        - denial_reason (why they denied it)
        - denial_code (if provided)
        - insurer_name (insurance company name)
        - claim_number (if provided)
        
        Return as JSON with these exact keys. Use null for any missing information."""
        
        logger.info("[upload-denial] Extracting denial information with vision model...")
        # Extract denial info using vision model
        model = gemini_service.client.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content([
            denial_extraction_prompt,
            {"mime_type": file.content_type, "data": image_base64}
        ])
        
        text = response.text
        logger.info(f"[upload-denial] Vision response received: {len(text)} characters")
        
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            denial_info = json.loads(text[start:end])
            logger.info(f"[upload-denial] Successfully parsed denial info: {denial_info}")
        else:
            logger.error(f"[upload-denial] Could not extract denial information from: {text}")
            raise Exception("Could not extract denial information")
        
        logger.info("[upload-denial] Generating appeal letter...")
        # Generate appeal letter
        result = await gemini_service.generate_appeal_letter(
            denial_info,
            policy,
            tone
        )
        
        logger.info(f"[upload-denial] Appeal letter generated successfully")
        
        if "error" in result:
            logger.error(f"[upload-denial] Error in appeal generation: {result['error']}")
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Include extracted denial info in response
        result["extracted_denial_info"] = denial_info
        logger.info("[upload-denial] Upload process completed successfully")
        return result
        
    except HTTPException as e:
        logger.error(f"[upload-denial] HTTP Exception: {type(e).__name__}: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"[upload-denial] FAILED: {type(e).__name__}: {str(e)}")
        logger.exception("[upload-denial] Full traceback:")
        raise HTTPException(status_code=500, detail=f"Failed to process denial letter: {str(e)}")
