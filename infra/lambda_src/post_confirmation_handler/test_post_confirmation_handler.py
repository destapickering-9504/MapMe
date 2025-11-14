"""Unit tests for post-confirmation Lambda handler."""

import json
import os
from datetime import datetime
from typing import Any, Dict
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError


@pytest.fixture
def mock_context() -> MagicMock:
    """Create mock Lambda context."""
    context = MagicMock()
    context.aws_request_id = "test-request-id"
    return context


@pytest.fixture
def cognito_event() -> Dict[str, Any]:
    """Create sample Cognito post-confirmation event."""
    return {
        "version": "1",
        "region": "us-west-2",
        "userPoolId": "us-west-2_test123",
        "userName": "test-user",
        "callerContext": {
            "awsSdkVersion": "aws-sdk-unknown-unknown",
            "clientId": "test-client-id",
        },
        "triggerSource": "PostConfirmation_ConfirmSignUp",
        "request": {
            "userAttributes": {
                "sub": "12345678-1234-1234-1234-123456789abc",
                "email": "test@example.com",
                "email_verified": "true",
            }
        },
        "response": {},
    }


class TestPostConfirmationHandler:
    """Test cases for post-confirmation handler."""

    @patch.dict(os.environ, {"USERS_TABLE_NAME": "test-users-table"})
    @patch("lambda_src.post_confirmation_handler.index.get_dynamodb_table")
    def test_successful_user_creation(
        self,
        mock_get_table: MagicMock,
        cognito_event: Dict[str, Any],
        mock_context: MagicMock,
    ) -> None:
        """Test successful user record creation."""
        # Import handler after patching environment
        from .index import handler

        # Setup mock table
        mock_table = MagicMock()
        mock_get_table.return_value = mock_table

        # Call handler
        result = handler(cognito_event, mock_context)

        # Verify table interaction
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args
        user_data = call_args.kwargs["Item"]

        assert user_data["userId"] == "12345678-1234-1234-1234-123456789abc"
        assert user_data["email"] == "test@example.com"
        assert user_data["name"] == ""
        assert user_data["avatarUrl"] == ""
        assert "createdAt" in user_data
        assert "updatedAt" in user_data

        # Verify event is returned unchanged
        assert result == cognito_event

    @patch.dict(os.environ, {"USERS_TABLE_NAME": "test-users-table"})
    @patch("lambda_src.post_confirmation_handler.index.get_dynamodb_table")
    def test_missing_user_id(
        self,
        mock_get_table: MagicMock,
        cognito_event: Dict[str, Any],
        mock_context: MagicMock,
    ) -> None:
        """Test handling of missing user ID."""
        from .index import handler

        # Remove sub from event
        del cognito_event["request"]["userAttributes"]["sub"]

        # Setup mock table
        mock_table = MagicMock()
        mock_get_table.return_value = mock_table

        # Call handler
        result = handler(cognito_event, mock_context)

        # Verify no table interaction
        mock_table.put_item.assert_not_called()

        # Verify event is still returned
        assert result == cognito_event

    @patch.dict(os.environ, {"USERS_TABLE_NAME": "test-users-table"})
    @patch("lambda_src.post_confirmation_handler.index.get_dynamodb_table")
    def test_missing_email(
        self,
        mock_get_table: MagicMock,
        cognito_event: Dict[str, Any],
        mock_context: MagicMock,
    ) -> None:
        """Test handling of missing email."""
        from .index import handler

        # Remove email from event
        del cognito_event["request"]["userAttributes"]["email"]

        # Setup mock table
        mock_table = MagicMock()
        mock_get_table.return_value = mock_table

        # Call handler
        result = handler(cognito_event, mock_context)

        # Verify no table interaction
        mock_table.put_item.assert_not_called()

        # Verify event is still returned
        assert result == cognito_event

    @patch.dict(os.environ, {"USERS_TABLE_NAME": "test-users-table"})
    @patch("lambda_src.post_confirmation_handler.index.get_dynamodb_table")
    def test_dynamodb_error_handling(
        self,
        mock_get_table: MagicMock,
        cognito_event: Dict[str, Any],
        mock_context: MagicMock,
    ) -> None:
        """Test handling of DynamoDB errors."""
        from .index import handler

        # Setup mock table to raise error
        mock_table = MagicMock()
        mock_table.put_item.side_effect = ClientError(
            {"Error": {"Code": "ProvisionedThroughputExceededException"}},
            "PutItem",
        )
        mock_get_table.return_value = mock_table

        # Call handler - should not raise exception
        result = handler(cognito_event, mock_context)

        # Verify event is still returned even on error
        assert result == cognito_event

    @patch.dict(os.environ, {"USERS_TABLE_NAME": "test-users-table"})
    @patch("lambda_src.post_confirmation_handler.index.get_dynamodb_table")
    def test_unexpected_error_handling(
        self,
        mock_get_table: MagicMock,
        cognito_event: Dict[str, Any],
        mock_context: MagicMock,
    ) -> None:
        """Test handling of unexpected errors."""
        from .index import handler

        # Setup mock table to raise unexpected error
        mock_table = MagicMock()
        mock_table.put_item.side_effect = Exception("Unexpected error")
        mock_get_table.return_value = mock_table

        # Call handler - should not raise exception
        result = handler(cognito_event, mock_context)

        # Verify event is still returned even on error
        assert result == cognito_event
