locals {
  project              = "mapme"
  suffix               = random_string.suffix.result
  avatars_bucket_name  = "${local.project}-avatars-${local.suffix}"
  environment          = "dev"
  routes = {
    user     = "user"
    searches = "searches"
  }
}