# ------------------------------------------------------
# Smart City Madrid Stack Module Variables
# ------------------------------------------------------

variable "prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "env_display_id" {
  description = "Random ID for environment display"
  type        = string
}

variable "cloud_region" {
  description = "AWS Cloud Region"
  type        = string
}

variable "cpu_architecture" {
  description = "CPU architecture for ECS tasks (ARM64 or X86_64)"
  type        = string
}

# VPC and Networking
variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for ECS tasks"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

# ECS Cluster
variable "ecs_cluster_id" {
  description = "ECS Cluster ID"
  type        = string
}

variable "ecs_task_execution_role_arn" {
  description = "ECS Task Execution Role ARN"
  type        = string
}

variable "ecs_container_role_arn" {
  description = "ECS Container Role ARN"
  type        = string
}

# Database
variable "db_address" {
  description = "PostgreSQL database address"
  type        = string
}

variable "db_username" {
  description = "PostgreSQL database username"
  type        = string
}

variable "db_password" {
  description = "PostgreSQL database password"
  type        = string
  sensitive   = true
}

# Confluent Kafka
variable "kafka_cluster_id" {
  description = "Confluent Kafka Cluster ID"
  type        = string
}

variable "kafka_bootstrap_endpoint" {
  description = "Confluent Kafka Bootstrap Endpoint"
  type        = string
}

variable "kafka_rest_endpoint" {
  description = "Confluent Kafka REST Endpoint"
  type        = string
}

variable "kafka_api_key" {
  description = "Kafka API Key"
  type        = string
}

variable "kafka_api_secret" {
  description = "Kafka API Secret"
  type        = string
  sensitive   = true
}

# Schema Registry
variable "schema_registry_id" {
  description = "Schema Registry Cluster ID"
  type        = string
}

variable "schema_registry_rest_endpoint" {
  description = "Schema Registry REST Endpoint"
  type        = string
}

variable "schema_registry_api_key" {
  description = "Schema Registry API Key"
  type        = string
}

variable "schema_registry_api_secret" {
  description = "Schema Registry API Secret"
  type        = string
  sensitive   = true
}

# Confluent Environment
variable "confluent_environment_id" {
  description = "Confluent Environment ID"
  type        = string
}

variable "confluent_service_account_id" {
  description = "Confluent Service Account ID"
  type        = string
}
