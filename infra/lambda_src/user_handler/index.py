"""Lambda handler for user profile endpoint."""

import json
from typing import Any, Dict


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET /user requests.

    Returns authenticated user information from Cognito JWT claims.

    Args:
        event: API Gateway event containing request context and user claims
        context: Lambda context object

    Returns:
        API Gateway response with user profile data
    """
    # Extract user claims from Cognito authorizer
    claims: Dict[str, Any] = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})

    user_id: str = claims.get("sub", "")
    email: str = claims.get("email", "")
    name: str = claims.get("name", "")

    # Build response payload
    response_data: Dict[str, Any] = {
        "userId": user_id,
        "email": email,
        "name": name,
        "onboardingComplete": False,
    }

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(response_data),
    }
