from typing import List, Dict, Any, Optional
from ..core.models import (
    MedicalBill,
    InsuranceInfo,
    PaymentPlanOption,
)


class PaymentPlannerService:
    def __init__(self):
        self.payment_strategies = self._load_payment_strategies()

    def _load_payment_strategies(self) -> Dict[str, Dict[str, Any]]:
        return {
            "provider_payment_plan": {
                "typical_interest_rate": 0.0,
                "term_range": (6, 36),
                "down_payment_required": False,
                "credit_check_required": False,
            },
            "medical_credit_card": {
                "typical_interest_rate": 0.0,
                "promotional_period": 12,
                "term_range": (12, 24),
                "down_payment_required": False,
                "credit_check_required": True,
            },
            "personal_loan": {
                "typical_interest_rate": 0.08,
                "term_range": (12, 60),
                "down_payment_required": False,
                "credit_check_required": True,
            },
            "home_equity_loan": {
                "typical_interest_rate": 0.06,
                "term_range": (60, 180),
                "down_payment_required": False,
                "credit_check_required": True,
                "collateral_required": True,
            },
            "debt_settlement": {
                "typical_interest_rate": 0.0,
                "term_range": (24, 48),
                "down_payment_required": False,
                "credit_check_required": False,
                "credit_impact": "negative",
            },
        }

    def generate_payment_plans(
        self,
        total_debt: float,
        monthly_income: float,
        credit_score: Optional[int] = None,
        debt_to_income_ratio: float = 0.0,
        hardship: bool = False,
    ) -> List[PaymentPlanOption]:
        plans = []

        plans.extend(
            self._generate_provider_plans(total_debt, monthly_income, hardship)
        )
        plans.extend(self._generate_medical_credit_card_plans(total_debt, credit_score))
        plans.extend(
            self._generate_personal_loan_plans(
                total_debt, monthly_income, debt_to_income_ratio, credit_score
            )
        )
        plans.extend(
            self._generate_home_equity_plans(total_debt, monthly_income, credit_score)
        )

        if hardship:
            plans.extend(self._generate_hardship_plans(total_debt, monthly_income))

        for plan in plans:
            plan.recommendation_score = self._calculate_recommendation_score(
                plan, monthly_income, debt_to_income_ratio, hardship, credit_score
            )

        plans.sort(key=lambda p: -p.recommendation_score)

        return plans

    def recommend_best_plan(
        self,
        total_debt: float,
        monthly_income: float,
        credit_score: Optional[int] = None,
        debt_to_income_ratio: float = 0.0,
        hardship: bool = False,
    ) -> PaymentPlanOption:
        plans = self.generate_payment_plans(
            total_debt, monthly_income, credit_score, debt_to_income_ratio, hardship
        )

        return (
            plans[0]
            if plans
            else PaymentPlanOption(
                plan_type="custom",
                monthly_payment=0,
                total_repayment=0,
                term_months=0,
                interest_rate=0,
                total_interest=0,
                pros=[],
                cons=[],
                eligibility_criteria=[],
                recommendation_score=0,
            )
        )

    def _generate_provider_plans(
        self, total_debt: float, monthly_income: float, hardship: bool
    ) -> List[PaymentPlanOption]:
        plans = []
        strategy = self.payment_strategies["provider_payment_plan"]

        term_options = [6, 12, 18, 24, 36]

        for term in term_options:
            monthly_payment = total_debt / term
            total_repayment = total_debt
            total_interest = 0.0

            if monthly_payment <= monthly_income * 0.20:
                discount = 0.10 if hardship else 0.0
                if discount > 0:
                    total_repayment = total_debt * (1 - discount)
                    monthly_payment = total_repayment / term

                plans.append(
                    PaymentPlanOption(
                        plan_type=f"Provider Payment Plan ({term} months)",
                        monthly_payment=round(monthly_payment, 2),
                        total_repayment=round(total_repayment, 2),
                        term_months=term,
                        interest_rate=0.0,
                        total_interest=0.0,
                        pros=[
                            "No interest charges",
                            "No credit check required",
                            "Flexible terms negotiated directly with provider",
                            "Payments reported to credit bureaus",
                        ],
                        cons=[
                            "May require down payment",
                            "Limited to specific providers",
                            "Late fees may apply",
                            "Terms vary by provider",
                        ],
                        eligibility_criteria=[
                            "Contact provider billing department",
                            "Demonstrate ability to pay",
                            "Agree to automatic payments (may offer discount)",
                        ],
                        recommendation_score=0.0,
                    )
                )

        return plans

    def _generate_medical_credit_card_plans(
        self, total_debt: float, credit_score: Optional[int]
    ) -> List[PaymentPlanOption]:
        plans = []

        if credit_score and credit_score < 640:
            return plans

        strategy = self.payment_strategies["medical_credit_card"]
        promotional_period = strategy["promotional_period"]

        for term in [promotional_period, 24]:
            monthly_payment = total_debt / term
            total_repayment = total_debt
            total_interest = 0.0

            plans.append(
                PaymentPlanOption(
                    plan_type=f"Medical Credit Card - 0% APR ({term} months)",
                    monthly_payment=round(monthly_payment, 2),
                    total_repayment=round(total_repayment, 2),
                    term_months=term,
                    interest_rate=0.0,
                    total_interest=0.0,
                    pros=[
                        f"0% APR for first {promotional_period} months",
                        "Can be used at multiple providers",
                        "May offer welcome bonuses",
                        "Fast application process",
                    ],
                    cons=[
                        f"Interest charges apply after {promotional_period} months if not paid",
                        "Deferred interest on full balance if not paid in full",
                        "Requires good credit",
                        "Limited network of participating providers",
                    ],
                    eligibility_criteria=[
                        "Credit score 640+ recommended",
                        "Application through participating provider or issuer",
                        "Proof of income may be required",
                    ],
                    recommendation_score=0.0,
                )
            )

        return plans

    def _generate_personal_loan_plans(
        self,
        total_debt: float,
        monthly_income: float,
        debt_to_income_ratio: float,
        credit_score: Optional[int],
    ) -> List[PaymentPlanOption]:
        plans = []

        if credit_score and credit_score < 600:
            return plans

        if debt_to_income_ratio > 0.43:
            return plans

        strategy = self.payment_strategies["personal_loan"]
        interest_rate = strategy["typical_interest_rate"]

        if credit_score:
            if credit_score >= 740:
                interest_rate = 0.05
            elif credit_score >= 670:
                interest_rate = 0.07
            elif credit_score >= 600:
                interest_rate = 0.12

        for term in [24, 36, 48, 60]:
            total_interest = self._calculate_total_interest(
                total_debt, interest_rate, term
            )
            total_repayment = total_debt + total_interest
            monthly_payment = self._calculate_monthly_payment(
                total_debt, interest_rate, term
            )

            if monthly_payment <= monthly_income * 0.15:
                plans.append(
                    PaymentPlanOption(
                        plan_type=f"Personal Loan ({term} months)",
                        monthly_payment=round(monthly_payment, 2),
                        total_repayment=round(total_repayment, 2),
                        term_months=term,
                        interest_rate=round(interest_rate * 100, 2),
                        total_interest=round(total_interest, 2),
                        pros=[
                            "Fixed interest rate and monthly payment",
                            "Consolidates multiple bills into single payment",
                            "Lump-sum payment can provide leverage for discounts",
                            "Can improve credit mix if managed responsibly",
                        ],
                        cons=[
                            f"Interest charges apply ({interest_rate * 100:.1f}% APR)",
                            "Requires good credit for best rates",
                            "Origination fees may apply",
                            "May have prepayment penalties",
                        ],
                        eligibility_criteria=[
                            "Credit score 600+ required",
                            "Debt-to-income ratio below 43%",
                            "Proof of income and employment",
                            "Valid bank account",
                        ],
                        recommendation_score=0.0,
                    )
                )

        return plans

    def _generate_home_equity_plans(
        self, total_debt: float, monthly_income: float, credit_score: Optional[int]
    ) -> List[PaymentPlanOption]:
        plans = []

        if credit_score and credit_score < 620:
            return plans

        strategy = self.payment_strategies["home_equity_loan"]
        interest_rate = strategy["typical_interest_rate"]

        if credit_score and credit_score >= 740:
            interest_rate = 0.04

        for term in [60, 120, 180]:
            total_interest = self._calculate_total_interest(
                total_debt, interest_rate, term
            )
            total_repayment = total_debt + total_interest
            monthly_payment = self._calculate_monthly_payment(
                total_debt, interest_rate, term
            )

            if monthly_payment <= monthly_income * 0.25:
                plans.append(
                    PaymentPlanOption(
                        plan_type=f"Home Equity Loan ({term} months)",
                        monthly_payment=round(monthly_payment, 2),
                        total_repayment=round(total_repayment, 2),
                        term_months=term,
                        interest_rate=round(interest_rate * 100, 2),
                        total_interest=round(total_interest, 2),
                        pros=[
                            f"Low interest rate ({interest_rate * 100:.1f}% APR)",
                            "Interest may be tax deductible",
                            "Long repayment terms keep payments low",
                            "Large borrowing capacity",
                        ],
                        cons=[
                            "Home used as collateral",
                            "Closing costs and fees",
                            "Longer loan term means more total interest",
                            "Risk of foreclosure if payments are missed",
                        ],
                        eligibility_criteria=[
                            "Credit score 620+ required",
                            "Sufficient home equity",
                            "Debt-to-income ratio below 43%",
                            "Home appraisal required",
                        ],
                        recommendation_score=0.0,
                    )
                )

        return plans

    def _generate_hardship_plans(
        self, total_debt: float, monthly_income: float
    ) -> List[PaymentPlanOption]:
        plans = []

        term = 60
        discount = 0.30
        total_repayment = total_debt * (1 - discount)
        monthly_payment = total_repayment / term

        if monthly_payment <= monthly_income * 0.10:
            plans.append(
                PaymentPlanOption(
                    plan_type=f"Hardship Payment Plan ({term} months)",
                    monthly_payment=round(monthly_payment, 2),
                    total_repayment=round(total_repayment, 2),
                    term_months=term,
                    interest_rate=0.0,
                    total_interest=0.0,
                    pros=[
                        "30% principal reduction",
                        "No interest charges",
                        "Extended repayment terms",
                        "Protects credit score from collections",
                    ],
                    cons=[
                        "Requires proof of financial hardship",
                        "Limited availability",
                        "May require down payment",
                        "Provider must approve hardship status",
                    ],
                    eligibility_criteria=[
                        "Documented financial hardship",
                        "Income below 300% FPL",
                        "Medical debt burden",
                        "Provider approval required",
                    ],
                    recommendation_score=0.0,
                )
            )

        return plans

    def _calculate_monthly_payment(
        self, principal: float, annual_rate: float, months: int
    ) -> float:
        if annual_rate == 0:
            return principal / months

        monthly_rate = annual_rate / 12
        return (
            principal
            * (monthly_rate * (1 + monthly_rate) ** months)
            / ((1 + monthly_rate) ** months - 1)
        )

    def _calculate_total_interest(
        self, principal: float, annual_rate: float, months: int
    ) -> float:
        monthly_payment = self._calculate_monthly_payment(
            principal, annual_rate, months
        )
        total_payment = monthly_payment * months
        return total_payment - principal

    def _calculate_recommendation_score(
        self,
        plan: PaymentPlanOption,
        monthly_income: float,
        debt_to_income_ratio: float,
        hardship: bool,
        credit_score: Optional[int],
    ) -> float:
        score = 50.0

        payment_ratio = (
            plan.monthly_payment / monthly_income if monthly_income > 0 else 1.0
        )

        if payment_ratio <= 0.10:
            score += 30
        elif payment_ratio <= 0.15:
            score += 20
        elif payment_ratio <= 0.20:
            score += 10

        if plan.interest_rate == 0:
            score += 20
        elif plan.interest_rate <= 5:
            score += 15
        elif plan.interest_rate <= 10:
            score += 5

        if hardship and "Hardship" in plan.plan_type:
            score += 25

        if "Provider Payment Plan" in plan.plan_type:
            score += 15
            if hardship:
                score += 10

        if credit_score and credit_score >= 700:
            if "Personal Loan" in plan.plan_type:
                score += 10
            if "Home Equity" in plan.plan_type:
                score += 10
            if "Medical Credit Card" in plan.plan_type:
                score += 5
        elif credit_score and credit_score < 650:
            if "Provider Payment Plan" in plan.plan_type:
                score += 20
            if "Hardship" in plan.plan_type:
                score += 25

        if debt_to_income_ratio > 0.35:
            if (
                "Provider Payment Plan" in plan.plan_type
                or "Hardship" in plan.plan_type
            ):
                score += 15
            if "Personal Loan" in plan.plan_type or "Home Equity" in plan.plan_type:
                score -= 20

        score = max(0, min(100, score))

        return round(score, 1)


payment_planner = PaymentPlannerService()
