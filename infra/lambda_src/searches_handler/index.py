"""Lambda handler for searches endpoint."""

import json
import os
import time
from typing import Any, Dict, List

import boto3

# Initialize DynamoDB client
ddb = boto3.client("dynamodb")
TABLE = os.environ["SEARCHES_TABLE"]


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
    method: str = event.get("httpMethod", "")
    
    # Extract user ID from Cognito claims
    claims: Dict[str, Any] = (
        event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
    )
    user_id: str = claims.get("sub", "")

    if method == "GET":
        return _handle_get_searches(user_id)
    elif method == "POST":
        return _handle_post_search(event, user_id)
    else:
        return {
            "statusCode": 405,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Method Not Allowed"}),
        }


def _handle_get_searches(user_id: str) -> Dict[str, Any]:
    """
    Retrieve user's search history from DynamoDB.
    
    Args:
        user_id: The authenticated user's ID
        
    Returns:
        API Gateway response with list of searches
    """
    response = ddb.query(
        TableName=TABLE,
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

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(items),
    }


def _handle_post_search(event: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Create a new search entry in DynamoDB.
    
    Args:
        event: API Gateway event containing request body
        user_id: The authenticated user's ID
        
    Returns:
        API Gateway response confirming creation
    """
    body: Dict[str, Any] = json.loads(event.get("body") or "{}")
    query: str = body.get("query", "")
    
    # Create timestamp
    timestamp: str = str(int(time.time()))

    # Build DynamoDB item
    item: Dict[str, Dict[str, str]] = {
        "userId": {"S": user_id},
        "createdAt": {"S": timestamp},
        "query": {"S": query},
    }

    ddb.put_item(TableName=TABLE, Item=item)

    return {
        "statusCode": 201,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({"ok": True}),
    }
