# CloudFront Distribution for Frontend CDN
# This provides global content delivery with HTTPS and custom domain support

# Origin Access Identity for secure S3 access
resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "OAI for MapMe Frontend S3 bucket"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "MapMe Frontend Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # Use only North America and Europe

  # S3 origin configuration
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600  # 1 hour
    max_ttl                = 86400 # 24 hours
    compress               = true

    # Lambda@Edge functions can be added here for security headers
  }

  # Custom error responses for SPA routing
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL/TLS certificate
  viewer_certificate {
    cloudfront_default_certificate = true
    # For custom domain, use:
    # acm_certificate_arn      = aws_acm_certificate.frontend.arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name        = "MapMe Frontend Distribution"
    Environment = "Production"
    Project     = "MapMe"
  }
}

# Optional: Uncomment to add custom domain support
# Requires ACM certificate in us-east-1 region
/*
resource "aws_acm_certificate" "frontend" {
  provider                  = aws.us_east_1  # CloudFront requires us-east-1
  domain_name              = var.frontend_domain
  subject_alternative_names = ["www.${var.frontend_domain}"]
  validation_method        = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "MapMe Frontend Certificate"
    Environment = "Production"
    Project     = "MapMe"
  }
}

# Add to cloudfront_distribution:
# aliases = [var.frontend_domain, "www.${var.frontend_domain}"]
*/

# Optional: Uncomment to add Route53 DNS
/*
resource "aws_route53_record" "frontend" {
  zone_id = var.route53_zone_id
  name    = var.frontend_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_www" {
  zone_id = var.route53_zone_id
  name    = "www.${var.frontend_domain}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
*/
