const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    retries: number = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Retry on 5xx errors with exponential backoff
        if (response.status >= 500 && retries < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retries), 10000); // Max 10 seconds
          await new Promise(r => setTimeout(r, delay));
          return this.request<T>(endpoint, options, retries + 1);
        }
        
        // Handle different error types
        if (response.status === 429) {
          throw new ApiError(
            'Too many requests. Please try again later.',
            response.status,
            errorData
          );
        }
        
        if (response.status >= 400 && response.status < 500) {
          throw new ApiError(
            errorData.message || errorData.detail || 'Request failed',
            response.status,
            errorData
          );
        }
        
        throw new ApiError(
          errorData.detail || `Server error: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) throw error;
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timed out. Please try again.', 0);
      }
      
      if (!navigator.onLine) {
        throw new ApiError('You appear to be offline. Please check your internet connection.', 0);
      }
      
      // Retry on network errors with exponential backoff
      if (retries < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retries), 10000); // Max 10 seconds
        await new Promise(r => setTimeout(r, delay));
        return this.request<T>(endpoint, options, retries + 1);
      }
      
      throw new ApiError(
        'Network error. Please check your connection and try again.',
        0
      );
    }
  }

  async getServices() {
    return this.request<{ services: any[] }>('/api/v1/cost/services');
  }

  async estimateCost(data: {
    service_code: string;
    insurance: InsuranceInfo;
    location?: string;
    is_emergency?: boolean;
    in_network?: boolean;
  }) {
    return this.request<CostEstimate>('/api/v1/cost/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeInsurance(data: {
    insurance: InsuranceInfo;
    bills?: MedicalBill[];
  }) {
    return this.request<any>('/api/v1/insurance/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInsuranceTypes() {
    return this.request<{ insurance_types: any[] }>('/api/v1/insurance/types');
  }

  async analyzeBills(data: { bills: MedicalBill[] }) {
    return this.request<{ issues: any[] }>('/api/v1/insurance/analyze/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateItemization(bill: MedicalBill) {
    return this.request<any>('/api/v1/bills/itemize', {
      method: 'POST',
      body: JSON.stringify(bill),
    });
  }

  async createNavigationPlan(data: {
    bills: MedicalBill[];
    insurance: InsuranceInfo;
    monthly_income: number;
    household_size: number;
  }) {
    return this.request<any>('/api/v1/navigation/plan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async matchAssistance(data: {
    insurance: InsuranceInfo;
    monthly_income: number;
    household_size: number;
    medical_bills?: MedicalBill[];
    hardship_level?: string;
    diagnoses?: string[];
    prescriptions?: string[];
  }) {
    return this.request<any>('/api/v1/assistance/match', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generatePaymentPlans(data: {
    total_debt: number;
    monthly_income: number;
    credit_score?: number;
    debt_to_income_ratio?: number;
    hardship?: boolean;
  }) {
    return this.request<{ plans: PaymentPlanOption[] }>('/api/v1/payment-plans/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recommendBestPlan(data: {
    total_debt: number;
    monthly_income: number;
    credit_score?: number;
    debt_to_income_ratio?: number;
    hardship?: boolean;
  }) {
    return this.request<PaymentPlanOption>('/api/v1/payment-plans/recommend', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitFeedback(data: {
    rating: number;
    category?: string;
    comments: string;
    name?: string;
    email?: string;
  }) {
    return this.request<{ success: boolean; message: string }>('/api/v1/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkAIHealth() {
    return this.request<{ status: string; ai_configured: boolean }>('/api/v1/ai/health');
  }

  async uploadPolicy(file: File): Promise<{ policy_data: PolicyData }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseUrl}/api/v1/ai/upload-policy`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload policy');
    }
    
    return response.json();
  }

  async askPolicyQuestion(
    question: string,
    policyData: PolicyData,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<QuestionAnswer> {
    return this.request<QuestionAnswer>('/api/v1/ai/ask-question', {
      method: 'POST',
      body: JSON.stringify({
        question,
        policy_data: policyData,
        conversation_history: conversationHistory,
      }),
    });
  }

  async uploadBill(file: File, policyData: PolicyData): Promise<BillValidationResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('policy_data', JSON.stringify(policyData));
    
    const response = await fetch(`${this.baseUrl}/api/v1/ai/upload-bill`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to validate bill');
    }
    
    return response.json();
  }

  async optimizePolicy(
    policyData: PolicyData,
    userNeeds: any
  ): Promise<OptimizationResult> {
    return this.request<OptimizationResult>('/api/v1/ai/optimize-policy', {
      method: 'POST',
      body: JSON.stringify({
        policy_data: policyData,
        user_needs: userNeeds,
      }),
    });
  }

  async generatePreVisitChecklist(
    visitType: string,
    policyData: PolicyData,
    providerInfo?: any
  ): Promise<PreVisitChecklist> {
    return this.request<PreVisitChecklist>('/api/v1/ai/pre-visit-checklist', {
      method: 'POST',
      body: JSON.stringify({
        visit_type: visitType,
        policy_data: policyData,
        provider_info: providerInfo,
      }),
    });
  }

  async generateAppealLetter(
    denialInfo: DenialInfo,
    policyData: PolicyData,
    tone: string = 'professional'
  ): Promise<AppealLetter> {
    return this.request<AppealLetter>('/api/v1/ai/generate-appeal', {
      method: 'POST',
      body: JSON.stringify({
        denial_info: denialInfo,
        policy_data: policyData,
        tone: tone,
      }),
    });
  }

  async uploadDenialLetter(
    file: File,
    policyData: PolicyData,
    tone: string = 'professional'
  ): Promise<AppealLetter & { extracted_denial_info: DenialInfo }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('policy_data', JSON.stringify(policyData));
    formData.append('tone', tone);
    
    const response = await fetch(`${this.baseUrl}/api/v1/ai/upload-denial`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to process denial letter');
    }
    
    return response.json();
  }
}

export const api = new ApiClient();
export { ApiError };

// Type definitions
export interface InsuranceInfo {
  insurance_type: string;
  provider_name?: string;
  plan_type?: string;
  annual_deductible: number;
  deductible_met: number;
  annual_out_of_pocket_max: number;
  out_of_pocket_met: number;
  copay_amount: number;
  coinsurance_rate: number;
  coverage_percentage: number;
}

export interface MedicalBill {
  provider_name: string;
  service_date?: string;
  total_amount: number;
  patient_responsibility: number;
  insurance_paid?: number;
  insurance_adjustments?: number;
  service_codes?: string[];
  description?: string;
  is_itemized?: boolean;
}

export interface CostEstimate {
  service_name: string;
  base_cost: number;
  estimated_range: [number, number];
  location_multiplier: number;
  with_insurance: number;
  out_of_pocket: number;
  alternatives: any[];
}

export interface NavigationPlan {
  risk_level: string;
  hardship_level: string;
  total_medical_debt: number;
  debt_to_income_ratio: number;
  coverage_gaps: any[];
  action_plan: any[];
  estimated_total_savings: number;
  recommended_timeline: string;
  summary: string;
}

export interface AssistanceMatch {
  program_name: string;
  provider: string;
  eligibility_criteria: string[];
  application_process: string[];
  benefits_description: string;
  contact_info: string;
  deadline?: string;
  success_rate?: number;
  estimated_savings?: number;
}

export interface PaymentPlanOption {
  plan_type: string;
  provider: string;
  monthly_payment: number;
  total_repayment: number;
  term_months: number;
  interest_rate: number;
  total_interest: number;
  pros: string[];
  cons: string[];
  eligibility_criteria: string[];
  recommendation_score: number;
}

// AI-related interfaces
export interface PolicyData {
  policy_number?: string;
  policy_holder_name?: string;
  insurance_company?: string;
  plan_name?: string;
  plan_type?: string;
  annual_deductible_individual?: number;
  annual_deductible_family?: number;
  out_of_pocket_max_individual?: number;
  out_of_pocket_max_family?: number;
  copay_primary_care?: number;
  copay_specialist?: number;
  copay_emergency?: number;
  coinsurance_in_network?: number;
  coinsurance_out_of_network?: number;
  policy_strength_score?: number;
  coverage_gaps?: string[];
  key_benefits?: string[];
  recommendations?: string[];
  [key: string]: any;
}

export interface BillValidationResult {
  bill_extracted: any;
  validation_results: {
    services_covered: string[];
    services_not_covered: string[];
    deductible_applied_correctly: boolean;
    copays_correct: boolean;
    coinsurance_correct: boolean;
  };
  issues_found: string[];
  financial_summary: {
    billed_amount: number;
    expected_insurance_payment: number;
    expected_patient_responsibility: number;
    actual_patient_responsibility: number;
    potential_savings: number;
  };
  recommendations: string[];
  confidence_score: number;
}

export interface QuestionAnswer {
  answer: string;
  relevant_policy_details: string[];
  estimated_costs?: any;
  warnings: string[];
  follow_up_questions: string[];
  confidence: number;
}

export interface OptimizationResult {
  current_plan_rating: number;
  fit_for_needs: string;
  annual_potential_savings: number;
  optimizations: Array<{
    category: string;
    recommendation: string;
    potential_savings: number;
    effort_level: string;
    priority: number;
  }>;
  alternative_plans: Array<{
    plan_type: string;
    why_consider: string;
    estimated_premium_change: number;
    coverage_trade_offs: string;
    best_for: string;
  }>;
  action_items: Array<{
    action: string;
    timeline: string;
    priority: number;
  }>;
  summary: string;
}

export interface PreVisitChecklist {
  visit_type: string;
  estimated_costs: {
    typical_range_low: number;
    typical_range_high: number;
    your_cost_low: number;
    your_cost_high: number;
    deductible_applies: boolean;
    deductible_remaining: number | null;
    coinsurance_rate: number;
    copay_if_applicable: number | null;
  };
  prior_authorization: {
    likely_required: boolean;
    reason: string;
    how_to_obtain: string;
    typical_timeline: string;
    consequence_if_skipped: string;
  };
  questions_to_ask_provider: string[];
  questions_to_ask_insurance: string[];
  documents_to_request_after: string[];
  network_warnings: string[];
  money_saving_tips: string[];
  coverage_summary: string;
}

export interface AppealLetter {
  analysis: {
    denial_weakness: string;
    supporting_policy_language: string[];
    applicable_regulations: string[];
    success_likelihood: 'High' | 'Medium' | 'Low';
    success_reasoning: string;
  };
  letter: {
    subject_line: string;
    letter_body: string;
    attachments_needed: string[];
    deadline: string;
  };
  next_steps: string[];
}

export interface DenialInfo {
  denial_date?: string;
  service_description?: string;
  service_date?: string;
  amount_denied?: number;
  denial_reason?: string;
  denial_code?: string;
  insurer_name?: string;
  claim_number?: string;
}
