from typing import List, Dict, Any
from datetime import datetime
from ..core.models import (
    MedicalBill,
    InsuranceInfo,
    NavigationPlan,
    RiskLevel,
    FinancialHardshipLevel,
    InsuranceCoverageGap,
    ActionItem,
)


class NavigationEngineService:
    def __init__(self):
        self.guidelines = self._load_guidelines()

    def _load_guidelines(self) -> Dict[str, Any]:
        return {
            "debt_to_income_thresholds": {
                "low": 0.05,
                "medium": 0.15,
                "high": 0.30,
                "critical": 0.50,
            },
            "hardship_income_thresholds": {
                "fpl_multiplier": 2.0,
                "severe": 1.5,
                "moderate": 2.5,
                "mild": 4.0,
            },
        }

    def create_navigation_plan(
        self,
        bills: List[MedicalBill],
        insurance: InsuranceInfo,
        monthly_income: float,
        household_size: int,
    ) -> NavigationPlan:
        total_debt = self._calculate_total_medical_debt(bills)
        debt_to_income = self._calculate_debt_to_income_ratio(
            total_debt, monthly_income
        )

        risk_level = self._assess_risk_level(debt_to_income, total_debt, insurance)
        hardship_level = self._assess_hardship_level(
            monthly_income, household_size, total_debt
        )

        coverage_gaps = self._identify_coverage_gaps(insurance, bills)

        action_plan = self._generate_action_plan(
            bills, insurance, risk_level, hardship_level, coverage_gaps, total_debt
        )

        estimated_savings = sum(item.estimated_savings or 0 for item in action_plan)

        timeline = self._determine_timeline(action_plan, risk_level)

        summary = self._generate_summary(
            risk_level, hardship_level, total_debt, estimated_savings
        )

        return NavigationPlan(
            risk_level=risk_level,
            hardship_level=hardship_level,
            total_medical_debt=total_debt,
            debt_to_income_ratio=debt_to_income,
            coverage_gaps=coverage_gaps,
            action_plan=action_plan,
            estimated_total_savings=estimated_savings,
            recommended_timeline=timeline,
            summary=summary,
        )

    def analyze_situation(
        self,
        bills: List[MedicalBill],
        insurance: InsuranceInfo,
        monthly_income: float,
        household_size: int,
    ) -> Dict[str, Any]:
        total_debt = self._calculate_total_medical_debt(bills)
        debt_to_income = self._calculate_debt_to_income_ratio(
            total_debt, monthly_income
        )
        risk_level = self._assess_risk_level(debt_to_income, total_debt, insurance)
        hardship_level = self._assess_hardship_level(
            monthly_income, household_size, total_debt
        )

        return {
            "risk_level": risk_level.value,
            "hardship_level": hardship_level.value,
            "total_medical_debt": total_debt,
            "debt_to_income_ratio": debt_to_income,
            "monthly_income": monthly_income,
            "household_size": household_size,
            "recommendations": self._get_immediate_recommendations(
                risk_level, hardship_level
            ),
            "next_steps": self._get_next_steps(risk_level),
        }

    def _calculate_total_medical_debt(self, bills: List[MedicalBill]) -> float:
        return sum(bill.patient_responsibility for bill in bills)

    def _calculate_debt_to_income_ratio(
        self, debt: float, monthly_income: float
    ) -> float:
        if monthly_income == 0:
            return 1.0
        annual_income = monthly_income * 12
        return round(debt / annual_income, 4)

    def _assess_risk_level(
        self, debt_to_income: float, total_debt: float, insurance: InsuranceInfo
    ) -> RiskLevel:
        thresholds = self.guidelines["debt_to_income_thresholds"]

        if debt_to_income >= thresholds["critical"]:
            return RiskLevel.CRITICAL
        elif debt_to_income >= thresholds["high"]:
            return RiskLevel.HIGH
        elif debt_to_income >= thresholds["medium"]:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW

    def _assess_hardship_level(
        self, monthly_income: float, household_size: int, total_debt: float
    ) -> FinancialHardshipLevel:
        annual_income = monthly_income * 12
        fpl_2024 = self._get_federal_poverty_level(household_size)

        income_ratio = annual_income / fpl_2024 if fpl_2024 > 0 else 0

        thresholds = self.guidelines["hardship_income_thresholds"]

        if income_ratio <= thresholds["severe"]:
            return FinancialHardshipLevel.SEVERE
        elif income_ratio <= thresholds["moderate"]:
            return FinancialHardshipLevel.MODERATE
        elif income_ratio <= thresholds["mild"]:
            return FinancialHardshipLevel.MILD
        else:
            return FinancialHardshipLevel.NONE

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

    def _identify_coverage_gaps(
        self, insurance: InsuranceInfo, bills: List[MedicalBill]
    ) -> List[InsuranceCoverageGap]:
        gaps = []

        remaining_deductible = insurance.annual_deductible - insurance.deductible_met
        if remaining_deductible > 0:
            gaps.append(
                InsuranceCoverageGap(
                    gap_type="deductible_not_met",
                    description=f"Deductible not met: ${remaining_deductible:.2f} remaining",
                    impact="Full charges apply until deductible is met",
                    recommendation="Consider deferring non-urgent care until deductible is met or explore payment assistance",
                )
            )

        remaining_oop = insurance.annual_out_of_pocket_max - insurance.out_of_pocket_met
        if remaining_oop > 0 and insurance.out_of_pocket_met > 0:
            progress_percent = (
                insurance.out_of_pocket_met / insurance.annual_out_of_pocket_max
            ) * 100
            if progress_percent > 80:
                gaps.append(
                    InsuranceCoverageGap(
                        gap_type="near_out_of_pocket_max",
                        description=f"Out-of-pocket max nearly reached: ${remaining_oop:.2f} remaining",
                        impact="Most services will be covered after reaching max",
                        recommendation="Schedule necessary procedures now to maximize coverage",
                    )
                )

        uninsured_bills = [
            b for b in bills if b.insurance_paid == 0 and b.insurance_adjustments == 0
        ]
        if uninsured_bills and insurance.insurance_type != "uninsured":
            gaps.append(
                InsuranceCoverageGap(
                    gap_type="potential_uncovered_charges",
                    description=f"{len(uninsured_bills)} bill(s) with no insurance payment recorded",
                    impact="May indicate out-of-network services or coverage issues",
                    recommendation="Review bills for out-of-network charges and verify coverage",
                )
            )

        return gaps

    def _generate_action_plan(
        self,
        bills: List[MedicalBill],
        insurance: InsuranceInfo,
        risk_level: RiskLevel,
        hardship_level: FinancialHardshipLevel,
        coverage_gaps: List[InsuranceCoverageGap],
        total_debt: float,
    ) -> List[ActionItem]:
        actions = []
        priority = 1

        actions.append(
            ActionItem(
                priority=priority,
                action="Request itemized bills for all charges",
                category="bill_review",
                estimated_savings=total_debt * 0.05,
                estimated_timeframe="1-2 weeks",
                description="Itemized bills reveal errors and overcharges that can be disputed",
            )
        )
        priority += 1

        actions.append(
            ActionItem(
                priority=priority,
                action="Apply for hospital charity care or financial assistance",
                category="assistance",
                estimated_savings=total_debt * 0.40
                if hardship_level != FinancialHardshipLevel.NONE
                else 0,
                estimated_timeframe="2-4 weeks",
                description="Hospitals are required to offer financial assistance programs",
            )
        )
        priority += 1

        actions.append(
            ActionItem(
                priority=priority,
                action="Review insurance coverage for all bills",
                category="insurance",
                estimated_savings=total_debt * 0.15,
                estimated_timeframe="2-3 weeks",
                description="Check for out-of-network charges and coverage denials that can be appealed",
            )
        )
        priority += 1

        actions.append(
            ActionItem(
                priority=priority,
                action="Negotiate payment plan with providers",
                category="payment_planning",
                estimated_savings=total_debt * 0.10,
                estimated_timeframe="1-2 weeks",
                description="Many providers offer interest-free payment plans with flexible terms",
            )
        )
        priority += 1

        if risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            actions.append(
                ActionItem(
                    priority=priority,
                    action="Consult with medical billing advocate",
                    category="professional_help",
                    estimated_savings=total_debt * 0.20,
                    estimated_timeframe="2-4 weeks",
                    description="Professional advocates can negotiate significant reductions",
                )
            )
            priority += 1

        actions.append(
            ActionItem(
                priority=priority,
                action="Explore government assistance programs",
                category="assistance",
                estimated_savings=total_debt * 0.25
                if hardship_level == FinancialHardshipLevel.SEVERE
                else 0,
                estimated_timeframe="4-8 weeks",
                description="Medicaid, CHIP, and other programs may cover past medical expenses",
            )
        )

        return actions

    def _determine_timeline(
        self, action_plan: List[ActionItem], risk_level: RiskLevel
    ) -> str:
        if risk_level == RiskLevel.CRITICAL:
            return "Immediate action required within 30 days"
        elif risk_level == RiskLevel.HIGH:
            return "High-priority actions within 60 days, remainder within 90 days"
        elif risk_level == RiskLevel.MEDIUM:
            return "Complete within 3-6 months"
        else:
            return "Complete within 6-12 months"

    def _generate_summary(
        self,
        risk_level: RiskLevel,
        hardship_level: FinancialHardshipLevel,
        total_debt: float,
        estimated_savings: float,
    ) -> str:
        risk_verbs = {
            RiskLevel.LOW: "manageable",
            RiskLevel.MEDIUM: "requires attention",
            RiskLevel.HIGH: "serious concern",
            RiskLevel.CRITICAL: "urgent action needed",
        }

        return (
            f"Your medical debt situation is {risk_verbs[risk_level]} with a total of ${total_debt:,.2f} in debt. "
            f"Based on your hardship level ({hardship_level.value}), you may be eligible for assistance programs "
            f"that could save an estimated ${estimated_savings:,.2f}. Follow the action plan to reduce your "
            f"financial burden systematically."
        )

    def _get_immediate_recommendations(
        self, risk_level: RiskLevel, hardship_level: FinancialHardshipLevel
    ) -> List[str]:
        recommendations = []

        if risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            recommendations.append(
                "Contact providers immediately to pause collection efforts"
            )
            recommendations.append("Apply for hospital financial assistance programs")

        if hardship_level in [
            FinancialHardshipLevel.MODERATE,
            FinancialHardshipLevel.SEVERE,
        ]:
            recommendations.append("You likely qualify for charity care programs")
            recommendations.append("Consider Medicaid enrollment if eligible")

        recommendations.append("Request itemized bills for all charges")

        return recommendations

    def _get_next_steps(self, risk_level: RiskLevel) -> List[str]:
        steps = []

        if risk_level == RiskLevel.CRITICAL:
            steps = [
                "1. Contact hospital billing department immediately",
                "2. Request charity care application",
                "3. Provide income documentation",
                "4. Review all bills for errors",
                "5. Negotiate payment terms",
            ]
        elif risk_level == RiskLevel.HIGH:
            steps = [
                "1. Gather all medical bills",
                "2. Request itemized statements",
                "3. Apply for financial assistance",
                "4. Review insurance coverage",
                "5. Set up payment plans",
            ]
        else:
            steps = [
                "1. Review your current medical expenses",
                "2. Check insurance benefits",
                "3. Look for savings opportunities",
                "4. Plan for future healthcare costs",
            ]

        return steps


navigation_engine = NavigationEngineService()
