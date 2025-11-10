"""Pytest configuration and shared fixtures for Lambda testing."""

import json
import os
from typing import Any, Dict
from unittest.mock import MagicMock

import pytest
from moto import mock_aws


@pytest.fixture
def aws_credentials() -> None:
    """Mock AWS credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-west-1"


@pytest.fixture
def mock_dynamodb(aws_credentials: None) -> Any:
    """Mock DynamoDB service."""
    with mock_aws():
        yield


@pytest.fixture
def api_gateway_event() -> Dict[str, Any]:
    """Generate a mock API Gateway event."""
    return {
        "httpMethod": "GET",
        "path": "/user",
        "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer mock-token",
        },
        "requestContext": {
            "authorizer": {
                "claims": {
                    "sub": "test-user-123",
                    "email": "test@example.com",
                    "cognito:username": "testuser",
                }
            }
        },
        "body": None,
        "isBase64Encoded": False,
    }


@pytest.fixture
def api_gateway_post_event(api_gateway_event: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a mock API Gateway POST event."""
    event = api_gateway_event.copy()
    event.update(
        {
            "httpMethod": "POST",
            "body": json.dumps({"query": "test search query"}),
        }
    )
    return event


@pytest.fixture
def lambda_context() -> MagicMock:
    """Generate a mock Lambda context."""
    context = MagicMock()
    context.function_name = "test-function"
    context.memory_limit_in_mb = 128
    context.invoked_function_arn = "arn:aws:lambda:us-west-1:123456789012:function:test"
    context.aws_request_id = "test-request-id"
    return context


@pytest.fixture
def mock_env_vars() -> None:
    """Set mock environment variables for Lambda functions."""
    os.environ["SEARCHES_TABLE"] = "test-searches-table"
    os.environ["USERS_TABLE"] = "test-users-table"
    os.environ["AWS_REGION"] = "us-west-1"
