"""Lambda handler for searches endpoint."""

import json
import os
import sys
import time
from typing import Any, Dict, List, Tuple

import boto3
from botocore.exceptions import ClientError

# Add parent directory to path for common imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from common.utils import (  # noqa: E402
    create_response,
    extract_user_claims,
    log_error,
    log_info,
    log_warning,
    validate_string,
)


def get_ddb_client() -> Tuple[Any, str]:
    """Get DynamoDB client and table name."""
    ddb = boto3.client("dynamodb")
    table = os.environ.get("SEARCHES_TABLE", "")
    return ddb, table


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET and POST requests for /searches endpoint.

    GET: Returns user's search history (up to 20 most recent searches)
    POST: Creates a new search entry

    Args:
        event: API Gateway event containing HTTP method and user claims
        context: Lambda context object

    Returns:
        API Gateway response with search data or success confirmation
    """
    request_id = context.aws_request_id if context else "unknown"
    method = event.get("httpMethod", "")

    log_info(
        "Processing searches request",
        request_id=request_id,
        http_method=method,
    )

    # Extract user ID from Cognito claims
    claims = extract_user_claims(event)
    user_id = claims.get("user_id", "")

    if not user_id:
        log_error("Missing user ID in claims", request_id=request_id)
        return create_response(401, {"error": "Unauthorized"})

    if method == "GET":
        return handle_get_searches(user_id, request_id)
    elif method == "POST":
        return handle_post_search(event, user_id, request_id)
    else:
        log_warning(
            "Method not allowed",
            request_id=request_id,
            method=method,
        )
        return create_response(405, {"error": "Method Not Allowed"})


def validate_search_input(body: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate search input data.

    Args:
        body: Request body containing search data

    Returns:
        Tuple of (is_valid, list of error messages)
    """
    errors = []

    # Validate query field
    is_valid, error = validate_string(
        body.get("query"),
        "query",
        max_length=500,
        required=True,
    )
    if not is_valid and error:
        errors.append(error)

    return len(errors) == 0, errors


def handle_get_searches(user_id: str, request_id: str) -> Dict[str, Any]:
    """
    Retrieve user's search history from DynamoDB.

    Args:
        user_id: The authenticated user's ID
        request_id: Request ID for logging

    Returns:
        API Gateway response with list of searches
    """
    try:
        log_info(
            "Fetching search history",
            request_id=request_id,
            user_id=user_id,
        )

        ddb, table = get_ddb_client()
        response = ddb.query(
            TableName=table,
            KeyConditions={
                "userId": {
                    "AttributeValueList": [{"S": user_id}],
                    "ComparisonOperator": "EQ",
                }
            },
            Limit=20,
            ScanIndexForward=False,  # Return most recent first
        )

        # Transform DynamoDB format to simpler dict
        items: List[Dict[str, str]] = [
            {key: list(value.values())[0] for key, value in item.items()}
            for item in response.get("Items", [])
        ]

        log_info(
            "Search history retrieved",
            request_id=request_id,
            user_id=user_id,
            count=len(items),
        )

        return create_response(200, items)

    except ClientError as e:
        log_error(
            "DynamoDB error",
            request_id=request_id,
            user_id=user_id,
            error=str(e),
            error_code=e.response.get("Error", {}).get("Code", "Unknown"),
        )
        return create_response(500, {"error": "Failed to retrieve search history"})


def handle_post_search(
    event: Dict[str, Any],
    user_id: str,
    request_id: str,
) -> Dict[str, Any]:
    """
    Create a new search entry in DynamoDB.

    Args:
        event: API Gateway event containing request body
        user_id: The authenticated user's ID
        request_id: Request ID for logging

    Returns:
        API Gateway response confirming creation
    """
    try:
        # Parse request body
        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError as e:
            log_error(
                "Invalid JSON in request body",
                request_id=request_id,
                error=str(e),
            )
            return create_response(400, {"error": "Invalid JSON in request body"})

        # Validate input
        is_valid, errors = validate_search_input(body)
        if not is_valid:
            log_error(
                "Validation failed",
                request_id=request_id,
                errors=errors,
            )
            return create_response(
                400,
                {
                    "error": "Validation failed",
                    "details": errors,
                },
            )

        query = body.get("query", "")

        log_info(
            "Creating search entry",
            request_id=request_id,
            user_id=user_id,
            query_length=len(query),
        )

        # Create timestamp
        timestamp = str(int(time.time()))

        # Build DynamoDB item
        item: Dict[str, Dict[str, str]] = {
            "userId": {"S": user_id},
            "createdAt": {"S": timestamp},
            "query": {"S": query},
        }

        ddb, table = get_ddb_client()
        ddb.put_item(TableName=table, Item=item)

        log_info(
            "Search entry created successfully",
            request_id=request_id,
            user_id=user_id,
            timestamp=timestamp,
        )

        return create_response(201, {"ok": True, "timestamp": timestamp})

    except ClientError as e:
        log_error(
            "DynamoDB error",
            request_id=request_id,
            user_id=user_id,
            error=str(e),
            error_code=e.response.get("Error", {}).get("Code", "Unknown"),
        )
        return create_response(500, {"error": "Failed to create search entry"})
