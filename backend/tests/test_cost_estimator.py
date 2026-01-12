import pytest
from app.services.cost_estimator import cost_estimator
from app.core.models import InsuranceInfo


@pytest.fixture
def sample_insurance():
    return InsuranceInfo(
        insurance_type="private",
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


def test_cost_estimator_available_services():
    services = cost_estimator.get_available_services()
    assert len(services) > 0
    assert any(s["code"] == "office_visit" for s in services)


def test_estimate_cost_basic(sample_insurance):
    estimate = cost_estimator.estimate_cost(
        service_code="office_visit",
        insurance=sample_insurance,
        location="midwest",
        is_emergency=False,
        in_network=True,
    )
    assert estimate.service_name == "Office Visit - Level 3"
    assert estimate.base_cost == 150.0
    assert estimate.location_multiplier == 0.95
    assert estimate.with_insurance >= 0
    assert estimate.out_of_pocket >= 0


def test_estimate_cost_emergency(sample_insurance):
    estimate = cost_estimator.estimate_cost(
        service_code="office_visit",
        insurance=sample_insurance,
        location="midwest",
        is_emergency=True,
        in_network=True,
    )
    assert estimate.location_multiplier == 0.95


def test_estimate_cost_out_of_network(sample_insurance):
    estimate = cost_estimator.estimate_cost(
        service_code="office_visit",
        insurance=sample_insurance,
        location="midwest",
        is_emergency=False,
        in_network=False,
    )
    assert estimate.out_of_pocket > sample_insurance.copay_amount


def test_estimate_cost_location_multipliers(sample_insurance):
    northeast_estimate = cost_estimator.estimate_cost(
        service_code="office_visit",
        insurance=sample_insurance,
        location="northeast",
        is_emergency=False,
        in_network=True,
    )
    south_estimate = cost_estimator.estimate_cost(
        service_code="office_visit",
        insurance=sample_insurance,
        location="south",
        is_emergency=False,
        in_network=True,
    )
    assert northeast_estimate.location_multiplier > south_estimate.location_multiplier


def test_estimate_cost_with_alternatives(sample_insurance):
    estimate = cost_estimator.estimate_cost(
        service_code="emergency_room",
        insurance=sample_insurance,
        location="midwest",
        is_emergency=True,
        in_network=True,
    )
    assert len(estimate.alternatives) > 0
