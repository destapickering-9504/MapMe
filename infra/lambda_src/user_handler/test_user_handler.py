"""Unit tests for user_handler Lambda function."""

import json
import os
from typing import Any, Dict
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from .index import (
    handle_get_user,
    handle_put_user,
    handler,
    validate_user_input,
)


class TestValidation:
    """Test input validation functions."""

    def test_validate_user_input_valid_name(self) -> None:
        """Test validation with valid name."""
        body = {"name": "John Doe"}
        is_valid, errors = validate_user_input(body)
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_user_input_valid_avatar_url(self) -> None:
        """Test validation with valid avatar URL."""
        body = {"avatarUrl": "https://example.com/avatar.jpg"}
        is_valid, errors = validate_user_input(body)
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_user_input_name_too_long(self) -> None:
        """Test validation with name exceeding max length."""
        body = {"name": "a" * 101}
        is_valid, errors = validate_user_input(body)
        assert is_valid is False
        assert len(errors) == 1
        assert "name must not exceed 100 characters" in errors[0]

    def test_validate_user_input_invalid_avatar_url(self) -> None:
        """Test validation with invalid avatar URL."""
        body = {"avatarUrl": "not-a-url"}
        is_valid, errors = validate_user_input(body)
        assert is_valid is False
        assert len(errors) == 1
        assert "avatarUrl must be a valid URL" in errors[0]

    def test_validate_user_input_multiple_errors(self) -> None:
        """Test validation with multiple errors."""
        body = {"name": "a" * 101, "avatarUrl": "not-a-url"}
        is_valid, errors = validate_user_input(body)
        assert is_valid is False
        assert len(errors) == 2

    def test_validate_user_input_empty_fields(self) -> None:
        """Test validation with empty optional fields."""
        body = {"name": "", "avatarUrl": ""}
        is_valid, errors = validate_user_input(body)
        assert is_valid is True
        assert len(errors) == 0


class TestHandlerRouting:
    """Test handler routing and method handling."""

    def test_handler_get_request(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test handler routes GET requests correctly."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"
        api_gateway_event["httpMethod"] = "GET"

        with patch("lambda_src.user_handler.index.get_dynamodb_table") as mock_get_table:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {}
            mock_get_table.return_value = mock_table
            result = handler(api_gateway_event, lambda_context)
            assert result["statusCode"] == 200

    def test_handler_put_request(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test handler routes PUT requests correctly."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"
        api_gateway_event["httpMethod"] = "PUT"
        api_gateway_event["body"] = json.dumps({"name": "Test User"})

        with patch("lambda_src.user_handler.index.get_dynamodb_table") as mock_get_table:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {}
            mock_table.put_item.return_value = {}
            mock_get_table.return_value = mock_table
            result = handler(api_gateway_event, lambda_context)
            assert result["statusCode"] == 200

    def test_handler_unsupported_method(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test handler returns 405 for unsupported methods."""
        api_gateway_event["httpMethod"] = "DELETE"
        result = handler(api_gateway_event, lambda_context)
        assert result["statusCode"] == 405

    def test_handler_missing_user_id(
        self,
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test handler returns 401 when user ID is missing."""
        event = {"httpMethod": "GET", "requestContext": {"authorizer": {"claims": {}}}}
        result = handler(event, lambda_context)
        assert result["statusCode"] == 401
        body = json.loads(result["body"])
        assert "error" in body


class TestGetUser:
    """Test GET user handler."""

    def test_handle_get_user_existing_user(
        self,
        mock_env_vars: None,
    ) -> None:
        """Test retrieving an existing user."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"

        with patch("lambda_src.user_handler.index.get_dynamodb_table") as mock_get_table:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {
                "Item": {
                    "userId": "test-123",
                    "email": "test@example.com",
                    "name": "Test User",
                    "avatarUrl": "https://example.com/avatar.jpg",
                    "createdAt": "2023-01-01T00:00:00Z",
                    "updatedAt": "2023-01-02T00:00:00Z",
                }
            }
            mock_get_table.return_value = mock_table

            result = handle_get_user("test-123", "test@example.com", "req-123")

            assert result["statusCode"] == 200
            body = json.loads(result["body"])
            assert body["userId"] == "test-123"
            assert body["name"] == "Test User"
            assert body["onboardingComplete"] is True

    def test_handle_get_user_nonexistent_user(
        self,
        mock_env_vars: None,
    ) -> None:
        """Test retrieving a user that doesn't exist in DB."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"

        with patch("lambda_src.user_handler.index.get_dynamodb_table") as mock_get_table:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {}
            mock_get_table.return_value = mock_table

            result = handle_get_user("test-123", "test@example.com", "req-123")

            assert result["statusCode"] == 200
            body = json.loads(result["body"])
            assert body["userId"] == "test-123"
            assert body["name"] == ""
            assert body["onboardingComplete"] is False

    def test_handle_get_user_dynamodb_error(
        self,
        mock_env_vars: None,
    ) -> None:
        """Test handling DynamoDB errors during GET."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"

        with patch("lambda_src.user_handler.index.get_dynamodb_table") as mock_get_table:
            mock_table = MagicMock()
            mock_table.get_item.side_effect = ClientError(
                {"Error": {"Code": "ServiceUnavailable"}}, "GetItem"
            )
            mock_get_table.return_value = mock_table

            result = handle_get_user("test-123", "test@example.com", "req-123")

            assert result["statusCode"] == 500
            body = json.loads(result["body"])
            assert "error" in body


class TestPutUser:
    """Test PUT user handler."""

    def test_handle_put_user_new_user(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test creating a new user."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"

        event = api_gateway_event.copy()
        event["body"] = json.dumps(
            {"name": "New User", "avatarUrl": "https://example.com/avatar.jpg"}
        )

        with patch("lambda_src.user_handler.index.get_dynamodb_table") as mock_get_table:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {}  # User doesn't exist
            mock_table.put_item.return_value = {}
            mock_get_table.return_value = mock_table

            result = handle_put_user("test-123", "test@example.com", event, "req-123")

            assert result["statusCode"] == 200
            body = json.loads(result["body"])
            assert body["name"] == "New User"
            assert body["onboardingComplete"] is True
            assert "createdAt" in body

    def test_handle_put_user_update_existing(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test updating an existing user."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"

        event = api_gateway_event.copy()
        event["body"] = json.dumps({"name": "Updated Name"})

        with patch("lambda_src.user_handler.index.get_dynamodb_table") as mock_get_table:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {
                "Item": {
                    "userId": "test-123",
                    "email": "test@example.com",
                    "name": "Old Name",
                    "avatarUrl": "https://example.com/old.jpg",
                    "createdAt": "2023-01-01T00:00:00Z",
                }
            }
            mock_table.put_item.return_value = {}
            mock_get_table.return_value = mock_table

            result = handle_put_user("test-123", "test@example.com", event, "req-123")

            assert result["statusCode"] == 200
            body = json.loads(result["body"])
            assert body["name"] == "Updated Name"
            # Should preserve existing avatarUrl
            assert body["avatarUrl"] == "https://example.com/old.jpg"

    def test_handle_put_user_invalid_json(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test handling invalid JSON in request body."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"

        event = api_gateway_event.copy()
        event["body"] = "invalid json{"

        result = handle_put_user("test-123", "test@example.com", event, "req-123")

        assert result["statusCode"] == 400
        body = json.loads(result["body"])
        assert "Invalid JSON" in body["error"]

    def test_handle_put_user_validation_failure(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test handling validation failures."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"

        event = api_gateway_event.copy()
        event["body"] = json.dumps({"name": "a" * 101})

        result = handle_put_user("test-123", "test@example.com", event, "req-123")

        assert result["statusCode"] == 400
        body = json.loads(result["body"])
        assert "Validation failed" in body["error"]
        assert "details" in body

    def test_handle_put_user_dynamodb_error(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test handling DynamoDB errors during PUT."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"

        event = api_gateway_event.copy()
        event["body"] = json.dumps({"name": "Test User"})

        with patch("lambda_src.user_handler.index.get_dynamodb_table") as mock_get_table:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {}
            mock_table.put_item.side_effect = ClientError(
                {"Error": {"Code": "ServiceUnavailable"}}, "PutItem"
            )
            mock_get_table.return_value = mock_table

            result = handle_put_user("test-123", "test@example.com", event, "req-123")

            assert result["statusCode"] == 500
            body = json.loads(result["body"])
            assert "error" in body


class TestResponseFormat:
    """Test response format and headers."""

    def test_response_includes_cors_headers(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test that CORS headers are included in response."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"

        with patch("lambda_src.user_handler.index.get_dynamodb_table") as mock_get_table:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {}
            mock_get_table.return_value = mock_table
            result = handler(api_gateway_event, lambda_context)

            assert "Access-Control-Allow-Origin" in result["headers"]
            assert result["headers"]["Access-Control-Allow-Origin"] == "*"

    def test_response_content_type_json(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test that Content-Type is JSON."""
        os.environ["USERS_TABLE_NAME"] = "test-users-table"

        with patch("lambda_src.user_handler.index.get_dynamodb_table") as mock_get_table:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {}
            mock_get_table.return_value = mock_table
            result = handler(api_gateway_event, lambda_context)

            assert result["headers"]["Content-Type"] == "application/json"
