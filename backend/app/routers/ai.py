from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import base64
import PyPDF2
import io
from ..services.gemini_service import gemini_service

router = APIRouter(prefix="/ai", tags=["ai"])

class PolicyTextRequest(BaseModel):
    policy_text: str

class QuestionRequest(BaseModel):
    question: str
    policy_data: Dict[str, Any]
    conversation_history: Optional[List[Dict[str, str]]] = None

class BillValidationRequest(BaseModel):
    bill_image_base64: str
    policy_data: Dict[str, Any]

class OptimizationRequest(BaseModel):
    policy_data: Dict[str, Any]
    user_needs: Dict[str, Any]

class PreVisitRequest(BaseModel):
    visit_type: str
    policy_data: Dict[str, Any]
    provider_info: Optional[Dict[str, Any]] = None

class AppealRequest(BaseModel):
    denial_info: Dict[str, Any]
    policy_data: Dict[str, Any]
    tone: str = "professional"

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
        import google.generativeai as genai
        models = []
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                models.append({
                    "name": model.name,
                    "display_name": model.display_name,
                    "description": model.description[:100] if model.description else None,
                    "input_token_limit": model.input_token_limit,
                })
        return {"models": models}
    except Exception as e:
        return {"error": str(e)}

@router.post("/analyze-policy")
async def analyze_policy(request: PolicyTextRequest):
    """Analyze insurance policy text and extract all parameters."""
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    result = await gemini_service.analyze_insurance_policy(request.policy_text)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.post("/upload-policy")
async def upload_policy(file: UploadFile = File(...)):
    """Upload and analyze a policy document (PDF or image)."""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Received file upload: {file.filename}, content_type: {file.content_type}")
    
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
            # For images, use Gemini's vision capability
            logger.info("Processing image file")
            try:
                from PIL import Image
                image = Image.open(io.BytesIO(content))
                logger.info(f"Image size: {image.size}, format: {image.format}")
                
                # Use the vision model from gemini_service
                import google.generativeai as genai
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content([
                    "Extract all text from this insurance policy document. Return only the extracted text, nothing else.",
                    image
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
async def ask_policy_question(request: QuestionRequest):
    """Ask a question about the insurance policy."""
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    result = await gemini_service.answer_policy_question(
        request.question,
        request.policy_data,
        request.conversation_history
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

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
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    import json
    policy = json.loads(policy_data)
    
    content = await file.read()
    image_base64 = base64.b64encode(content).decode()
    
    result = await gemini_service.validate_bill_against_policy(image_base64, policy)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

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
    if not gemini_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    import json
    policy = json.loads(policy_data)
    
    content = await file.read()
    image_base64 = base64.b64encode(content).decode()
    
    # First extract denial info from the image
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
    
    try:
        # Extract denial info using vision model
        response = await gemini_service.vision_model.generate_content([
            denial_extraction_prompt,
            {"mime_type": "image/jpeg", "data": image_base64}
        ])
        
        text = response.text
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            denial_info = json.loads(text[start:end])
        else:
            raise Exception("Could not extract denial information")
        
        # Generate appeal letter
        result = await gemini_service.generate_appeal_letter(
            denial_info,
            policy,
            tone
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Include extracted denial info in response
        result["extracted_denial_info"] = denial_info
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process denial letter: {str(e)}")
