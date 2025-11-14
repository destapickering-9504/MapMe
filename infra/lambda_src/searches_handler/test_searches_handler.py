"""Unit tests for searches_handler Lambda function."""

import json
import os
from typing import Any, Dict
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from .index import (
    get_ddb_client,
    handle_get_searches,
    handle_post_search,
    handler,
    validate_search_input,
)


class TestValidation:
    """Test input validation functions."""

    def test_validate_search_input_valid_query(self) -> None:
        """Test validation with valid query."""
        body = {"query": "test search query"}
        is_valid, errors = validate_search_input(body)
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_search_input_missing_query(self) -> None:
        """Test validation with missing query."""
        body: Dict[str, Any] = {}
        is_valid, errors = validate_search_input(body)
        assert is_valid is False
        assert len(errors) == 1
        assert "query is required" in errors[0]

    def test_validate_search_input_empty_query(self) -> None:
        """Test validation with empty query."""
        body = {"query": ""}
        is_valid, errors = validate_search_input(body)
        assert is_valid is False
        assert len(errors) == 1

    def test_validate_search_input_query_too_long(self) -> None:
        """Test validation with query exceeding max length."""
        body = {"query": "a" * 501}
        is_valid, errors = validate_search_input(body)
        assert is_valid is False
        assert len(errors) == 1
        assert "query must not exceed 500 characters" in errors[0]

    def test_validate_search_input_non_string_query(self) -> None:
        """Test validation with non-string query."""
        body = {"query": 123}
        is_valid, errors = validate_search_input(body)
        assert is_valid is False
        assert len(errors) == 1
        assert "query must be a string" in errors[0]


class TestHandlerRouting:
    """Test handler routing and method handling."""

    def test_handler_get_request(
        self,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test handler routes GET requests correctly."""
        api_gateway_event["httpMethod"] = "GET"

        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.query.return_value = {"Items": []}
            mock_client.return_value = (mock_ddb, "test-searches-table")

            result = handler(api_gateway_event, lambda_context)
            assert result["statusCode"] == 200

    def test_handler_post_request(
        self,
        api_gateway_post_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test handler routes POST requests correctly."""
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.put_item.return_value = {}
            mock_client.return_value = (mock_ddb, "test-searches-table")

            result = handler(api_gateway_post_event, lambda_context)
            assert result["statusCode"] == 201

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


class TestGetSearches:
    """Test GET searches handler."""

    def test_handle_get_searches_with_results(
        self,
        mock_env_vars: None,
    ) -> None:
        """Test retrieving searches with results."""
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.query.return_value = {
                "Items": [
                    {
                        "userId": {"S": "test-123"},
                        "createdAt": {"S": "1234567890"},
                        "query": {"S": "first search"},
                    },
                    {
                        "userId": {"S": "test-123"},
                        "createdAt": {"S": "1234567891"},
                        "query": {"S": "second search"},
                    },
                ]
            }
            mock_client.return_value = (mock_ddb, "test-searches-table")

            result = handle_get_searches("test-123", "req-123")

            assert result["statusCode"] == 200
            body = json.loads(result["body"])
            assert len(body) == 2
            assert body[0]["query"] == "first search"

    def test_handle_get_searches_empty(
        self,
        mock_env_vars: None,
    ) -> None:
        """Test retrieving searches with no results."""
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.query.return_value = {"Items": []}
            mock_client.return_value = (mock_ddb, "test-searches-table")

            result = handle_get_searches("test-123", "req-123")

            assert result["statusCode"] == 200
            body = json.loads(result["body"])
            assert len(body) == 0

    def test_handle_get_searches_limit(
        self,
        mock_env_vars: None,
    ) -> None:
        """Test that searches are limited to 20."""
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.query.return_value = {"Items": []}
            mock_client.return_value = (mock_ddb, "test-searches-table")

            handle_get_searches("test-123", "req-123")

            # Verify query was called with Limit=20
            call_args = mock_ddb.query.call_args
            assert call_args[1]["Limit"] == 20

    def test_handle_get_searches_reverse_order(
        self,
        mock_env_vars: None,
    ) -> None:
        """Test that searches are returned in reverse chronological order."""
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.query.return_value = {"Items": []}
            mock_client.return_value = (mock_ddb, "test-searches-table")

            handle_get_searches("test-123", "req-123")

            # Verify ScanIndexForward is False
            call_args = mock_ddb.query.call_args
            assert call_args[1]["ScanIndexForward"] is False

    def test_handle_get_searches_dynamodb_error(
        self,
        mock_env_vars: None,
    ) -> None:
        """Test handling DynamoDB errors during GET."""
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.query.side_effect = ClientError(
                {"Error": {"Code": "ServiceUnavailable"}}, "Query"
            )
            mock_client.return_value = (mock_ddb, "test-searches-table")

            result = handle_get_searches("test-123", "req-123")

            assert result["statusCode"] == 500
            body = json.loads(result["body"])
            assert "error" in body


class TestPostSearch:
    """Test POST search handler."""

    def test_handle_post_search_valid(
        self,
        api_gateway_post_event: Dict[str, Any],
        mock_env_vars: None,
    ) -> None:
        """Test creating a search with valid data."""
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.put_item.return_value = {}
            mock_client.return_value = (mock_ddb, "test-searches-table")

            result = handle_post_search(api_gateway_post_event, "test-123", "req-123")

            assert result["statusCode"] == 201
            body = json.loads(result["body"])
            assert body["ok"] is True
            assert "timestamp" in body

    def test_handle_post_search_creates_item(
        self,
        api_gateway_post_event: Dict[str, Any],
        mock_env_vars: None,
    ) -> None:
        """Test that POST creates correct DynamoDB item."""
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.put_item.return_value = {}
            mock_client.return_value = (mock_ddb, "test-searches-table")

            handle_post_search(api_gateway_post_event, "test-123", "req-123")

            # Verify put_item was called
            assert mock_ddb.put_item.called
            call_args = mock_ddb.put_item.call_args
            item = call_args[1]["Item"]

            assert "userId" in item
            assert "createdAt" in item
            assert "query" in item
            assert item["query"]["S"] == "test search query"

    def test_handle_post_search_invalid_json(
        self,
        api_gateway_event: Dict[str, Any],
        mock_env_vars: None,
    ) -> None:
        """Test handling invalid JSON in request body."""
        event = api_gateway_event.copy()
        event["body"] = "invalid json{"

        result = handle_post_search(event, "test-123", "req-123")

        assert result["statusCode"] == 400
        body = json.loads(result["body"])
        assert "Invalid JSON" in body["error"]

    def test_handle_post_search_missing_query(
        self,
        api_gateway_event: Dict[str, Any],
        mock_env_vars: None,
    ) -> None:
        """Test handling missing query field."""
        event = api_gateway_event.copy()
        event["body"] = json.dumps({})

        result = handle_post_search(event, "test-123", "req-123")

        assert result["statusCode"] == 400
        body = json.loads(result["body"])
        assert "Validation failed" in body["error"]

    def test_handle_post_search_query_too_long(
        self,
        api_gateway_event: Dict[str, Any],
        mock_env_vars: None,
    ) -> None:
        """Test handling query that exceeds max length."""
        event = api_gateway_event.copy()
        event["body"] = json.dumps({"query": "a" * 501})

        result = handle_post_search(event, "test-123", "req-123")

        assert result["statusCode"] == 400
        body = json.loads(result["body"])
        assert "Validation failed" in body["error"]
        assert "details" in body

    def test_handle_post_search_dynamodb_error(
        self,
        api_gateway_post_event: Dict[str, Any],
        mock_env_vars: None,
    ) -> None:
        """Test handling DynamoDB errors during POST."""
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.put_item.side_effect = ClientError(
                {"Error": {"Code": "ServiceUnavailable"}}, "PutItem"
            )
            mock_client.return_value = (mock_ddb, "test-searches-table")

            result = handle_post_search(api_gateway_post_event, "test-123", "req-123")

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
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.query.return_value = {"Items": []}
            mock_client.return_value = (mock_ddb, "test-searches-table")

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
        with patch("lambda_src.searches_handler.index.get_ddb_client") as mock_client:
            mock_ddb = MagicMock()
            mock_ddb.query.return_value = {"Items": []}
            mock_client.return_value = (mock_ddb, "test-searches-table")

            result = handler(api_gateway_event, lambda_context)

            assert result["headers"]["Content-Type"] == "application/json"


class TestEnvironmentConfiguration:
    """Test environment configuration."""

    def test_get_ddb_client_uses_env_var(
        self,
        mock_env_vars: None,
    ) -> None:
        """Test that get_ddb_client uses SEARCHES_TABLE env var."""
        os.environ["SEARCHES_TABLE"] = "my-custom-table"

        with patch("boto3.client") as mock_boto:
            mock_boto.return_value = MagicMock()
            ddb, table_name = get_ddb_client()

            assert table_name == "my-custom-table"
