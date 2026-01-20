from typing import Dict, Any
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "MedFin API"
    app_version: str = "1.0.0"
    debug: bool = False

    api_v1_prefix: str = "/api/v1"

    cors_origins: list[str] = ["*"]

    financial_guidelines: Dict[str, Any] = {
        "federal_poverty_level": {
            "2024": {
                "1": 15180,
                "2": 20440,
                "3": 25700,
                "4": 30960,
                "5": 36220,
                "6": 41480,
                "7": 46740,
                "8": 52000,
            }
        },
        "charity_care_income_thresholds": {
            "full_assistance": 2.0,
            "partial_assistance": 4.0,
        },
        "hardship_debt_to_income_ratio": {
            "mild": 0.10,
            "moderate": 0.20,
            "severe": 0.40,
        },
        "out_of_pocket_limits": {
            "private_individual": 9100,
            "private_family": 18200,
            "medicare": 8300,
        },
    }

    location_multipliers: Dict[str, float] = {
        "northeast": 1.25,
        "west": 1.20,
        "midwest": 0.95,
        "south": 0.90,
        "urban": 1.15,
        "rural": 0.85,
    }

    cost_estimate_defaults: Dict[str, Any] = {
        "confidence_interval": 0.15,
        "out_of_network_penalty": 1.5,
        "emergency_multiplier": 2.0,
    }


settings = Settings()
