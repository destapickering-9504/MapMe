# Terraform Backend Configuration for Remote State
terraform {
  backend "s3" {
    bucket         = "mapme-dev-terraform-state-djohvo"
    key            = "mapme/terraform.tfstate"
    region         = "us-west-1"
    dynamodb_table = "mapme-dev-terraform-locks-djohvo"
    encrypt        = true
  }
}

# # This creates the S3 bucket and DynamoDB table needed for remote state
# resource "aws_s3_bucket" "terraform_state" {
#   bucket = "${local.name_prefix}-terraform-state-${random_string.suffix.result}"

#   tags = {
#     Name        = "Terraform State Bucket"
#     Environment = "Infrastructure"
#     Project     = "MapMe"
#   }

#   lifecycle {
#     prevent_destroy = true
#   }
# }

# resource "aws_s3_bucket_versioning" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id

#   versioning_configuration {
#     status = "Enabled"
#   }
# }

# resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id

#   rule {
#     apply_server_side_encryption_by_default {
#       sse_algorithm = "AES256"
#     }
#   }
# }

# resource "aws_s3_bucket_public_access_block" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id

#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }

# resource "aws_dynamodb_table" "terraform_locks" {
#   name         = "${local.name_prefix}-terraform-locks-${random_string.suffix.result}"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "LockID"

#   attribute {
#     name = "LockID"
#     type = "S"
#   }

#   tags = {
#     Name        = "Terraform State Lock Table"
#     Environment = "Infrastructure"
#     Project     = "MapMe"
#   }

#   lifecycle {
#     prevent_destroy = true
#   }
# }

# output "terraform_state_bucket" {
#   description = "S3 bucket for Terraform state"
#   value       = aws_s3_bucket.terraform_state.id
# }

# output "terraform_lock_table" {
#   description = "DynamoDB table for Terraform state locking"
#   value       = aws_dynamodb_table.terraform_locks.id
# }
