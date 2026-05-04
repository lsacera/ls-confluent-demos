# Retail Stack Module

This Terraform module deploys all resources specific to the retail demo, including:

## Resources Created

### Applications
- **DB Feeder App**: Java application that populates PostgreSQL with sample retail data (orders, products, customers)
- **Payments App**: Java application that generates payment events to Kafka

### AWS Resources
- ECR repositories for both applications
- ECS task definitions and services (Fargate)
- CloudWatch log groups
- IAM users and policies for KMS encryption

### Confluent Resources
- Kafka topics: `payments`, `error-payments`
- Avro schemas for payment events
- Schema Registry integration

### Configuration Files
- DB connection properties for DB Feeder
- Kafka/Schema Registry properties for Payments App
- Data Quality Rules configuration

## Usage

```hcl
module "retail_stack" {
  source = "./modules/retail_stack"

  prefix       = var.prefix
  env_display_id = random_id.env_display_id.hex
  cloud_region = var.cloud_region
  cpu_architecture = local.cpu_architecture

  # VPC and Networking
  vpc_id            = aws_vpc.ecs_vpc.id
  subnet_id         = aws_subnet.public_subnet.id
  security_group_id = aws_security_group.ecs_sg.id

  # ECS
  ecs_cluster_id              = aws_ecs_cluster.ecs_cluster.id
  ecs_task_execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  ecs_container_role_arn      = aws_iam_role.ecs_container_role.arn

  # Database
  db_address  = aws_db_instance.postgres_db.address
  db_username = var.db_username
  db_password = var.db_password

  # Confluent
  kafka_cluster_id              = confluent_kafka_cluster.standard.id
  kafka_bootstrap_endpoint      = confluent_kafka_cluster.standard.bootstrap_endpoint
  kafka_rest_endpoint           = confluent_kafka_cluster.standard.rest_endpoint
  kafka_api_key                 = confluent_api_key.app-manager-kafka-api-key.id
  kafka_api_secret              = confluent_api_key.app-manager-kafka-api-key.secret
  
  schema_registry_id            = data.confluent_schema_registry_cluster.sr-cluster.id
  schema_registry_rest_endpoint = data.confluent_schema_registry_cluster.sr-cluster.rest_endpoint
  schema_registry_api_key       = confluent_api_key.app-manager-schema-registry-api-key.id
  schema_registry_api_secret    = confluent_api_key.app-manager-schema-registry-api-key.secret

  confluent_environment_id      = confluent_environment.staging.id
  confluent_service_account_id  = confluent_service_account.app-manager.id

  # Dependencies
  psql_init_container_id = docker_container.psql_init.id
}
```

## Outputs

- `payment_app_ecr_repository_url`: ECR repository URL for payment app
- `dbfeeder_app_ecr_repository_url`: ECR repository URL for dbfeeder app
- `payment_app_service_name`: ECS service name for payment app
- `dbfeeder_app_service_name`: ECS service name for dbfeeder app
- `payments_topic_name`: Kafka topic name for payments
- `error_payments_topic_name`: Kafka topic name for error payments
