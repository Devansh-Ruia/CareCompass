from typing import List, Dict, Any
from datetime import datetime
from ..core.models import MedicalBill, BillAnalysisIssue


class BillAnalysisService:
    def __init__(self):
        self.cpt_database = self._load_cpt_database()
        self.common_errors = self._load_common_errors()

    def _load_cpt_database(self) -> Dict[str, Dict[str, Any]]:
        return {
            "99213": {
                "name": "Office Visit - Level 3",
                "category": "evaluation",
                "typical_cost_range": (100, 200),
            },
            "99214": {
                "name": "Office Visit - Level 4",
                "category": "evaluation",
                "typical_cost_range": (200, 300),
            },
            "99281": {
                "name": "Emergency Room Visit - Level 1",
                "category": "emergency",
                "typical_cost_range": (400, 600),
            },
            "70551": {
                "name": "MRI Brain without Contrast",
                "category": "imaging",
                "typical_cost_range": (1000, 1500),
            },
            "71250": {
                "name": "CT Scan Chest",
                "category": "imaging",
                "typical_cost_range": (600, 900),
            },
            "80053": {
                "name": "Comprehensive Metabolic Panel",
                "category": "laboratory",
                "typical_cost_range": (30, 60),
            },
            "45378": {
                "name": "Colonoscopy with Biopsy",
                "category": "procedure",
                "typical_cost_range": (2000, 3000),
            },
        }

    def _load_common_errors(self) -> List[Dict[str, Any]]:
        return [
            {
                "error_type": "duplicate_charge",
                "description": "Same service charged multiple times",
                "check_function": "_check_duplicates",
            },
            {
                "error_type": "coding_inconsistency",
                "description": "CPT code doesn't match description",
                "check_function": "_check_coding_consistency",
            },
            {
                "error_type": "incorrect_insurance_adjustment",
                "description": "Insurance adjustment seems incorrect",
                "check_function": "_check_insurance_adjustments",
            },
            {
                "error_type": "upcoding",
                "description": "Service coded at higher level than performed",
                "check_function": "_check_upcoding",
            },
            {
                "error_type": "unbundling",
                "description": "Procedure unbilled into separate codes",
                "check_function": "_check_unbundling",
            },
        ]

    def analyze_bills(self, bills: List[MedicalBill]) -> List[BillAnalysisIssue]:
        all_issues = []

        for bill in bills:
            issues = self._analyze_single_bill(bill)
            all_issues.extend(issues)

        return self._prioritize_issues(all_issues)

    def _analyze_single_bill(self, bill: MedicalBill) -> List[BillAnalysisIssue]:
        issues = []

        if not bill.is_itemized:
            issues.append(
                BillAnalysisIssue(
                    issue_type="not_itemized",
                    severity="medium",
                    description="Bill is not itemized, preventing detailed analysis",
                    potential_savings=bill.patient_responsibility * 0.10,
                    recommendation="Request an itemized bill to review charges in detail",
                )
            )
            return issues

        for error_info in self.common_errors:
            check_function = getattr(self, error_info["check_function"])
            found_issues = check_function(bill)
            issues.extend(found_issues)

        issues.extend(self._check_pricing_anomalies(bill))

        return issues

    def _check_duplicates(self, bill: MedicalBill) -> List[BillAnalysisIssue]:
        issues = []
        code_counts = {}

        for code in bill.service_codes:
            code_counts[code] = code_counts.get(code, 0) + 1

        for code, count in code_counts.items():
            if count > 1:
                code_info = self.cpt_database.get(code, {})
                typical_cost = code_info.get("typical_cost_range", (0, 0))[0]

                issues.append(
                    BillAnalysisIssue(
                        issue_type="duplicate_charge",
                        severity="high",
                        description=f"CPT code {code} appears {count} times on the same bill",
                        potential_savings=typical_cost * (count - 1),
                        recommendation="Verify that the service was actually performed multiple times. Contact the provider to dispute duplicate charges.",
                    )
                )

        return issues

    def _check_coding_consistency(self, bill: MedicalBill) -> List[BillAnalysisIssue]:
        issues = []

        if bill.description and "office visit" in bill.description.lower():
            if not any(code.startswith("992") for code in bill.service_codes):
                issues.append(
                    BillAnalysisIssue(
                        issue_type="coding_inconsistency",
                        severity="medium",
                        description="Bill description mentions office visit but no evaluation codes (992xx) found",
                        potential_savings=bill.patient_responsibility * 0.15,
                        recommendation="Request clarification on the codes used and verify they match the services provided",
                    )
                )

        for code in bill.service_codes:
            if code not in self.cpt_database:
                issues.append(
                    BillAnalysisIssue(
                        issue_type="unknown_code",
                        severity="low",
                        description=f"CPT code {code} not found in standard database",
                        potential_savings=0,
                        recommendation="Verify this code with your provider",
                    )
                )

        return issues

    def _check_insurance_adjustments(
        self, bill: MedicalBill
    ) -> List[BillAnalysisIssue]:
        issues = []

        if bill.insurance_adjustments == 0 and bill.insurance_paid == 0:
            if bill.total_amount > bill.patient_responsibility:
                issues.append(
                    BillAnalysisIssue(
                        issue_type="no_insurance_applied",
                        severity="high",
                        description="No insurance payment or adjustment recorded on bill",
                        potential_savings=bill.total_amount
                        - bill.patient_responsibility,
                        recommendation="Contact insurance to verify coverage was applied correctly",
                    )
                )

        if bill.insurance_adjustments > bill.total_amount:
            issues.append(
                BillAnalysisIssue(
                    issue_type="excessive_adjustment",
                    severity="medium",
                    description=f"Insurance adjustment (${bill.insurance_adjustments:.2f}) exceeds total bill (${bill.total_amount:.2f})",
                    potential_savings=0,
                    recommendation="Contact provider billing department for clarification",
                )
            )

        return issues

    def _check_upcoding(self, bill: MedicalBill) -> List[BillAnalysisIssue]:
        issues = []

        for code in bill.service_codes:
            if code.startswith("992"):
                code_info = self.cpt_database.get(code, {})
                if code_info and len(bill.description) < 50:
                    issues.append(
                        BillAnalysisIssue(
                            issue_type="potential_upcoding",
                            severity="medium",
                            description=f"Evaluation code {code} may be upcoded if description doesn't support complexity level",
                            potential_savings=bill.patient_responsibility * 0.20,
                            recommendation="Compare services received to code description and discuss with provider if discrepancy exists",
                        )
                    )

        return issues

    def _check_unbundling(self, bill: MedicalBill) -> List[BillAnalysisIssue]:
        issues = []

        bundled_codes = {
            "office_visit": ["99213", "99214"],
            "lab_panel": ["80053", "80061"],
        }

        if len(bill.service_codes) > 5:
            issues.append(
                BillAnalysisIssue(
                    issue_type="potential_unbundling",
                    severity="medium",
                    description=f"Bill contains {len(bill.service_codes)} separate codes which may indicate unbundling",
                    potential_savings=bill.patient_responsibility * 0.15,
                    recommendation="Ask if services could have been billed as a single bundled procedure",
                )
            )

        return issues

    def _check_pricing_anomalies(self, bill: MedicalBill) -> List[BillAnalysisIssue]:
        issues = []

        for code in bill.service_codes:
            code_info = self.cpt_database.get(code)
            if code_info and code_info.get("typical_cost_range"):
                typical_min, typical_max = code_info["typical_cost_range"]

                charge_per_service = (
                    bill.total_amount / len(bill.service_codes)
                    if bill.service_codes
                    else bill.total_amount
                )

                if charge_per_service > typical_max * 1.5:
                    savings = charge_per_service - typical_max
                    issues.append(
                        BillAnalysisIssue(
                            issue_type="pricing_anomaly",
                            severity="high",
                            description=f"Charge for code {code} (${charge_per_service:.2f}) significantly exceeds typical range (${typical_min}-{typical_max})",
                            potential_savings=savings,
                            recommendation="Request pricing justification or negotiate with provider",
                        )
                    )

        return issues

    def _prioritize_issues(
        self, issues: List[BillAnalysisIssue]
    ) -> List[BillAnalysisIssue]:
        severity_order = {"high": 0, "medium": 1, "low": 2}
        return sorted(
            issues, key=lambda x: (severity_order[x.severity], -x.potential_savings)
        )

    def generate_itemization_request(self, bill: MedicalBill) -> Dict[str, Any]:
        return {
            "request_type": "itemized_bill",
            "patient_contact_info": "Your contact information",
            "provider_info": {
                "name": bill.provider_name,
                "date": bill.service_date.strftime("%Y-%m-%d")
                if bill.service_date
                else "Unknown",
                "account_number": "Your account number",
            },
            "request_text": (
                f"Please provide a fully itemized bill for services rendered on "
                f"{bill.service_date.strftime('%Y-%m-%d') if bill.service_date else 'the relevant date'}. "
                f"The itemized bill should include:\n"
                f"- Date of each service\n"
                f"- Description of each service\n"
                f"- CPT/HCPCS code for each service\n"
                f"- Charge for each service\n"
                f"- Any adjustments or write-offs\n"
                f"- Insurance payments and patient responsibility\n\n"
                f"Please send to [your address] or [your email]."
            ),
            "additional_notes": [
                "Include NPI number of each provider",
                "Request proof of medical necessity if applicable",
                "Ask for charge master rates used",
            ],
        }

    def calculate_savings_opportunities(
        self, bills: List[MedicalBill]
    ) -> Dict[str, Any]:
        issues = self.analyze_bills(bills)

        total_potential_savings = sum(issue.potential_savings for issue in issues)

        issues_by_type = {}
        for issue in issues:
            if issue.issue_type not in issues_by_type:
                issues_by_type[issue.issue_type] = []
            issues_by_type[issue.issue_type].append(issue)

        summary = {}
        for issue_type, issue_list in issues_by_type.items():
            summary[issue_type] = {
                "count": len(issue_list),
                "total_savings": sum(issue.potential_savings for issue in issue_list),
                "average_savings": sum(issue.potential_savings for issue in issue_list)
                / len(issue_list),
            }

        return {
            "total_issues": len(issues),
            "total_potential_savings": round(total_potential_savings, 2),
            "issues_by_type": summary,
            "high_priority_issues": [
                issue for issue in issues if issue.severity == "high"
            ],
            "recommended_actions": [
                "Address high-severity issues first",
                "Request itemized bills for all charges",
                "Contact providers to dispute errors",
                "Review insurance EOB for all claims",
            ],
        }


bill_analyzer = BillAnalysisService()
