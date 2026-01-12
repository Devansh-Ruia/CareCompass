import pytest
from app.services.navigation_engine import navigation_engine
from app.core.models import InsuranceInfo, InsuranceType, MedicalBill


@pytest.fixture
def sample_insurance():
    return InsuranceInfo(
        insurance_type=InsuranceType.PRIVATE,
        provider_name="Blue Cross",
        plan_type="PPO",
        annual_deductible=2000.0,
        deductible_met=500.0,
        annual_out_of_pocket_max=6000.0,
        out_of_pocket_met=1200.0,
        copay_amount=30.0,
        coinsurance_rate=0.2,
        coverage_percentage=0.8,
    )


@pytest.fixture
def sample_bills():
    return [
        MedicalBill(
            provider_name="Hospital ABC",
            total_amount=5000.0,
            patient_responsibility=2000.0,
            insurance_paid=2500.0,
            insurance_adjustments=500.0,
            service_codes=["99213", "80053"],
            description="Office visit and lab work",
            is_itemized=True,
        ),
        MedicalBill(
            provider_name="Clinic XYZ",
            total_amount=1000.0,
            patient_responsibility=500.0,
            insurance_paid=400.0,
            insurance_adjustments=100.0,
            service_codes=["99214"],
            description="Specialist visit",
            is_itemized=False,
        ),
    ]


def test_calculate_total_medical_debt(sample_bills):
    total = navigation_engine._calculate_total_medical_debt(sample_bills)
    assert total == 2500.0


def test_calculate_debt_to_income_ratio(sample_bills):
    ratio = navigation_engine._calculate_debt_to_income_ratio(2500.0, 5000.0)
    assert ratio == 0.0417


def test_assess_risk_level_low(sample_bills, sample_insurance):
    ratio = navigation_engine._calculate_debt_to_income_ratio(2500.0, 5000.0)
    risk = navigation_engine._assess_risk_level(ratio, 2500.0, sample_insurance)
    assert risk.value == "low"


def test_assess_risk_level_high(sample_bills, sample_insurance):
    ratio = navigation_engine._calculate_debt_to_income_ratio(20000.0, 5000.0)
    risk = navigation_engine._assess_risk_level(ratio, 20000.0, sample_insurance)
    assert risk.value == "high"


def test_assess_hardship_level():
    assert navigation_engine._assess_hardship_level(50000.0, 1, 1000.0).value == "none"
    assert navigation_engine._assess_hardship_level(4000.0, 1, 5000.0).value == "mild"
    assert (
        navigation_engine._assess_hardship_level(2000.0, 1, 10000.0).value == "moderate"
    )
    assert (
        navigation_engine._assess_hardship_level(1000.0, 1, 20000.0).value == "severe"
    )


def test_create_navigation_plan(sample_bills, sample_insurance):
    plan = navigation_engine.create_navigation_plan(
        bills=sample_bills,
        insurance=sample_insurance,
        monthly_income=5000.0,
        household_size=1,
    )
    assert plan.total_medical_debt == 2500.0
    assert plan.risk_level in ["low", "medium", "high", "critical"]
    assert plan.hardship_level in ["none", "mild", "moderate", "severe"]
    assert len(plan.action_plan) > 0
    assert plan.estimated_total_savings >= 0


def test_analyze_situation(sample_bills, sample_insurance):
    analysis = navigation_engine.analyze_situation(
        bills=sample_bills,
        insurance=sample_insurance,
        monthly_income=5000.0,
        household_size=1,
    )
    assert "risk_level" in analysis
    assert "hardship_level" in analysis
    assert "total_medical_debt" in analysis
    assert analysis["total_medical_debt"] == 2500.0
