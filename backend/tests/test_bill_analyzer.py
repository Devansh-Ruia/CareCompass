import pytest
from app.services.bill_analyzer import bill_analyzer
from app.core.models import MedicalBill


def test_detect_duplicate_charges():
    bills = [
        MedicalBill(
            provider_name="Hospital ABC",
            total_amount=5000.0,
            patient_responsibility=2000.0,
            insurance_paid=2500.0,
            insurance_adjustments=500.0,
            service_codes=["99213", "99213", "80053"],
            description="Office visit and lab work",
            is_itemized=True,
        ),
    ]
    issues = bill_analyzer.analyze_bills(bills)
    duplicate_issues = [i for i in issues if i.issue_type == "duplicate_charge"]
    assert len(duplicate_issues) > 0


def test_detect_not_itemized():
    bill = MedicalBill(
        provider_name="Clinic XYZ",
        total_amount=1000.0,
        patient_responsibility=1000.0,
        insurance_paid=0.0,
        insurance_adjustments=0.0,
        service_codes=["99214"],
        description="Specialist visit",
        is_itemized=False,
    )
    issues = bill_analyzer.analyze_bills([bill])
    assert any(i.issue_type == "not_itemized" for i in issues)


def test_detect_no_insurance_applied():
    bill = MedicalBill(
        provider_name="Test Hospital",
        total_amount=4000.0,
        patient_responsibility=3000.0,
        insurance_paid=0.0,
        insurance_adjustments=0.0,
        service_codes=["99213"],
        description="Service",
        is_itemized=True,
    )
    issues = bill_analyzer.analyze_bills([bill])
    assert any(i.issue_type == "no_insurance_applied" for i in issues)


def test_generate_itemization_request():
    bill = MedicalBill(
        provider_name="Test Hospital",
        total_amount=5000.0,
        patient_responsibility=2000.0,
        insurance_paid=2500.0,
        insurance_adjustments=500.0,
        service_codes=["99213"],
        description="Office visit",
        is_itemized=False,
    )
    itemization = bill_analyzer.generate_itemization_request(bill)
    assert "request_type" in itemization
    assert itemization["request_type"] == "itemized_bill"
    assert "request_text" in itemization
    assert len(itemization["request_text"]) > 0


def test_calculate_savings_opportunities():
    bills = [
        MedicalBill(
            provider_name="Hospital ABC",
            total_amount=5000.0,
            patient_responsibility=2000.0,
            insurance_paid=2500.0,
            insurance_adjustments=500.0,
            service_codes=["99213", "99213"],
            description="Office visit",
            is_itemized=True,
        ),
    ]
    savings = bill_analyzer.calculate_savings_opportunities(bills)
    assert "total_issues" in savings
    assert "total_potential_savings" in savings
    assert savings["total_issues"] >= 0
    assert savings["total_potential_savings"] >= 0
