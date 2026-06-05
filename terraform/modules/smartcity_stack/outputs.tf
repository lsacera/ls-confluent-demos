# ------------------------------------------------------
# Smart City Madrid Stack Module Outputs
# ------------------------------------------------------

output "smartcity_enabled" {
  description = "Indicates that Smart City Madrid stack module is loaded"
  value       = true
}

# Kafka Topics
output "smartcity_traffic_topic_name" {
  value       = confluent_kafka_topic.smartcity-traffic-topic.topic_name
  description = "Kafka topic name for Smart City traffic sensors"
}

output "smartcity_airquality_topic_name" {
  value       = confluent_kafka_topic.smartcity-airquality-topic.topic_name
  description = "Kafka topic name for Smart City air quality stations"
}

output "smartcity_emtbus_topic_name" {
  value       = confluent_kafka_topic.smartcity-emtbus-topic.topic_name
  description = "Kafka topic name for Smart City EMT buses"
}

output "smartcity_service_topic_name" {
  value       = confluent_kafka_topic.smartcity-service-topic.topic_name
  description = "Kafka topic name for Smart City citizen services"
}

output "smartcity_alert_topic_name" {
  value       = confluent_kafka_topic.smartcity-alert-topic.topic_name
  description = "Kafka topic name for Smart City alerts"
}

# Schemas
output "smartcity_traffic_schema_id" {
  value       = confluent_schema.avro-smartcity-traffic.schema_identifier
  description = "Schema Registry ID for Smart City traffic schema"
}

output "smartcity_airquality_schema_id" {
  value       = confluent_schema.avro-smartcity-airquality.schema_identifier
  description = "Schema Registry ID for Smart City air quality schema"
}

output "smartcity_emtbus_schema_id" {
  value       = confluent_schema.avro-smartcity-emtbus.schema_identifier
  description = "Schema Registry ID for Smart City EMT bus schema"
}

output "smartcity_service_schema_id" {
  value       = confluent_schema.avro-smartcity-service.schema_identifier
  description = "Schema Registry ID for Smart City citizen service schema"
}

output "smartcity_alert_schema_id" {
  value       = confluent_schema.avro-smartcity-alert.schema_identifier
  description = "Schema Registry ID for Smart City alert schema"
}

# Smart City Simulator Infrastructure
output "smartcity_simulator_ecr_repository_url" {
  value       = aws_ecr_repository.smartcity_simulator_repo.repository_url
  description = "ECR repository URL for Smart City simulator"
}

output "smartcity_simulator_service_name" {
  value       = aws_ecs_service.smartcity_simulator_service.name
  description = "ECS service name for Smart City simulator"
}

output "smartcity_simulator_task_arn" {
  value       = aws_ecs_task_definition.smartcity_simulator_task.arn
  description = "ECS task definition ARN for Smart City simulator"
}

# Smart City Dashboard Infrastructure
output "smartcity_dashboard_ecr_repository_url" {
  value       = aws_ecr_repository.smartcity_dashboard_repo.repository_url
  description = "ECR repository URL for Smart City dashboard"
}

output "smartcity_dashboard_service_name" {
  value       = aws_ecs_service.smartcity_dashboard_service.name
  description = "ECS service name for Smart City dashboard"
}

output "smartcity_dashboard_task_arn" {
  value       = aws_ecs_task_definition.smartcity_dashboard_task.arn
  description = "ECS task definition ARN for Smart City dashboard"
}

output "images_build_trigger" {
  description = "Null resource that builds Docker images - used as dependency"
  value       = null_resource.build_and_push_smartcity_images.id
}

output "smartcity_dashboard_log_group" {
  value       = aws_cloudwatch_log_group.smartcity-dashboard-log-group.name
  description = "CloudWatch log group for Smart City dashboard"
}
