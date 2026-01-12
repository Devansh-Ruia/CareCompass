from typing import List, Dict, Any, Optional
from ..core.models import (
    AssistanceProgram,
    InsuranceInfo,
    MedicalBill,
    AssistanceMatch,
    FinancialHardshipLevel,
)


class AssistanceMatcherService:
    def __init__(self):
        self.programs = self._load_assistance_programs()
        self.eligibility_rules = self._load_eligibility_rules()

    def _load_assistance_programs(self) -> List[Dict[str, Any]]:
        return [
            {
                "program_name": "Hospital Charity Care",
                "provider_type": "hospital",
                "eligibility_requirements": [
                    "Income below 300% FPL",
                    "Uninsured or underinsured",
                    "Medical debt burden",
                    "Resident in hospital service area",
                ],
                "coverage_type": "full_or_partial_discount",
                "max_benefit": None,
                "application_process": "Complete charity care application at hospital financial assistance office",
                "documentation_required": [
                    "Proof of income (tax returns, pay stubs)",
                    "Household size documentation",
                    "Proof of residency",
                    "Medical bills",
                ],
                "contact_info": "Hospital billing department",
                "approval_timeframe": "2-6 weeks",
                "income_threshold": 3.0,
            },
            {
                "program_name": "Medicaid",
                "provider_type": "government",
                "eligibility_requirements": [
                    "Income below state threshold (varies)",
                    "US citizen or qualified immigrant",
                    "State residency",
                    "Categorical eligibility (pregnancy, disability, etc.)",
                ],
                "coverage_type": "comprehensive_health_coverage",
                "max_benefit": None,
                "application_process": "Apply through state Medicaid agency or Healthcare.gov",
                "documentation_required": [
                    "Proof of citizenship/immigration status",
                    "Income verification",
                    "Social security numbers",
                    "Household information",
                ],
                "contact_info": "State Medicaid agency",
                "approval_timeframe": "45-90 days",
                "income_threshold": 1.38,
            },
            {
                "program_name": "CHIP (Children's Health Insurance Program)",
                "provider_type": "government",
                "eligibility_requirements": [
                    "Children under 19",
                    "Income above Medicaid eligibility but below state threshold",
                    "US citizen or qualified immigrant",
                    "Uninsured",
                ],
                "coverage_type": "comprehensive_pediatric_coverage",
                "max_benefit": None,
                "application_process": "Apply through state CHIP agency or Healthcare.gov",
                "documentation_required": [
                    "Proof of income",
                    "Child's birth certificate",
                    "Social security numbers",
                    "Proof of residency",
                ],
                "contact_info": "State CHIP agency",
                "approval_timeframe": "30-45 days",
                "income_threshold": 2.5,
            },
            {
                "program_name": "Hospital Financial Assistance Program",
                "provider_type": "hospital",
                "eligibility_requirements": [
                    "Income below 400% FPL",
                    "Demonstrated financial hardship",
                    "Medical debt with hospital",
                    "Unable to pay full amount",
                ],
                "coverage_type": "payment_reduction",
                "max_benefit": None,
                "application_process": "Contact hospital billing department to request financial assistance application",
                "documentation_required": [
                    "Recent tax returns",
                    "Current pay stubs",
                    "Bank statements",
                    "Medical bills",
                ],
                "contact_info": "Hospital financial assistance office",
                "approval_timeframe": "2-4 weeks",
                "income_threshold": 4.0,
            },
            {
                "program_name": "Prescription Assistance Programs",
                "provider_type": "pharmaceutical",
                "eligibility_requirements": [
                    "No prescription drug coverage",
                    "Income below program threshold (varies)",
                    "US resident",
                    "Taking qualifying medications",
                ],
                "coverage_type": "free_or_discounted_medications",
                "max_benefit": None,
                "application_process": "Apply through drug manufacturer assistance program",
                "documentation_required": [
                    "Proof of income",
                    "Prescription information",
                    "Physician verification",
                    "No insurance coverage letter",
                ],
                "contact_info": "Individual drug manufacturers",
                "approval_timeframe": "2-4 weeks",
                "income_threshold": 3.0,
            },
            {
                "program_name": "State High-Risk Pool",
                "provider_type": "government",
                "eligibility_requirements": [
                    "Pre-existing condition",
                    "Unable to obtain private insurance",
                    "State residency",
                    "Meet income requirements",
                ],
                "coverage_type": "comprehensive_health_coverage",
                "max_benefit": None,
                "application_process": "Apply through state high-risk pool program",
                "documentation_required": [
                    "Proof of pre-existing condition",
                    "Insurance denial letters",
                    "Income documentation",
                    "Proof of residency",
                ],
                "contact_info": "State insurance department",
                "approval_timeframe": "4-8 weeks",
                "income_threshold": 4.0,
            },
            {
                "program_name": "Medical Debt Relief Charities",
                "provider_type": "nonprofit",
                "eligibility_requirements": [
                    "Significant medical debt",
                    "Income below threshold",
                    "Hardship circumstances",
                    "US resident",
                ],
                "coverage_type": "debt_assistance",
                "max_benefit": 10000,
                "application_process": "Submit application to charity organization",
                "documentation_required": [
                    "Medical debt statements",
                    "Income verification",
                    "Hardship explanation",
                    "Household information",
                ],
                "contact_info": "Individual charity organizations",
                "approval_timeframe": "4-12 weeks",
                "income_threshold": 2.5,
            },
            {
                "program_name": "Community Health Centers",
                "provider_type": "clinic",
                "eligibility_requirements": [
                    "No geographic barriers",
                    "Willingness to use sliding fee scale",
                    "Household income verification",
                ],
                "coverage_type": "discounted_medical_services",
                "max_benefit": None,
                "application_process": "Register at community health center",
                "documentation_required": [
                    "Proof of income",
                    "Proof of residency",
                    "Identification",
                    "Household information",
                ],
                "contact_info": "Local community health centers",
                "approval_timeframe": "1-2 weeks",
                "income_threshold": 2.0,
            },
        ]

    def _load_eligibility_rules(self) -> Dict[str, Any]:
        return {
            "income_multiplier_adjustments": {
                "none": 4.0,
                "mild": 3.5,
                "moderate": 2.5,
                "severe": 1.5,
            },
            "insurance_type_priorities": {
                "uninsured": ["hospital", "government"],
                "private": ["hospital", "nonprofit"],
                "medicare": ["pharmaceutical", "nonprofit"],
                "medicaid": ["hospital", "nonprofit"],
            },
        }

    def match_assistance(
        self,
        insurance: InsuranceInfo,
        monthly_income: float,
        household_size: int,
        medical_bills: Optional[List[MedicalBill]] = None,
        hardship_level: Optional[FinancialHardshipLevel] = None,
        diagnoses: Optional[List[str]] = None,
        prescriptions: Optional[List[str]] = None,
    ) -> AssistanceMatch:
        eligible_programs = []

        for program in self.programs:
            eligibility = self._check_program_eligibility(
                program,
                insurance,
                monthly_income,
                household_size,
                medical_bills,
                hardship_level,
                diagnoses,
                prescriptions,
            )

            if eligibility["eligible"]:
                program_model = AssistanceProgram(**program)
                eligible_programs.append(
                    {
                        "program": program_model,
                        "match_score": eligibility["score"],
                        "priority": eligibility["priority"],
                    }
                )

        eligible_programs.sort(key=lambda x: (x["priority"], -x["match_score"]))

        total_savings = self._estimate_total_savings(
            [p["program"] for p in eligible_programs], medical_bills or []
        )

        recommended_programs = [
            p["program"].program_name for p in eligible_programs[:3]
        ]
        application_priority = [p["program"].program_name for p in eligible_programs]

        additional_notes = self._generate_assistance_notes(
            eligible_programs, insurance, hardship_level
        )

        return AssistanceMatch(
            programs=[p["program"] for p in eligible_programs],
            total_potential_savings=round(total_savings, 2),
            recommended_programs=recommended_programs,
            application_priority_order=application_priority,
            additional_notes=additional_notes,
        )

    def _check_program_eligibility(
        self,
        program: Dict[str, Any],
        insurance: InsuranceInfo,
        monthly_income: float,
        household_size: int,
        medical_bills: Optional[List[MedicalBill]],
        hardship_level: Optional[FinancialHardshipLevel],
        diagnoses: Optional[List[str]],
        prescriptions: Optional[List[str]],
    ) -> Dict[str, Any]:
        score = 0
        priority = 3

        annual_income = monthly_income * 12
        fpl_2024 = self._get_federal_poverty_level(household_size)
        income_ratio = annual_income / fpl_2024 if fpl_2024 > 0 else 0

        program_threshold = program.get("income_threshold", 4.0)

        if income_ratio <= program_threshold:
            score += 50

        if hardship_level:
            adjustments = self.eligibility_rules["income_multiplier_adjustments"]
            adjusted_threshold = adjustments.get(
                hardship_level.value, program_threshold
            )
            if income_ratio <= adjusted_threshold:
                score += 30

        if (
            insurance.insurance_type == "uninsured"
            and program["provider_type"] == "hospital"
        ):
            score += 40
            priority = 1
        elif (
            insurance.insurance_type == "uninsured"
            and program["provider_type"] == "government"
        ):
            score += 35
            priority = 1
        elif (
            insurance.insurance_type == "medicare"
            and program["provider_type"] == "pharmaceutical"
        ):
            score += 30
            priority = 2

        if prescriptions and program["provider_type"] == "pharmaceutical":
            score += 25
            priority = 2

        if medical_bills and len(medical_bills) > 0:
            total_debt = sum(bill.patient_responsibility for bill in medical_bills)
            if total_debt > 1000:
                score += 20

        if (
            program["provider_type"] in ["hospital", "nonprofit"]
            and income_ratio <= 2.0
        ):
            priority = min(priority, 1)
        elif (
            program["provider_type"] in ["hospital", "nonprofit"]
            and income_ratio <= 3.0
        ):
            priority = min(priority, 2)

        eligible = score >= 40

        return {"eligible": eligible, "score": score, "priority": priority}

    def _get_federal_poverty_level(self, household_size: int) -> float:
        fpl_values = {
            1: 15180,
            2: 20440,
            3: 25700,
            4: 30960,
            5: 36220,
            6: 41480,
            7: 46740,
            8: 52000,
        }
        return fpl_values.get(household_size, 52000 + (household_size - 8) * 5260)

    def _estimate_total_savings(
        self, programs: List[AssistanceProgram], medical_bills: List[MedicalBill]
    ) -> float:
        if not medical_bills:
            return 0.0

        total_debt = sum(bill.patient_responsibility for bill in medical_bills)

        hospital_programs = [p for p in programs if p.provider_type == "hospital"]
        government_programs = [p for p in programs if p.provider_type == "government"]

        estimated_savings = 0.0

        if hospital_programs:
            estimated_savings += total_debt * 0.50

        if government_programs:
            estimated_savings += total_debt * 0.40

        nonprofit_programs = [p for p in programs if p.provider_type == "nonprofit"]
        if nonprofit_programs:
            for program in nonprofit_programs:
                if program.max_benefit:
                    estimated_savings += program.max_benefit * 0.50

        return min(estimated_savings, total_debt)

    def _generate_assistance_notes(
        self,
        eligible_programs: List[Dict[str, Any]],
        insurance: InsuranceInfo,
        hardship_level: Optional[FinancialHardshipLevel],
    ) -> List[str]:
        notes = []

        if not eligible_programs:
            notes.append(
                "No programs matched current criteria. Consider exploring alternative assistance options."
            )
        else:
            notes.append(
                f"Found {len(eligible_programs)} potential assistance program(s)."
            )

        if insurance.insurance_type == "uninsured":
            notes.append(
                "Uninsured status qualifies for many hospital and government programs."
            )

        if hardship_level and hardship_level.value in ["moderate", "severe"]:
            notes.append(
                "Financial hardship level increases eligibility for charity care programs."
            )

        hospital_count = sum(
            1 for p in eligible_programs if p["program"].provider_type == "hospital"
        )
        if hospital_count > 0:
            notes.append(
                f"Apply to {hospital_count} hospital program(s) first for fastest processing."
            )

        government_count = sum(
            1 for p in eligible_programs if p["program"].provider_type == "government"
        )
        if government_count > 0:
            notes.append(
                f"Government programs may take longer but offer comprehensive coverage."
            )

        notes.append(
            "Gather all required documentation before applying to streamline the process."
        )

        return notes

    def get_programs(self) -> List[Dict[str, Any]]:
        return [
            {
                "program_name": program["program_name"],
                "provider_type": program["provider_type"],
                "coverage_type": program["coverage_type"],
                "income_threshold": program.get("income_threshold"),
                "approval_timeframe": program["approval_timeframe"],
                "key_requirements": program["eligibility_requirements"][:3],
            }
            for program in self.programs
        ]


assistance_matcher = AssistanceMatcherService()
