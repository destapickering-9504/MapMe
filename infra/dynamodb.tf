resource "aws_dynamodb_table" "users" {
  name         = "${local.project}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "searches" {
  name         = "${local.project}-searches"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "createdAt"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "RecentSearches"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }
}
