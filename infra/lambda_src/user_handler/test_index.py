"""Unit tests for user_handler Lambda function."""

import json
from typing import Any, Dict
from unittest.mock import MagicMock

from index import handler


class TestUserHandler:
    """Test suite for user profile handler."""

    def test_handler_returns_user_info(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
    ) -> None:
        """Test that handler returns correct user information."""
        result = handler(api_gateway_event, lambda_context)

        assert result["statusCode"] == 200
        assert "Content-Type" in result["headers"]

        body = json.loads(result["body"])
        assert body["userId"] == "test-user-123"
        assert body["email"] == "test@example.com"
        assert body["onboardingComplete"] is False

    def test_handler_with_missing_claims(
        self,
        lambda_context: MagicMock,
    ) -> None:
        """Test handler behavior with missing user claims."""
        event = {
            "requestContext": {"authorizer": {"claims": {}}}
        }

        result = handler(event, lambda_context)

        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert body["userId"] == ""
        assert body["email"] == ""

    def test_handler_with_name_claim(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
    ) -> None:
        """Test handler includes name when present in claims."""
        claims = api_gateway_event["requestContext"]["authorizer"]["claims"]
        claims["name"] = "Test User"

        result = handler(api_gateway_event, lambda_context)

        body = json.loads(result["body"])
        assert body["name"] == "Test User"

    def test_handler_includes_cors_headers(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
    ) -> None:
        """Test that CORS headers are included in response."""
        result = handler(api_gateway_event, lambda_context)

        assert "Access-Control-Allow-Origin" in result["headers"]
        assert result["headers"]["Access-Control-Allow-Origin"] == "*"

    def test_handler_with_empty_event(self, lambda_context: MagicMock) -> None:
        """Test handler behavior with empty event."""
        event: Dict[str, Any] = {}

        result = handler(event, lambda_context)

        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert "userId" in body
        assert "email" in body
