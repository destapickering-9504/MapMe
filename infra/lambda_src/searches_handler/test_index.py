"""Unit tests for searches_handler Lambda function."""

import json
from typing import Any, Dict
from unittest.mock import MagicMock, patch

import pytest

from index import handler, _handle_get_searches, _handle_post_search


class TestSearchesHandler:
    """Test suite for searches handler."""

    @patch("index.ddb")
    def test_handler_get_request(
        self,
        mock_ddb: MagicMock,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test GET request returns search history."""
        mock_ddb.query.return_value = {
            "Items": [
                {
                    "userId": {"S": "test-user-123"},
                    "createdAt": {"S": "1234567890"},
                    "query": {"S": "test query"},
                }
            ]
        }

        result = handler(api_gateway_event, lambda_context)

        assert result["statusCode"] == 200
        assert "Content-Type" in result["headers"]

        body = json.loads(result["body"])
        assert len(body) == 1
        assert body[0]["query"] == "test query"

    @patch("index.ddb")
    def test_handler_post_request(
        self,
        mock_ddb: MagicMock,
        api_gateway_post_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test POST request creates new search entry."""
        mock_ddb.put_item.return_value = {}

        result = handler(api_gateway_post_event, lambda_context)

        assert result["statusCode"] == 201
        body = json.loads(result["body"])
        assert body["ok"] is True

        # Verify put_item was called
        mock_ddb.put_item.assert_called_once()

    def test_handler_unsupported_method(
        self, api_gateway_event: Dict[str, Any], lambda_context: MagicMock
    ) -> None:
        """Test unsupported HTTP method returns 405."""
        api_gateway_event["httpMethod"] = "DELETE"

        result = handler(api_gateway_event, lambda_context)

        assert result["statusCode"] == 405
        body = json.loads(result["body"])
        assert "error" in body

    @patch("index.ddb")
    def test_get_searches_empty_result(self, mock_ddb: MagicMock, mock_env_vars: None) -> None:
        """Test GET request with no search history."""
        mock_ddb.query.return_value = {"Items": []}

        result = _handle_get_searches("test-user-123")

        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert len(body) == 0

    @patch("index.ddb")
    def test_get_searches_calls_dynamodb_correctly(
        self, mock_ddb: MagicMock, mock_env_vars: None
    ) -> None:
        """Test that DynamoDB query is called with correct parameters."""
        mock_ddb.query.return_value = {"Items": []}

        _handle_get_searches("user-123")

        mock_ddb.query.assert_called_once()
        call_args = mock_ddb.query.call_args[1]
        assert call_args["Limit"] == 20
        assert call_args["ScanIndexForward"] is False

    @patch("index.ddb")
    @patch("index.time.time")
    def test_post_search_creates_item(
        self, mock_time: MagicMock, mock_ddb: MagicMock, mock_env_vars: None
    ) -> None:
        """Test POST creates search item with correct fields."""
        mock_time.return_value = 1234567890
        mock_ddb.put_item.return_value = {}

        event = {
            "httpMethod": "POST",
            "body": json.dumps({"query": "test search"}),
            "requestContext": {"authorizer": {"claims": {"sub": "user-123"}}},
        }

        result = _handle_post_search(event, "user-123")

        assert result["statusCode"] == 201
        mock_ddb.put_item.assert_called_once()
        call_args = mock_ddb.put_item.call_args[1]
        assert call_args["Item"]["query"]["S"] == "test search"
        assert call_args["Item"]["userId"]["S"] == "user-123"

    @patch("index.ddb")
    def test_post_search_with_empty_body(self, mock_ddb: MagicMock, mock_env_vars: None) -> None:
        """Test POST with empty body still creates entry."""
        mock_ddb.put_item.return_value = {}

        event = {
            "httpMethod": "POST",
            "body": None,
            "requestContext": {"authorizer": {"claims": {"sub": "user-123"}}},
        }

        result = _handle_post_search(event, "user-123")

        assert result["statusCode"] == 201
        mock_ddb.put_item.assert_called_once()

    @patch("index.ddb")
    def test_handler_includes_cors_headers(
        self,
        mock_ddb: MagicMock,
        api_gateway_event: Dict[str, Any],
        lambda_context: MagicMock,
        mock_env_vars: None,
    ) -> None:
        """Test that CORS headers are included in response."""
        mock_ddb.query.return_value = {"Items": []}

        result = handler(api_gateway_event, lambda_context)

        assert "Access-Control-Allow-Origin" in result["headers"]
        assert result["headers"]["Access-Control-Allow-Origin"] == "*"
