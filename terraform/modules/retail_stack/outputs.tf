# ------------------------------------------------------
# Retail Stack Module Outputs
# ------------------------------------------------------

output "payments_app_user_arn" {
  description = "ARN of the IAM user for payments app (used by KMS)"
  value       = aws_iam_user.payments_app_user.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key for CSFLE"
  value       = aws_kms_key.kms_key.arn
}

output "payment_app_ecr_repository_url" {
  description = "ECR repository URL for payment app"
  value       = aws_ecr_repository.payment_app_repo.repository_url
}

output "dbfeeder_app_ecr_repository_url" {
  description = "ECR repository URL for dbfeeder app"
  value       = aws_ecr_repository.dbfeeder_app_repo.repository_url
}

output "payment_app_service_name" {
  description = "ECS service name for payment app"
  value       = aws_ecs_service.payment_app_service.name
}

output "dbfeeder_app_service_name" {
  description = "ECS service name for dbfeeder app"
  value       = aws_ecs_service.dbfeeder_app_service.name
}

output "payments_topic_name" {
  description = "Kafka topic name for payments"
  value       = confluent_kafka_topic.payments-topic.topic_name
}

output "error_payments_topic_name" {
  description = "Kafka topic name for error payments"
  value       = confluent_kafka_topic.error-payments-topic.topic_name
}
