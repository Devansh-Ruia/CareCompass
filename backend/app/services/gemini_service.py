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

# Singleton instance
gemini_service = GeminiService()
