from typing import List, Dict, Any, Optional
from ..core.models import InsuranceInfo, MedicalBill, InsuranceCoverageGap


class InsuranceAnalysisService:
    def __init__(self):
        self.coverage_rules = self._load_coverage_rules()
        self.benefit_limits = self._load_benefit_limits()

    def _load_coverage_rules(self) -> Dict[str, Dict[str, Any]]:
        return {
            "preventive_care": {
                "covered_at_100_percent": True,
                "no_deductible": True,
                "services": [
                    "annual_physical",
                    "immunizations",
                    "screenings",
                    "wellness_visits",
                ],
            },
            "emergency_care": {
                "requires_prior_authorization": False,
                "out_of_network_coverage": "partial",
                "typical_coinsurance": 0.20,
            },
            "specialist_visit": {
                "requires_referral": "depends_on_plan",
                "typical_copay": 40,
                "typical_coinsurance": 0.20,
            },
            "laboratory": {"network_lab_coverage": 0.90, "out_of_network_penalty": 1.5},
            "mental_health": {
                "parity_required": True,
                "typical_coinsurance": 0.20,
                "visit_limits": "unlimited",
            },
            "prescription": {
                "tiers": ["generic", "preferred_brand", "non_preferred", "specialty"],
                "typical_copays": [10, 35, 60, 100],
            },
        }

    def _load_benefit_limits(self) -> Dict[str, Dict[str, float]]:
        return {
            "out_of_pocket_limits": {
                "individual": 9100,
                "family": 18200,
                "medicare": 8300,
            },
            "deductible_ranges": {
                "low": (0, 1000),
                "medium": (1000, 3000),
                "high": (3000, 8000),
            },
        }

    def analyze_insurance(
        self, insurance: InsuranceInfo, bills: Optional[List[MedicalBill]] = None
    ) -> Dict[str, Any]:
        coverage_status = self._assess_coverage_status(insurance)
        utilization = self._calculate_utilization(insurance, bills or [])
        gaps = self._identify_gaps(insurance, bills or [])
        optimization = self._get_optimization_recommendations(insurance, gaps)

        return {
            "coverage_status": coverage_status,
            "utilization": utilization,
            "coverage_gaps": gaps,
            "optimization_recommendations": optimization,
            "summary": self._generate_insurance_summary(coverage_status, gaps),
        }

    def _assess_coverage_status(self, insurance: InsuranceInfo) -> Dict[str, Any]:
        deductible_progress = (
            (insurance.deductible_met / insurance.annual_deductible)
            if insurance.annual_deductible > 0
            else 100
        )
        oop_progress = (
            (insurance.out_of_pocket_met / insurance.annual_out_of_pocket_max)
            if insurance.annual_out_of_pocket_max > 0
            else 0
        )

        remaining_deductible = insurance.annual_deductible - insurance.deductible_met
        remaining_oop = insurance.annual_out_of_pocket_max - insurance.out_of_pocket_met

        status = "excellent"
        if remaining_deductible > 0:
            status = "developing"
        if remaining_oop < 1000 and remaining_oop > 0:
            status = "nearly_maxed"

        return {
            "status": status,
            "deductible": {
                "annual": insurance.annual_deductible,
                "met": insurance.deductible_met,
                "remaining": remaining_deductible,
                "progress_percent": round(deductible_progress, 1),
            },
            "out_of_pocket": {
                "annual_max": insurance.annual_out_of_pocket_max,
                "met": insurance.out_of_pocket_met,
                "remaining": remaining_oop,
                "progress_percent": round(oop_progress, 1),
            },
            "cost_sharing": {
                "copay": insurance.copay_amount,
                "coinsurance_rate": insurance.coinsurance_rate * 100,
                "coverage_percentage": insurance.coverage_percentage * 100,
            },
        }

    def _calculate_utilization(
        self, insurance: InsuranceInfo, bills: List[MedicalBill]
    ) -> Dict[str, Any]:
        total_billed = sum(bill.total_amount for bill in bills)
        total_insurance_paid = sum(bill.insurance_paid for bill in bills)
        total_patient_responsibility = sum(
            bill.patient_responsibility for bill in bills
        )

        coverage_rate = (total_insurance_paid / total_billed) if total_billed > 0 else 0

        out_of_network_charges = []
        for bill in bills:
            if (
                bill.insurance_paid == 0
                and bill.insurance_adjustments == 0
                and insurance.insurance_type != "uninsured"
            ):
                out_of_network_charges.append(bill)

        return {
            "total_services": len(bills),
            "total_billed": round(total_billed, 2),
            "insurance_paid": round(total_insurance_paid, 2),
            "patient_responsibility": round(total_patient_responsibility, 2),
            "coverage_rate": round(coverage_rate * 100, 1),
            "out_of_network_charges": len(out_of_network_charges),
            "out_of_network_amount": sum(
                bill.patient_responsibility for bill in out_of_network_charges
            ),
        }

    def _identify_gaps(
        self, insurance: InsuranceInfo, bills: List[MedicalBill]
    ) -> List[InsuranceCoverageGap]:
        gaps = []

        remaining_deductible = insurance.annual_deductible - insurance.deductible_met
        if remaining_deductible > 1000:
            gaps.append(
                InsuranceCoverageGap(
                    gap_type="high_deductible",
                    description=f"High deductible remaining: ${remaining_deductible:.2f}",
                    impact="Full charges apply until deductible is met",
                    recommendation="Consider health savings account (HSA) contributions and defer non-urgent care",
                )
            )

        remaining_oop = insurance.annual_out_of_pocket_max - insurance.out_of_pocket_met
        if remaining_oop > 0 and insurance.out_of_pocket_met > 0:
            oop_percent = (
                insurance.out_of_pocket_met / insurance.annual_out_of_pocket_max
            ) * 100
            if oop_percent > 80:
                gaps.append(
                    InsuranceCoverageGap(
                        gap_type="near_max_out_of_pocket",
                        description=f"Out-of-pocket max nearly reached: ${remaining_oop:.2f} remaining",
                        impact="Most services will be covered after reaching max",
                        recommendation="Schedule necessary procedures now to maximize coverage benefits",
                    )
                )

        if insurance.coinsurance_rate > 0.30:
            gaps.append(
                InsuranceCoverageGap(
                    gap_type="high_coinsurance",
                    description=f"High coinsurance rate: {insurance.coinsurance_rate * 100:.0f}%",
                    impact="You pay a large percentage of costs after deductible",
                    recommendation="Review plan options and consider supplemental insurance",
                )
            )

        out_of_network_issues = self._detect_out_of_network_issues(insurance, bills)
        if out_of_network_issues:
            gaps.append(
                InsuranceCoverageGap(
                    gap_type="out_of_network_usage",
                    description=f"{len(out_of_network_issues)} potential out-of-network charges detected",
                    impact="Higher costs due to out-of-network penalties",
                    recommendation="Verify network status of all providers and request in-network alternatives",
                )
            )

        if insurance.coverage_percentage < 0.70:
            gaps.append(
                InsuranceCoverageGap(
                    gap_type="low_coverage_rate",
                    description=f"Low overall coverage: {insurance.coverage_percentage * 100:.0f}%",
                    impact="You may have significant out-of-pocket costs",
                    recommendation="Consider plan changes during next enrollment period",
                )
            )

        return gaps

    def _detect_out_of_network_issues(
        self, insurance: InsuranceInfo, bills: List[MedicalBill]
    ) -> List[MedicalBill]:
        issues = []

        if insurance.insurance_type == "uninsured":
            return issues

        for bill in bills:
            if bill.insurance_paid == 0 and bill.insurance_adjustments == 0:
                if (
                    bill.total_amount > 0
                    and bill.patient_responsibility == bill.total_amount
                ):
                    issues.append(bill)

        return issues

    def _get_optimization_recommendations(
        self, insurance: InsuranceInfo, gaps: List[InsuranceCoverageGap]
    ) -> List[Dict[str, Any]]:
        recommendations = []

        remaining_deductible = insurance.annual_deductible - insurance.deductible_met
        if remaining_deductible < 500 and remaining_deductible > 0:
            recommendations.append(
                {
                    "category": "timing",
                    "priority": "high",
                    "action": "Schedule necessary services soon",
                    "description": f"Only ${remaining_deductible:.2f} remaining on deductible. Schedule needed procedures before year-end to maximize coverage.",
                }
            )

        remaining_oop = insurance.annual_out_of_pocket_max - insurance.out_of_pocket_met
        if remaining_oop < 2000 and remaining_oop > 0:
            recommendations.append(
                {
                    "category": "timing",
                    "priority": "high",
                    "action": "Maximize benefits before year-end",
                    "description": f"Out-of-pocket max nearly reached (${remaining_oop:.2f} remaining). Schedule major procedures now.",
                }
            )

        if remaining_deductible > 2000:
            recommendations.append(
                {
                    "category": "planning",
                    "priority": "medium",
                    "action": "Defer non-urgent care",
                    "description": f"Consider deferring elective procedures until deductible is met or new plan year begins.",
                }
            )

        if (
            insurance.insurance_type != "uninsured"
            and insurance.coinsurance_rate > 0.25
        ):
            recommendations.append(
                {
                    "category": "coverage",
                    "priority": "medium",
                    "action": "Review plan options",
                    "description": "High coinsurance rates may indicate you could benefit from a plan with lower cost-sharing.",
                }
            )

        for gap in gaps:
            if gap.gap_type == "out_of_network_usage":
                recommendations.append(
                    {
                        "category": "network",
                        "priority": "high",
                        "action": "Verify provider network status",
                        "description": "Check if out-of-network charges can be appealed or if in-network alternatives exist.",
                    }
                )

        recommendations.append(
            {
                "category": "general",
                "priority": "low",
                "action": "Track all medical expenses",
                "description": "Maintain records for tax deductions and to monitor benefit utilization.",
            }
        )

        return recommendations

    def _generate_insurance_summary(
        self, coverage_status: Dict[str, Any], gaps: List[InsuranceCoverageGap]
    ) -> str:
        status_text = coverage_status["status"]
        deductible_remaining = coverage_status["deductible"]["remaining"]
        oop_remaining = coverage_status["out_of_pocket"]["remaining"]

        summary = f"Your insurance coverage status is {status_text}. "

        if deductible_remaining > 0:
            summary += (
                f"You have ${deductible_remaining:.2f} remaining on your deductible. "
            )
        else:
            summary += "Your deductible has been met. "

        if oop_remaining > 0:
            summary += f"${oop_remaining:.2f} remains until reaching your out-of-pocket maximum. "
        else:
            summary += "You've reached your out-of-pocket maximum for the year. "

        if gaps:
            summary += (
                f"{len(gaps)} coverage gap(s) identified that could be optimized."
            )
        else:
            summary += "Your coverage appears well-optimized."

        return summary

    def get_insurance_types(self) -> List[Dict[str, Any]]:
        return [
            {
                "type": "private",
                "name": "Private Health Insurance",
                "description": "Employer-sponsored or individually purchased coverage",
                "typical_features": [
                    "Deductibles and co-payments",
                    "Provider networks",
                    "Out-of-pocket maximums",
                    "Preventive care coverage",
                ],
            },
            {
                "type": "medicare",
                "name": "Medicare",
                "description": "Federal health insurance for seniors and disabled",
                "typical_features": [
                    "Part A: Hospital insurance",
                    "Part B: Medical insurance",
                    "Part C: Medicare Advantage",
                    "Part D: Prescription drug coverage",
                ],
            },
            {
                "type": "medicaid",
                "name": "Medicaid",
                "description": "Federal-state program for low-income individuals",
                "typical_features": [
                    "Income-based eligibility",
                    "Low or no cost-sharing",
                    "Comprehensive coverage",
                    "State-specific benefits",
                ],
            },
            {
                "type": "va",
                "name": "VA Health Care",
                "description": "Healthcare for eligible veterans",
                "typical_features": [
                    "Service connection requirements",
                    "Priority groups",
                    "VA facility network",
                    "Low or no cost",
                ],
            },
            {
                "type": "tricare",
                "name": "TRICARE",
                "description": "Health coverage for military personnel and families",
                "typical_features": [
                    "Uniformed services sponsorship",
                    "Multiple plan options",
                    "Network and non-network care",
                    "Family coverage options",
                ],
            },
            {
                "type": "uninsured",
                "name": "Uninsured",
                "description": "No health insurance coverage",
                "typical_features": [
                    "Full financial responsibility",
                    "Negotiation opportunities",
                    "Charity care eligibility",
                    "Payment plan options",
                ],
            },
        ]


insurance_analyzer = InsuranceAnalysisService()
