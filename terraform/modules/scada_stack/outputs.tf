# ------------------------------------------------------
# SCADA Stack Module Outputs
# ------------------------------------------------------

output "scada_enabled" {
  description = "Indicates that SCADA stack module is loaded"
  value       = true
}

# Kafka Topics
output "scada_telemetry_topic_name" {
  value       = confluent_kafka_topic.scada-telemetry-topic.topic_name
  description = "Kafka topic name for SCADA telemetry"
}

output "scada_alerts_topic_name" {
  value       = confluent_kafka_topic.scada-alerts-topic.topic_name
  description = "Kafka topic name for SCADA alerts"
}

output "error_scada_telemetry_topic_name" {
  value       = confluent_kafka_topic.error-scada-telemetry-topic.topic_name
  description = "Dead letter queue topic for SCADA telemetry errors"
}

# Schemas
output "scada_telemetry_schema_id" {
  value       = confluent_schema.avro-scada-telemetry.schema_identifier
  description = "Schema Registry ID for SCADA telemetry schema"
}

output "scada_alerts_schema_id" {
  value       = confluent_schema.avro-scada-alerts.schema_identifier
  description = "Schema Registry ID for SCADA alerts schema"
}

# SCADA Simulator Infrastructure
output "scada_simulator_ecr_repository_url" {
  value       = aws_ecr_repository.scada_simulator_repo.repository_url
  description = "ECR repository URL for SCADA simulator"
}

output "scada_simulator_service_name" {
  value       = aws_ecs_service.scada_simulator_service.name
  description = "ECS service name for SCADA simulator"
}

output "scada_simulator_task_arn" {
  value       = aws_ecs_task_definition.scada_simulator_task.arn
  description = "ECS task definition ARN for SCADA simulator"
}

output "images_build_trigger" {
  description = "Null resource that builds Docker images - used as dependency"
  value       = null_resource.build_and_push_scada_images.id
}
