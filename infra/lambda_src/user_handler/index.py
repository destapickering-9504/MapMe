"""Lambda handler for user profile endpoint."""

import json
import os
import sys
from datetime import datetime
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
    validate_url,
)

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("USERS_TABLE_NAME", "")
table = dynamodb.Table(table_name)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET and PUT /user requests.

    GET: Returns authenticated user information from DynamoDB
    PUT: Updates user profile information

    Args:
        event: API Gateway event containing request context and user claims
        context: Lambda context object

    Returns:
        API Gateway response with user profile data
    """
    request_id = context.aws_request_id if context else "unknown"
    http_method = event.get("httpMethod", "")

    log_info(
        "Processing user request",
        request_id=request_id,
        http_method=http_method,
    )

    # Extract user claims from Cognito authorizer
    claims = extract_user_claims(event)
    user_id = claims.get("user_id", "")
    email = claims.get("email", "")

    if not user_id:
        log_error("Missing user ID in claims", request_id=request_id)
        return create_response(401, {"error": "Unauthorized"})

    if http_method == "GET":
        return handle_get_user(user_id, email, request_id)
    elif http_method == "PUT":
        return handle_put_user(user_id, email, event, request_id)
    else:
        log_warning(
            "Method not allowed",
            request_id=request_id,
            method=http_method,
        )
        return create_response(405, {"error": "Method not allowed"})


def validate_user_input(body: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate user profile input data.

    Args:
        body: Request body containing user data

    Returns:
        Tuple of (is_valid, list of error messages)
    """
    errors = []

    # Validate name if provided
    if "name" in body:
        is_valid, error = validate_string(
            body.get("name"),
            "name",
            max_length=100,
            required=False,
        )
        if not is_valid and error:
            errors.append(error)

    # Validate avatarUrl if provided
    if "avatarUrl" in body:
        is_valid, error = validate_url(
            body.get("avatarUrl"),
            "avatarUrl",
            required=False,
        )
        if not is_valid and error:
            errors.append(error)

    return len(errors) == 0, errors


def handle_get_user(user_id: str, email: str, request_id: str) -> Dict[str, Any]:
    """
    Handle GET request to retrieve user profile.

    Args:
        user_id: User's Cognito sub (UUID)
        email: User's email from Cognito claims
        request_id: Request ID for logging

    Returns:
        API Gateway response with user profile
    """
    try:
        log_info(
            "Fetching user profile",
            request_id=request_id,
            user_id=user_id,
        )

        # Try to get user from DynamoDB
        response = table.get_item(Key={"userId": user_id})

        if "Item" in response:
            user_data = response["Item"]
            # Calculate onboarding complete status
            name_provided = bool(user_data.get("name"))

            log_info(
                "User profile retrieved",
                request_id=request_id,
                user_id=user_id,
                has_name=name_provided,
            )

            return create_response(
                200,
                {
                    "userId": user_id,
                    "email": user_data.get("email", email),
                    "name": user_data.get("name", ""),
                    "avatarUrl": user_data.get("avatarUrl", ""),
                    "nameProvided": name_provided,
                    "avatarUploaded": bool(user_data.get("avatarUrl")),
                    "onboardingComplete": name_provided,
                    "createdAt": user_data.get("createdAt", ""),
                    "updatedAt": user_data.get("updatedAt", ""),
                },
            )
        else:
            # User doesn't exist in DB yet, return default profile
            log_info(
                "User not found in database, returning default profile",
                request_id=request_id,
                user_id=user_id,
            )

            return create_response(
                200,
                {
                    "userId": user_id,
                    "email": email,
                    "name": "",
                    "avatarUrl": "",
                    "nameProvided": False,
                    "avatarUploaded": False,
                    "onboardingComplete": False,
                    "createdAt": "",
                    "updatedAt": "",
                },
            )

    except ClientError as e:
        log_error(
            "DynamoDB error",
            request_id=request_id,
            user_id=user_id,
            error=str(e),
            error_code=e.response.get("Error", {}).get("Code", "Unknown"),
        )
        return create_response(500, {"error": "Failed to retrieve user profile"})


def handle_put_user(  # noqa: C901
    user_id: str,
    email: str,
    event: Dict[str, Any],
    request_id: str,
) -> Dict[str, Any]:
    """
    Handle PUT request to update user profile.

    Args:
        user_id: User's Cognito sub (UUID)
        email: User's email from Cognito claims
        event: API Gateway event containing request body
        request_id: Request ID for logging

    Returns:
        API Gateway response with updated user profile
    """
    try:
        # Parse request body
        try:
            body = json.loads(event.get("body", "{}"))
        except json.JSONDecodeError as e:
            log_error(
                "Invalid JSON in request body",
                request_id=request_id,
                error=str(e),
            )
            return create_response(400, {"error": "Invalid JSON in request body"})

        # Validate input
        is_valid, errors = validate_user_input(body)
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

        log_info(
            "Updating user profile",
            request_id=request_id,
            user_id=user_id,
            has_name="name" in body,
            has_avatar="avatarUrl" in body,
        )

        # Get current timestamp
        now = datetime.utcnow().isoformat() + "Z"

        # Check if user exists
        response = table.get_item(Key={"userId": user_id})
        is_new_user = "Item" not in response

        # Build update data
        update_data: Dict[str, Any] = {
            "userId": user_id,
            "email": email,
            "updatedAt": now,
        }

        # Set createdAt only for new users
        if is_new_user:
            update_data["createdAt"] = now
        else:
            # Preserve existing createdAt
            update_data["createdAt"] = response["Item"].get("createdAt", now)

        # Update name if provided
        if "name" in body:
            update_data["name"] = body["name"]
        elif not is_new_user and "name" in response["Item"]:
            # Preserve existing name if not updating
            update_data["name"] = response["Item"]["name"]
        else:
            update_data["name"] = ""

        # Update avatarUrl if provided
        if "avatarUrl" in body:
            update_data["avatarUrl"] = body["avatarUrl"]
        elif not is_new_user and "avatarUrl" in response["Item"]:
            # Preserve existing avatarUrl if not updating
            update_data["avatarUrl"] = response["Item"]["avatarUrl"]
        else:
            update_data["avatarUrl"] = ""

        # Save to DynamoDB
        table.put_item(Item=update_data)

        # Calculate onboarding status
        name_provided = bool(update_data.get("name"))
        avatar_uploaded = bool(update_data.get("avatarUrl"))

        log_info(
            "User profile updated successfully",
            request_id=request_id,
            user_id=user_id,
            is_new_user=is_new_user,
        )

        # Return updated profile
        return create_response(
            200,
            {
                "userId": user_id,
                "email": update_data["email"],
                "name": update_data.get("name", ""),
                "avatarUrl": update_data.get("avatarUrl", ""),
                "nameProvided": name_provided,
                "avatarUploaded": avatar_uploaded,
                "onboardingComplete": name_provided,
                "createdAt": update_data["createdAt"],
                "updatedAt": update_data["updatedAt"],
            },
        )

    except ClientError as e:
        log_error(
            "DynamoDB error",
            request_id=request_id,
            user_id=user_id,
            error=str(e),
            error_code=e.response.get("Error", {}).get("Code", "Unknown"),
        )
        return create_response(500, {"error": "Failed to update user profile"})
