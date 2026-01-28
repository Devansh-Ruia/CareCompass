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
