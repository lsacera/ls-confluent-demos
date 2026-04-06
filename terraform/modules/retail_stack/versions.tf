# ------------------------------------------------------
# Retail Stack Module - Terraform Version and Providers
# ------------------------------------------------------

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }

    confluent = {
      source  = "confluentinc/confluent"
      version = ">= 2.0"
    }

    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }

    local = {
      source  = "hashicorp/local"
      version = ">= 2.0"
    }
  }
}
