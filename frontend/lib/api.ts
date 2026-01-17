const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  programs: any[];
  total_potential_savings: number;
  recommended_programs: string[];
  application_priority_order: string[];
  additional_notes: string[];
}

export interface PaymentPlanOption {
  plan_type: string;
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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
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
    return this.request<{ issues: any[] }>('/api/v1/bills/analyze', {
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
    return this.request<NavigationPlan>('/api/v1/navigation/plan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeSituation(data: {
    bills: MedicalBill[];
    insurance: InsuranceInfo;
    monthly_income: number;
    household_size: number;
  }) {
    return this.request<any>('/api/v1/navigation/analyze-situation', {
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
    return this.request<AssistanceMatch>('/api/v1/assistance/match', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAssistancePrograms() {
    return this.request<{ programs: any[] }>('/api/v1/assistance/programs');
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
}

export const api = new ApiClient();
