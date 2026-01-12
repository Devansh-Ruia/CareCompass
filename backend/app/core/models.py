from typing import List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class InsuranceType(str, Enum):
    PRIVATE = "private"
    MEDICARE = "medicare"
    MEDICAID = "medicaid"
    VA = "va"
    TRICARE = "tricare"
    UNINSURED = "uninsured"


class FinancialHardshipLevel(str, Enum):
    NONE = "none"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


class ServiceType(BaseModel):
    code: str
    name: str
    category: str
    base_cost: float
    description: str


class InsuranceInfo(BaseModel):
    insurance_type: InsuranceType
    provider_name: str | None = None
    plan_type: str | None = None
    annual_deductible: float = 0.0
    deductible_met: float = 0.0
    annual_out_of_pocket_max: float = 0.0
    out_of_pocket_met: float = 0.0
    copay_amount: float = 0.0
    coinsurance_rate: float = 0.0
    coverage_percentage: float = 0.0


class MedicalBill(BaseModel):
    provider_name: str
    service_date: datetime | None = None
    total_amount: float
    patient_responsibility: float
    insurance_paid: float = 0.0
    insurance_adjustments: float = 0.0
    service_codes: List[str] = []
    description: str = ""
    is_itemized: bool = False


class BillAnalysisIssue(BaseModel):
    issue_type: str
    severity: str
    description: str
    potential_savings: float
    recommendation: str


class CostEstimate(BaseModel):
    service_name: str
    base_cost: float
    estimated_range: tuple[float, float]
    location_multiplier: float
    with_insurance: float
    out_of_pocket: float
    alternatives: List[Dict[str, Any]] = []


class InsuranceCoverageGap(BaseModel):
    gap_type: str
    description: str
    impact: str
    recommendation: str


class ActionItem(BaseModel):
    priority: int
    action: str
    category: str
    estimated_savings: float | None = None
    estimated_timeframe: str | None = None
    description: str


class NavigationPlan(BaseModel):
    risk_level: RiskLevel
    hardship_level: FinancialHardshipLevel
    total_medical_debt: float
    debt_to_income_ratio: float
    coverage_gaps: List[InsuranceCoverageGap]
    action_plan: List[ActionItem]
    estimated_total_savings: float
    recommended_timeline: str
    summary: str


class AssistanceProgram(BaseModel):
    program_name: str
    provider_type: str
    eligibility_requirements: List[str]
    coverage_type: str
    max_benefit: float | None = None
    application_process: str
    documentation_required: List[str]
    contact_info: str
    approval_timeframe: str


class PaymentPlanOption(BaseModel):
    plan_type: str
    monthly_payment: float
    total_repayment: float
    term_months: int
    interest_rate: float = 0.0
    total_interest: float = 0.0
    pros: List[str]
    cons: List[str]
    eligibility_criteria: List[str]
    recommendation_score: float = 0.0


class AssistanceMatch(BaseModel):
    programs: List[AssistanceProgram]
    total_potential_savings: float
    recommended_programs: List[str]
    application_priority_order: List[str]
    additional_notes: List[str]
