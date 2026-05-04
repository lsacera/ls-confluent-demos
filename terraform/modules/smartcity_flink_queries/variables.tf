variable "organization_id" {
  description = "Confluent Cloud Organization ID"
  type        = string
}

variable "environment_id" {
  description = "Confluent Cloud Environment ID"
  type        = string
}

variable "compute_pool_id" {
  description = "Flink Compute Pool ID"
  type        = string
}

variable "kafka_cluster_id" {
  description = "Kafka Cluster ID"
  type        = string
}

variable "service_account_id" {
  description = "Service Account ID for Flink"
  type        = string
}

variable "flink_api_key" {
  description = "Flink API Key"
  type        = string
  sensitive   = true
}

variable "flink_api_secret" {
  description = "Flink API Secret"
  type        = string
  sensitive   = true
}

variable "flink_rest_endpoint" {
  description = "Flink REST Endpoint"
  type        = string
}

variable "queries_dir" {
  description = "Directory containing Flink SQL query files (relative to terraform root)"
  type        = string
  default     = "../queries/smartcity"
}

variable "stop_statements" {
  description = "Stop all Flink statements (useful before destroying resources)"
  type        = bool
  default     = false
}
