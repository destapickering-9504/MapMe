"""Lambda handler for Cognito post-confirmation trigger."""

import os
import sys
from datetime import datetime
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

# Add parent directory to path for common imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from common.utils import log_error, log_info  # noqa: E402


def get_dynamodb_table() -> Any:
    """Get DynamoDB table resource."""
    dynamodb = boto3.resource("dynamodb")
    table_name = os.environ.get("USERS_TABLE_NAME", "")
    return dynamodb.Table(table_name)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle Cognito post-confirmation trigger.

    This function is automatically invoked after a user confirms their email.
    It creates a default user record in DynamoDB with the user's Cognito details.

    Args:
        event: Cognito post-confirmation trigger event
        context: Lambda context object

    Returns:
        The event unchanged (required by Cognito triggers)
    """
    request_id = context.aws_request_id if context else "unknown"

    log_info(
        "Processing post-confirmation trigger",
        request_id=request_id,
        trigger_source=event.get("triggerSource", ""),
    )

    try:
        # Extract user attributes from Cognito event
        user_attributes = event.get("request", {}).get("userAttributes", {})
        user_id = user_attributes.get("sub", "")
        email = user_attributes.get("email", "")

        if not user_id:
            log_error(
                "Missing user ID in Cognito event",
                request_id=request_id,
            )
            # Still return event to not block user confirmation
            return event

        if not email:
            log_error(
                "Missing email in Cognito event",
                request_id=request_id,
                user_id=user_id,
            )
            # Still return event to not block user confirmation
            return event

        log_info(
            "Creating default user record",
            request_id=request_id,
            user_id=user_id,
        )

        # Get DynamoDB table
        table = get_dynamodb_table()

        # Create timestamp
        now = datetime.utcnow().isoformat() + "Z"

        # Create default user record
        user_data = {
            "userId": user_id,
            "email": email,
            "name": "",
            "avatarUrl": "",
            "createdAt": now,
            "updatedAt": now,
        }

        # Save to DynamoDB
        table.put_item(Item=user_data)

        log_info(
            "User record created successfully",
            request_id=request_id,
            user_id=user_id,
        )

    except ClientError as e:
        log_error(
            "DynamoDB error during post-confirmation",
            request_id=request_id,
            error=str(e),
            error_code=e.response.get("Error", {}).get("Code", "Unknown"),
        )
        # Don't raise exception - we don't want to block user confirmation
        # The user can still be created via PUT /user endpoint later

    except Exception as e:
        log_error(
            "Unexpected error during post-confirmation",
            request_id=request_id,
            error=str(e),
        )
        # Don't raise exception - we don't want to block user confirmation

    # IMPORTANT: Must return the event unchanged for Cognito triggers
    return event
