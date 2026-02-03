import google.generativeai as genai
import os
import json
import base64
from typing import Optional, Dict, Any, List
from PIL import Image
import io

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            # Use gemini-2.5-flash for both text and vision (it supports both)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
            self.vision_model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None
            self.vision_model = None
    
    def is_configured(self) -> bool:
        return self.model is not None

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
            response = self.model.generate_content(
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
        
        prompt = f"""You are an expert medical billing analyst. Analyze this hospital/medical bill image and validate it against the patient's insurance policy.

INSURANCE POLICY DETAILS:
{json.dumps(policy_data, indent=2)}

TASKS:
1. **Extract Bill Details**:
   - provider_name, service_date, bill_date
   - List all line items with: service_code (CPT/HCPCS), description, quantity, unit_price, total_price
   - total_charges, insurance_adjustments, insurance_paid, patient_responsibility

2. **Validate Against Policy**:
   - Check if each service is covered under the policy
   - Verify copays match policy terms
   - Check if deductible was properly applied
   - Verify coinsurance calculations
   - Check if out-of-pocket max was considered

3. **Identify Issues**:
   - billing_errors: list of potential errors (duplicate charges, wrong codes, etc.)
   - coverage_issues: services that should be covered but weren't
   - overcharges: amounts that seem higher than typical
   - missing_adjustments: insurance adjustments that should have been applied

4. **Calculate Correct Amounts**:
   - expected_insurance_payment
   - expected_patient_responsibility
   - potential_savings (if errors found)

5. **Recommendations**:
   - List specific actions to take
   - Questions to ask the provider
   - Appeals to file if applicable

Return as JSON with these exact fields:
{{
  "bill_extracted": {{...}},
  "validation_results": {{
    "services_covered": [],
    "services_not_covered": [],
    "deductible_applied_correctly": boolean,
    "copays_correct": boolean,
    "coinsurance_correct": boolean
  }},
  "issues_found": [],
  "financial_summary": {{
    "billed_amount": number,
    "expected_insurance_payment": number,
    "expected_patient_responsibility": number,
    "actual_patient_responsibility": number,
    "potential_savings": number
  }},
  "recommendations": [],
  "confidence_score": 1-100
}}

Analyze the bill image now:"""

        try:
            # Decode base64 image
            image_data = base64.b64decode(bill_image_base64)
            image = Image.open(io.BytesIO(image_data))
            
            response = self.vision_model.generate_content([prompt, image])
            text = response.text
            
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                return json.loads(text[start:end])
            return {"error": "Could not parse bill analysis", "raw_response": text}
        except Exception as e:
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
            response = self.model.generate_content(prompt)
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
            response = self.model.generate_content(prompt)
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
            response = self.model.generate_content(prompt)
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
            response = self.model.generate_content(prompt)
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
