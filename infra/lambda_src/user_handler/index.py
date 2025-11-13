"""Lambda handler for user profile endpoint."""

import json
import os
from datetime import datetime
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError

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
    http_method = event.get("httpMethod", "")
    
    # Extract user claims from Cognito authorizer
    claims: Dict[str, Any] = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
    user_id: str = claims.get("sub", "")
    email: str = claims.get("email", "")
    
    if not user_id:
        return {
            "statusCode": 401,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Unauthorized"}),
        }
    
    if http_method == "GET":
        return handle_get_user(user_id, email)
    elif http_method == "PUT":
        return handle_put_user(user_id, email, event)
    else:
        return {
            "statusCode": 405,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Method not allowed"}),
        }


def handle_get_user(user_id: str, email: str) -> Dict[str, Any]:
    """
    Handle GET request to retrieve user profile.
    
    Args:
        user_id: User's Cognito sub (UUID)
        email: User's email from Cognito claims
        
    Returns:
        API Gateway response with user profile
    """
    try:
        # Try to get user from DynamoDB
        response = table.get_item(Key={"userId": user_id})
        
        if "Item" in response:
            user_data = response["Item"]
            # Calculate onboarding complete status
            name_provided = bool(user_data.get("name"))
            
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "userId": user_id,
                    "email": user_data.get("email", email),
                    "name": user_data.get("name", ""),
                    "avatarUrl": user_data.get("avatarUrl", ""),
                    "nameProvided": name_provided,
                    "avatarUploaded": bool(user_data.get("avatarUrl")),
                    "onboardingComplete": name_provided,
                    "createdAt": user_data.get("createdAt", ""),
                    "updatedAt": user_data.get("updatedAt", ""),
                }),
            }
        else:
            # User doesn't exist in DB yet, return default profile
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "userId": user_id,
                    "email": email,
                    "name": "",
                    "avatarUrl": "",
                    "nameProvided": False,
                    "avatarUploaded": False,
                    "onboardingComplete": False,
                    "createdAt": "",
                    "updatedAt": "",
                }),
            }
            
    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Failed to retrieve user profile"}),
        }


def handle_put_user(user_id: str, email: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle PUT request to update user profile.
    
    Args:
        user_id: User's Cognito sub (UUID)
        email: User's email from Cognito claims
        event: API Gateway event containing request body
        
    Returns:
        API Gateway response with updated user profile
    """
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
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
        
        # Return updated profile
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "userId": user_id,
                "email": update_data["email"],
                "name": update_data.get("name", ""),
                "avatarUrl": update_data.get("avatarUrl", ""),
                "nameProvided": name_provided,
                "avatarUploaded": avatar_uploaded,
                "onboardingComplete": name_provided,
                "createdAt": update_data["createdAt"],
                "updatedAt": update_data["updatedAt"],
            }),
        }
        
    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Invalid JSON in request body"}),
        }
    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Failed to update user profile"}),
        }
