locals {
  project     = "mapme"
  environment = var.environment
  suffix      = random_string.suffix.result

  # Environment-aware resource naming
  name_prefix         = "${local.project}-${local.environment}"
  avatars_bucket_name = "${local.name_prefix}-avatars-${local.suffix}"

  routes = {
    user     = "user"
    searches = "searches"
  }

  # Common tags for all resources
  common_tags = {
    Project     = "MapMe"
    Environment = local.environment
    ManagedBy   = "Terraform"
  }
}
