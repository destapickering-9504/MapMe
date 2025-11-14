"""Common utilities for Lambda functions."""

import json
import logging
import sys
from typing import Any, Dict, Optional, Tuple

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Ensure we have a handler
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)


def log_info(message: str, **kwargs: Any) -> None:
    """Log info message with structured data."""
    log_data = {"level": "INFO", "message": message, **kwargs}
    logger.info(json.dumps(log_data))


def log_error(message: str, **kwargs: Any) -> None:
    """Log error message with structured data."""
    log_data = {"level": "ERROR", "message": message, **kwargs}
    logger.error(json.dumps(log_data))


def log_warning(message: str, **kwargs: Any) -> None:
    """Log warning message with structured data."""
    log_data = {"level": "WARNING", "message": message, **kwargs}
    logger.warning(json.dumps(log_data))


def validate_string(
    value: Any, field_name: str, max_length: Optional[int] = None, required: bool = True
) -> Tuple[bool, Optional[str]]:
    """
    Validate a string field.

    Args:
        value: The value to validate
        field_name: Name of the field for error messages
        max_length: Maximum allowed length
        required: Whether the field is required

    Returns:
        Tuple of (is_valid, error_message)
    """
    if value is None or value == "":
        if required:
            return False, f"{field_name} is required"
        return True, None

    if not isinstance(value, str):
        return False, f"{field_name} must be a string"

    if max_length and len(value) > max_length:
        return False, f"{field_name} must not exceed {max_length} characters"

    return True, None


def validate_url(value: Any, field_name: str, required: bool = False) -> Tuple[bool, Optional[str]]:
    """
    Validate a URL field.

    Args:
        value: The value to validate
        field_name: Name of the field for error messages
        required: Whether the field is required

    Returns:
        Tuple of (is_valid, error_message)
    """
    if value is None or value == "":
        if required:
            return False, f"{field_name} is required"
        return True, None

    if not isinstance(value, str):
        return False, f"{field_name} must be a string"

    # Basic URL validation
    if not (value.startswith("http://") or value.startswith("https://")):
        return False, f"{field_name} must be a valid URL starting with http:// or https://"

    if len(value) > 2048:
        return False, f"{field_name} URL is too long"

    return True, None


def create_response(
    status_code: int, body: Any, additional_headers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Create a standardized API Gateway response.

    Args:
        status_code: HTTP status code
        body: Response body as dictionary
        additional_headers: Optional additional headers

    Returns:
        API Gateway response dictionary
    """
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }

    if additional_headers:
        headers.update(additional_headers)

    return {
        "statusCode": status_code,
        "headers": headers,
        "body": json.dumps(body),
    }


def extract_user_claims(event: Dict[str, Any]) -> Dict[str, str]:
    """
    Extract user claims from API Gateway event.

    Args:
        event: API Gateway event

    Returns:
        Dictionary containing user claims (sub, email, etc.)
    """
    claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
    return {
        "user_id": claims.get("sub", ""),
        "email": claims.get("email", ""),
        "username": claims.get("cognito:username", ""),
    }
