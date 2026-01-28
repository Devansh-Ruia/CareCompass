"""
Test feedback endpoint functionality
"""

import pytest
from unittest.mock import patch


class TestFeedbackEndpoint:
    """Test cases for feedback endpoint"""

    def test_submit_feedback_success(self, client, mock_resend):
        """Test successful feedback submission"""
        feedback_data = {
            "rating": 5,
            "category": "general",
            "comments": "Excellent service! Very helpful.",
            "name": "Jane Doe",
            "email": "jane@example.com",
        }

        response = client.post("/api/v1/feedback", json=feedback_data)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Thank you" in data["message"]
        mock_resend.assert_called_once()

    def test_submit_feedback_minimal_data(self, client, mock_resend):
        """Test feedback submission with minimal required data"""
        feedback_data = {"rating": 3, "comments": "Good service"}

        response = client.post("/api/v1/feedback", json=feedback_data)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        mock_resend.assert_called_once()

    def test_submit_feedback_invalid_rating(self, client):
        """Test feedback submission with invalid rating"""
        feedback_data = {
            "rating": 6,  # Invalid: should be 1-5
            "comments": "Good service",
        }

        response = client.post("/api/v1/feedback", json=feedback_data)

        assert response.status_code == 422

    def test_submit_feedback_empty_comments(self, client):
        """Test feedback submission with empty comments"""
        feedback_data = {
            "rating": 4,
            "comments": "",  # Empty comments should fail validation
        }

        response = client.post("/api/v1/feedback", json=feedback_data)

        assert response.status_code == 422

    def test_feedback_health_endpoint(self, client):
        """Test feedback health check endpoint"""
        response = client.get("/api/v1/feedback/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "email_configured" in data
        assert "service" in data
        assert data["service"] == "feedback"

    @patch("resend.Emails.send")
    def test_submit_feedback_email_failure(self, mock_send, client):
        """Test feedback submission when email sending fails"""
        mock_send.side_effect = Exception("Email service unavailable")

        feedback_data = {"rating": 4, "comments": "Good service"}

        response = client.post("/api/v1/feedback", json=feedback_data)

        assert response.status_code == 500
