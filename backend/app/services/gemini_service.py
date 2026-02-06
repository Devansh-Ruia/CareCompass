import google.generativeai as genai
import os
import json
import base64
import logging
import traceback
from typing import Optional, Dict, Any, List
from PIL import Image
import io

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.client = genai
        else:
            self.client = None
    
    def is_configured(self) -> bool:
        return self.client is not None

    async def analyze_insurance_policy(self, policy_text: str) -> Dict[str, Any]:
        """Extract and analyze all parameters from an insurance policy."""
        
        prompt = """You are an expert insurance analyst. Analyze this insurance policy document and extract parameters in a FLAT JSON structure.

IMPORTANT: Return a flat JSON object with these EXACT keys. Do NOT use nested objects.

MONETARY VALUES: Return as NUMBERS (e.g., 500, not "$500")
PERCENTAGES: Return as NUMBERS (e.g., 20, not "20%")
BOOLEANS: Use true/false, not "Yes"/"No"
ARRAYS: Use [] for empty arrays, null for missing values

REQUIRED KEYS:
{
  "policy_number": "string or null",
  "policy_holder_name": "string or null", 
  "insurance_company": "string or null",
  "plan_name": "string or null",
  "plan_type": "PPO/HMO/EPO/POS/HDHP or null",
  
  "annual_deductible_individual": "number or null",
  "annual_deductible_family": "number or null",
  "out_of_pocket_max_individual": "number or null", 
  "out_of_pocket_max_family": "number or null",
  "lifetime_maximum": "number or null",
  
  "copay_primary_care": "number or null",
  "copay_specialist": "number or null",
  "copay_urgent_care": "number or null",
  "copay_emergency": "number or null",
  
  "coinsurance_in_network": "number or null",
  "coinsurance_out_of_network": "number or null",
  
  "prescription_copay_generic": "number or null",
  "prescription_copay_brand": "number or null", 
  "prescription_copay_specialty": "number or null",
  
  "preventive_care_covered": "boolean or null",
  "mental_health_covered": "boolean or null",
  "substance_abuse_covered": "boolean or null",
  "maternity_coverage": "boolean or null",
  "pediatric_coverage": "boolean or null",
  "adult_dental_covered": "boolean or null",
  "adult_vision_covered": "boolean or null",
  "physical_therapy_visits": "number or null",
  "chiropractic_visits": "number or null",
  
  "referral_required": "boolean or null",
  "hsa_eligible": "boolean or null",
  "fsa_eligible": "boolean or null",
  "telehealth_covered": "boolean or null",
  
  "excluded_services": ["array of strings or empty array"],
  "coverage_gaps": ["array of strings or empty array"], 
  "key_benefits": ["array of strings or empty array"],
  "recommendations": ["array of strings or empty array"],
  
  "policy_strength_score": "number 1-100 or null"
}

POLICY DOCUMENT:
"""
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(
                prompt + policy_text,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            
            # Parse JSON response
            result = json.loads(response.text)
            
            # Normalize the data to ensure correct types
            return self._normalize_policy_data(result)
            
        except Exception as e:
            return {"error": str(e)}

    def _normalize_policy_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize policy data to ensure correct data types."""
        normalized = {}
        
        # Monetary fields that should be numbers
        monetary_fields = [
            'annual_deductible_individual', 'annual_deductible_family',
            'out_of_pocket_max_individual', 'out_of_pocket_max_family',
            'lifetime_maximum', 'copay_primary_care', 'copay_specialist',
            'copay_urgent_care', 'copay_emergency', 'prescription_copay_generic',
            'prescription_copay_brand', 'prescription_copay_specialty',
            'physical_therapy_visits', 'chiropractic_visits'
        ]
        
        # Percentage fields that should be numbers
        percentage_fields = [
            'coinsurance_in_network', 'coinsurance_out_of_network'
        ]
        
        # Boolean fields
        boolean_fields = [
            'preventive_care_covered', 'mental_health_covered',
            'substance_abuse_covered', 'maternity_coverage', 'pediatric_coverage',
            'adult_dental_covered', 'adult_vision_covered', 'referral_required',
            'hsa_eligible', 'fsa_eligible', 'telehealth_covered'
        ]
        
        # Array fields
        array_fields = [
            'excluded_services', 'coverage_gaps', 'key_benefits', 'recommendations'
        ]
        
        for key, value in data.items():
            if key in monetary_fields:
                # Convert monetary strings like "$500" to numbers like 500
                if isinstance(value, str):
                    # Remove currency symbols and convert to number
                    clean_value = value.replace('$', '').replace(',', '').strip()
                    try:
                        normalized[key] = float(clean_value)
                    except ValueError:
                        normalized[key] = None
                elif isinstance(value, (int, float)):
                    normalized[key] = value
                else:
                    normalized[key] = None
                    
            elif key in percentage_fields:
                # Convert percentage strings like "20%" to numbers like 20
                if isinstance(value, str):
                    clean_value = value.replace('%', '').strip()
                    try:
                        normalized[key] = float(clean_value)
                    except ValueError:
                        normalized[key] = None
                elif isinstance(value, (int, float)):
                    normalized[key] = value
                else:
                    normalized[key] = None
                    
            elif key in boolean_fields:
                # Convert various boolean representations to actual booleans
                if isinstance(value, bool):
                    normalized[key] = value
                elif isinstance(value, str):
                    lower_value = value.lower().strip()
                    if lower_value in ['true', 'yes', 'y', 'covered', 'included']:
                        normalized[key] = True
                    elif lower_value in ['false', 'no', 'n', 'not covered', 'excluded']:
                        normalized[key] = False
                    else:
                        normalized[key] = None
                else:
                    normalized[key] = None
                    
            elif key in array_fields:
                # Ensure array fields are always arrays
                if isinstance(value, list):
                    normalized[key] = value
                elif value is None:
                    normalized[key] = []
                else:
                    normalized[key] = [str(value)]
                    
            elif key == 'policy_strength_score':
                # Ensure policy strength score is a number
                if isinstance(value, (int, float)):
                    normalized[key] = value
                elif isinstance(value, str):
                    try:
                        normalized[key] = float(value)
                    except ValueError:
                        normalized[key] = None
                else:
                    normalized[key] = None
                    
            else:
                # String fields - keep as is or convert to string
                if value is None:
                    normalized[key] = None
                else:
                    normalized[key] = str(value)
        
        return normalized

    async def validate_bill_against_policy(
        self, 
        bill_image_base64: str, 
        policy_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze a bill image and validate against the insurance policy."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info("=== VALIDATE BILL START ===")
        
        # Simplified prompt that's more likely to return valid JSON
        prompt = f"""Analyze this medical bill image and validate it against the insurance policy.

POLICY DETAILS:
{json.dumps(policy_data, indent=2)}

Extract bill information and validate charges. Return ONLY valid JSON (no markdown, no explanation):

{{
  "bill_extracted": {{
    "provider_name": "string or null",
    "service_date": "string or null", 
    "total_charges": 0,
    "patient_responsibility": 0,
    "line_items": []
  }},
  "validation_results": {{
    "services_covered": [],
    "services_not_covered": [],
    "deductible_applied_correctly": true,
    "copays_correct": true,
    "coinsurance_correct": true
  }},
  "issues_found": [],
  "financial_summary": {{
    "billed_amount": 0,
    "expected_insurance_payment": 0,
    "expected_patient_responsibility": 0,
    "actual_patient_responsibility": 0,
    "potential_savings": 0
  }},
  "recommendations": [],
  "confidence_score": 50
}}

If you cannot read the bill, return the JSON structure with null/empty values and confidence_score of 10."""

        try:
            # Step 1: Decode base64
            logger.info("Step 1: Decoding base64 image")
            try:
                image_data = base64.b64decode(bill_image_base64)
                logger.info(f"Decoded {len(image_data)} bytes")
            except Exception as e:
                logger.error(f"Base64 decode failed: {e}")
                return {"error": f"Invalid image data: {str(e)}"}
            
            # Step 2: Open image with PIL
            logger.info("Step 2: Opening image with PIL")
            try:
                image = Image.open(io.BytesIO(image_data))
                logger.info(f"Image: size={image.size}, format={image.format}, mode={image.mode}")
                
                # Convert RGBA/P to RGB (Gemini may not support all modes)
                if image.mode in ('RGBA', 'P', 'LA', 'L'):
                    logger.info(f"Converting {image.mode} to RGB")
                    if image.mode == 'P':
                        image = image.convert('RGBA')
                    if image.mode in ('RGBA', 'LA'):
                        # Create white background for transparency
                        background = Image.new('RGB', image.size, (255, 255, 255))
                        if image.mode == 'RGBA':
                            background.paste(image, mask=image.split()[3])
                        else:
                            background.paste(image, mask=image.split()[1])
                        image = background
                    elif image.mode == 'L':
                        image = image.convert('RGB')
                    logger.info(f"Converted to mode: {image.mode}")
                    
            except Exception as e:
                logger.error(f"PIL image open failed: {e}")
                return {"error": f"Cannot process image: {str(e)}"}
            
            # Step 3: Call Gemini Vision API
            logger.info("Step 3: Calling Gemini Vision API")
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(
                    [prompt, image],
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,  # Lower temperature for more consistent JSON
                    )
                )
                
                if not response or not response.text:
                    logger.error("Gemini returned empty response")
                    return {"error": "AI returned empty response"}
                    
                text = response.text
                logger.info(f"Gemini response length: {len(text)}")
                logger.info(f"Gemini response preview: {text[:500]}...")
                
            except Exception as e:
                logger.error(f"Gemini API call failed: {type(e).__name__}: {e}")
                return {"error": f"AI analysis failed: {str(e)}"}
            
            # Step 4: Parse JSON from response
            logger.info("Step 4: Parsing JSON response")
            try:
                # Remove markdown code blocks if present
                clean_text = text.strip()
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                if clean_text.startswith("```"):
                    clean_text = clean_text[3:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                clean_text = clean_text.strip()
                
                # Find JSON object
                start = clean_text.find('{')
                end = clean_text.rfind('}') + 1
                
                if start == -1 or end <= start:
                    logger.error(f"No JSON object found in response")
                    logger.error(f"Full response: {text}")
                    return {
                        "error": "AI response was not valid JSON",
                        "raw_response": text[:1000],
                        # Return a default structure so the frontend doesn't break
                        "bill_extracted": {"provider_name": None, "total_charges": 0},
                        "validation_results": {
                            "services_covered": [],
                            "services_not_covered": [],
                            "deductible_applied_correctly": None,
                            "copays_correct": None,
                            "coinsurance_correct": None
                        },
                        "issues_found": ["Could not analyze bill - please try with a clearer image"],
                        "financial_summary": {
                            "billed_amount": 0,
                            "expected_insurance_payment": 0,
                            "expected_patient_responsibility": 0,
                            "actual_patient_responsibility": 0,
                            "potential_savings": 0
                        },
                        "recommendations": ["Try uploading a clearer image of the bill"],
                        "confidence_score": 0
                    }
                
                json_str = clean_text[start:end]
                result = json.loads(json_str)
                logger.info(f"JSON parsed successfully, keys: {list(result.keys())}")
                
                logger.info("=== VALIDATE BILL SUCCESS ===")
                return result
                
            except json.JSONDecodeError as e:
                logger.error(f"JSON parse failed: {e}")
                logger.error(f"Attempted to parse: {clean_text[:500] if 'clean_text' in dir() else text[:500]}")
                return {
                    "error": f"Could not parse AI response as JSON: {str(e)}",
                    "raw_response": text[:1000],
                    "bill_extracted": {"provider_name": None, "total_charges": 0},
                    "validation_results": {
                        "services_covered": [],
                        "services_not_covered": [],
                        "deductible_applied_correctly": None,
                        "copays_correct": None,
                        "coinsurance_correct": None
                    },
                    "issues_found": ["AI response was malformed - please try again"],
                    "financial_summary": {
                        "billed_amount": 0,
                        "expected_insurance_payment": 0,
                        "expected_patient_responsibility": 0,
                        "actual_patient_responsibility": 0,
                        "potential_savings": 0
                    },
                    "recommendations": ["Try uploading again or use a different image"],
                    "confidence_score": 0
                }
                
        except Exception as e:
            logger.error(f"=== VALIDATE BILL FAILED ===")
            logger.error(f"Unexpected error: {type(e).__name__}: {e}")
            import traceback
            logger.error(f"Traceback:\n{traceback.format_exc()}")
            return {"error": str(e)}

    async def answer_policy_question(
        self, 
        question: str, 
        policy_data: Dict[str, Any],
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Answer questions about the insurance policy."""
        
        history_text = ""
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                history_text += f"\n{msg['role'].upper()}: {msg['content']}"
        
        prompt = f"""You are an expert insurance advisor helping a patient understand their insurance policy. Be helpful, clear, and specific.

INSURANCE POLICY DETAILS:
{json.dumps(policy_data, indent=2)}

CONVERSATION HISTORY:{history_text}

USER QUESTION: {question}

Provide a clear, helpful answer that:
1. Directly answers their question using policy details
2. Cites specific numbers/limits from their policy when relevant
3. Explains any medical billing terms in simple language
4. Warns about any gotchas or things to watch out for
5. Suggests follow-up questions they might want to ask

If the question involves cost estimation, provide:
- Estimated cost breakdown
- What they'll pay vs insurance
- Whether deductible applies
- Any prior authorization needed

Return as JSON:
{{
  "answer": "detailed answer text",
  "relevant_policy_details": ["list of relevant policy points"],
  "estimated_costs": {{}} or null if not applicable,
  "warnings": ["any important warnings"],
  "follow_up_questions": ["suggested follow-up questions"],
  "confidence": 1-100
}}
"""
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            text = response.text
            
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                return json.loads(text[start:end])
            return {"answer": text, "confidence": 70}
        except Exception as e:
            return {"error": str(e)}

    async def recommend_policy_alternatives(
        self, 
        current_policy: Dict[str, Any],
        user_needs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Recommend optimizations or alternative policies."""
        
        prompt = f"""You are an expert insurance advisor. Analyze this patient's current insurance policy and their healthcare needs to provide optimization recommendations.

CURRENT POLICY:
{json.dumps(current_policy, indent=2)}

USER HEALTHCARE NEEDS:
{json.dumps(user_needs, indent=2)}

Provide comprehensive recommendations:

1. **Current Policy Analysis**:
   - Is this policy appropriate for their needs?
   - Are they overpaying for coverage they don't use?
   - Are they underinsured for their actual healthcare usage?

2. **Cost Optimization**:
   - Ways to reduce premiums while maintaining coverage
   - HSA/FSA optimization strategies
   - Network optimization (staying in-network)
   - Generic medication alternatives

3. **Coverage Optimization**:
   - Gaps in current coverage vs their needs
   - Riders or add-ons they should consider
   - Coverage they're paying for but not using

4. **Alternative Plan Types**:
   - Would they benefit from a different plan type (HMO vs PPO, HDHP, etc.)?
   - Estimated savings with alternatives
   - Trade-offs of each option

5. **Action Items**:
   - Immediate steps to optimize current plan
   - Questions to ask during next open enrollment
   - Things to track/document before switching

Return as JSON:
{{
  "current_plan_rating": 1-100,
  "fit_for_needs": "good/fair/poor",
  "annual_potential_savings": number,
  "optimizations": [
    {{
      "category": "string",
      "recommendation": "string",
      "potential_savings": number,
      "effort_level": "low/medium/high",
      "priority": 1-5
    }}
  ],
  "alternative_plans": [
    {{
      "plan_type": "string",
      "why_consider": "string",
      "estimated_premium_change": number,
      "coverage_trade_offs": "string",
      "best_for": "string"
    }}
  ],
  "action_items": [
    {{
      "action": "string",
      "timeline": "string",
      "priority": 1-5
    }}
  ],
  "summary": "string"
}}
"""
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            text = response.text
            
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                return json.loads(text[start:end])
            return {"error": "Could not generate recommendations", "raw_response": text}
        except Exception as e:
            return {"error": str(e)}

    async def generate_pre_visit_checklist(
        self,
        visit_type: str,
        policy_data: Dict[str, Any],
        provider_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate a comprehensive pre-visit checklist for a specific medical visit type."""
        
        prompt = f"""You are a healthcare financial advisor. Based on this insurance policy, generate a comprehensive pre-visit checklist for: {visit_type}

POLICY DETAILS:
{json.dumps(policy_data, indent=2)}

PROVIDER INFO (if any):
{json.dumps(provider_info, indent=2) if provider_info else "Not specified"}

Generate a JSON response with this exact structure:
{{
  "visit_type": "{visit_type}",
  "estimated_costs": {{
    "typical_range_low": number,
    "typical_range_high": number,
    "your_cost_low": number,
    "your_cost_high": number,
    "deductible_applies": boolean,
    "deductible_remaining": number or null,
    "coinsurance_rate": number,
    "copay_if_applicable": number or null
  }},
  "prior_authorization": {{
    "likely_required": boolean,
    "reason": "string explaining why or why not",
    "how_to_obtain": "string with specific steps",
    "typical_timeline": "string (e.g., 3-5 business days)",
    "consequence_if_skipped": "string explaining risks"
  }},
  "questions_to_ask_provider": ["list of 4-6 specific questions to ask the doctor/office"],
  "questions_to_ask_insurance": ["list of 2-3 questions to call insurance about"],
  "documents_to_request_after": ["list of documents to get after the visit"],
  "network_warnings": ["potential out-of-network issues to watch for"],
  "money_saving_tips": ["3-5 specific tips based on this policy"],
  "coverage_summary": "2-3 sentence plain English summary of what this visit will cost"
}}

IMPORTANT GUIDELINES:
- Use realistic cost ranges based on national averages for this visit type
- Calculate actual patient responsibility based on their specific policy terms
- Consider deductible status, copays, and coinsurance
- Be specific about prior authorization requirements
- Include practical, actionable advice
- Use plain English - no insurance jargon without explanation
- All monetary values should be numbers (not strings with $)
"""
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            text = response.text
            
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                return json.loads(text[start:end])
            return {"error": "Could not generate pre-visit checklist", "raw_response": text}
        except Exception as e:
            return {"error": str(e)}

    async def generate_appeal_letter(
        self,
        denial_info: Dict[str, Any],
        policy_data: Dict[str, Any],
        tone: str = "professional"  # professional, firm, escalation
    ) -> Dict[str, Any]:
        """Generate a compelling appeal letter for a denied claim."""
        
        prompt = f"""You are an expert healthcare advocate and insurance appeals specialist. 
Generate a compelling appeal letter for this denied claim.

DENIAL INFORMATION:
{json.dumps(denial_info, indent=2)}

PATIENT'S POLICY DETAILS:
{json.dumps(policy_data, indent=2)}

TONE: {tone}

Your task:
1. Analyze why the denial may be incorrect based on the policy language
2. Identify specific policy sections that support coverage
3. Reference applicable federal/state regulations
4. Create a professional appeal letter that:
   - States the facts clearly
   - Cites specific policy language
   - Explains medical necessity
   - References relevant laws (ACA, ERISA, state regulations)
   - Requests specific action and timeline
   - Mentions external review rights

Return JSON with this exact structure:
{{
  "analysis": {{
    "denial_weakness": "string explaining why their denial is likely wrong",
    "supporting_policy_language": ["list of specific policy quotes that support coverage"],
    "applicable_regulations": ["list of laws/regulations that apply"],
    "success_likelihood": "High/Medium/Low",
    "success_reasoning": "string explaining the likelihood assessment"
  }},
  "letter": {{
    "subject_line": "string with proper appeal subject line",
    "letter_body": "string with full formatted letter text including salutation and closing",
    "attachments_needed": ["list of documents to include with appeal"],
    "deadline": "string explaining when to submit by (usually 180 days from denial)"
  }},
  "next_steps": [
    "string explaining step 1 if this appeal is denied",
    "string explaining how to request external review",
    "string explaining state insurance commissioner contact if needed"
  ]
}}

IMPORTANT GUIDELINES:
- Be thorough and professional
- Cite specific policy language when possible
- Reference real regulations (ACA, No Surprises Act, state laws)
- Include practical next steps
- Format letter properly with appropriate tone
- Make it actionable and specific to this denial
"""
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            text = response.text
            
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                return json.loads(text[start:end])
            return {"error": "Could not generate appeal letter", "raw_response": text}
        except Exception as e:
            return {"error": str(e)}

# Singleton instance
gemini_service = GeminiService()
