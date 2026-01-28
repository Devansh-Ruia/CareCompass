"""
Test configuration and fixtures for MedFin API
"""

import pytest
import asyncio
from typing import Generator, Any, Dict
from fastapi.testclient import TestClient
import os

# Set test environment
os.environ["APP_ENV"] = "testing"
os.environ["LOG_LEVEL"] = "DEBUG"

from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of default event loop for test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client() -> Generator[TestClient, Any, None]:
    """Create a test client for FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_resend():
    """Mock Resend email service."""
    from unittest.mock import patch

    with patch("resend.Emails.send") as mock_send:
        mock_send.return_value = {"id": "test_email_id"}
        yield mock_send


@pytest.fixture
def sample_feedback_data() -> Dict[str, Any]:
    """Sample feedback data for testing."""
    return {
        "rating": 4,
        "category": "general",
        "comments": "Great service! Very helpful tool.",
        "name": "John Doe",
        "email": "john.doe@example.com",
    }
