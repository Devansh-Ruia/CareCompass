from typing import List, Dict, Any
from ..core.models import ServiceType, CostEstimate, InsuranceInfo


class CostEstimatorService:
    def __init__(self):
        self.service_costs = self._load_service_costs()

    def _load_service_costs(self) -> Dict[str, ServiceType]:
        return {
            "office_visit": ServiceType(
                code="99213",
                name="Office Visit - Level 3",
                category="primary_care",
                base_cost=150.00,
                description="Standard office visit for established patient",
            ),
            "emergency_room": ServiceType(
                code="99281",
                name="Emergency Room Visit - Level 1",
                category="emergency",
                base_cost=500.00,
                description="Emergency department visit for minor issues",
            ),
            "mri_scan": ServiceType(
                code="70551",
                name="MRI Brain without Contrast",
                category="imaging",
                base_cost=1200.00,
                description="Magnetic resonance imaging of brain",
            ),
            "ct_scan": ServiceType(
                code="71250",
                name="CT Scan Chest without Contrast",
                category="imaging",
                base_cost=700.00,
                description="Computed tomography of chest",
            ),
            "lab_work": ServiceType(
                code="80053",
                name="Comprehensive Metabolic Panel",
                category="laboratory",
                base_cost=45.00,
                description="Blood panel covering 14 tests",
            ),
            "surgery_minor": ServiceType(
                code="12001",
                name="Simple Repair of Skin Wounds",
                category="surgery",
                base_cost=400.00,
                description="Minor surgical procedure",
            ),
            "colonoscopy": ServiceType(
                code="45378",
                name="Colonoscopy with Biopsy",
                category="procedure",
                base_cost=2500.00,
                description="Diagnostic colonoscopy procedure",
            ),
            "physical_therapy": ServiceType(
                code="97110",
                name="Therapeutic Exercise",
                category="therapy",
                base_cost=85.00,
                description="Physical therapy session",
            ),
            "specialist_visit": ServiceType(
                code="99214",
                name="Specialist Visit - Level 4",
                category="specialist",
                base_cost=250.00,
                description="Visit with medical specialist",
            ),
            "prescription_generic": ServiceType(
                code="N/A",
                name="Generic Prescription Medication",
                category="pharmacy",
                base_cost=30.00,
                description="Standard generic medication",
            ),
        }

    def estimate_cost(
        self,
        service_code: str,
        insurance: InsuranceInfo,
        location: str = "midwest",
        is_emergency: bool = False,
        in_network: bool = True,
    ) -> CostEstimate:
        service = self.service_costs.get(
            service_code, self.service_costs["office_visit"]
        )

        base_cost = service.base_cost

        location_multiplier = self._get_location_multiplier(location)
        adjusted_cost = base_cost * location_multiplier

        if is_emergency and service.category != "emergency":
            adjusted_cost *= 2.0

        if not in_network:
            adjusted_cost *= 1.5

        cost_range = (round(adjusted_cost * 0.85, 2), round(adjusted_cost * 1.15, 2))

        insurance_coverage = self._calculate_insurance_coverage(
            adjusted_cost, insurance
        )
        with_insurance = insurance_coverage["total_cost"]
        out_of_pocket = insurance_coverage["patient_responsibility"]

        alternatives = self._find_alternatives(service_code, insurance)

        return CostEstimate(
            service_name=service.name,
            base_cost=round(base_cost, 2),
            estimated_range=cost_range,
            location_multiplier=location_multiplier,
            with_insurance=round(with_insurance, 2),
            out_of_pocket=round(out_of_pocket, 2),
            alternatives=alternatives,
        )

    def _get_location_multiplier(self, location: str) -> float:
        multipliers = {
            "northeast": 1.25,
            "west": 1.20,
            "midwest": 0.95,
            "south": 0.90,
        }
        return multipliers.get(location.lower(), 1.0)

    def _calculate_insurance_coverage(
        self, cost: float, insurance: InsuranceInfo
    ) -> Dict[str, float]:
        remaining_deductible = insurance.annual_deductible - insurance.deductible_met
        remaining_oop = insurance.annual_out_of_pocket_max - insurance.out_of_pocket_met

        patient_responsibility = 0.0
        insurance_paid = 0.0

        if remaining_deductible > 0:
            deductible_amount = min(cost, remaining_deductible)
            patient_responsibility += deductible_amount
            cost -= deductible_amount

        if cost > 0 and insurance.coinsurance_rate > 0:
            coinsurance_amount = cost * insurance.coinsurance_rate
            max_coinsurance = max(0, remaining_oop - patient_responsibility)
            coinsurance_to_pay = min(coinsurance_amount, max_coinsurance)
            patient_responsibility += coinsurance_to_pay
            cost -= coinsurance_to_pay

        insurance_paid = cost

        return {
            "patient_responsibility": patient_responsibility,
            "insurance_paid": insurance_paid,
            "total_cost": patient_responsibility + insurance_paid,
        }

    def _find_alternatives(
        self, service_code: str, insurance: InsuranceInfo
    ) -> List[Dict[str, Any]]:
        alternatives = []

        if service_code == "emergency_room":
            alternatives.append(
                {
                    "type": "Urgent Care",
                    "estimated_cost": self.service_costs["office_visit"].base_cost
                    * 1.5,
                    "description": "Consider urgent care for non-life-threatening issues",
                    "savings": "60-80%",
                }
            )

        if service_code == "mri_scan":
            alternatives.append(
                {
                    "type": "CT Scan",
                    "estimated_cost": self.service_costs["ct_scan"].base_cost,
                    "description": "Ask if CT scan could be sufficient for diagnosis",
                    "savings": "40-50%",
                }
            )

        if service_code == "colonoscopy":
            alternatives.append(
                {
                    "type": "At-home Screening",
                    "estimated_cost": 150.00,
                    "description": "Cologuard or FIT test for routine screening",
                    "savings": "90-95%",
                }
            )

        return alternatives

    def get_available_services(self) -> List[Dict[str, Any]]:
        return [
            {
                "code": code,
                "name": service.name,
                "category": service.category,
                "base_cost": service.base_cost,
                "description": service.description,
            }
            for code, service in self.service_costs.items()
        ]


cost_estimator = CostEstimatorService()
