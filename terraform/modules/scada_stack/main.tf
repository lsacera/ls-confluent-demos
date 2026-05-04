# ------------------------------------------------------
# SCADA Stack Module - Main Resources
# ------------------------------------------------------

# This module deploys resources for the SCADA energy grid demo
# including topics, schemas, and infrastructure for monitoring
# electrical grid and gas network telemetry across USA.

data "aws_caller_identity" "current" {}

# ------------------------------------------------------
# Kafka Topics for SCADA
# ------------------------------------------------------

resource "confluent_kafka_topic" "scada-telemetry-topic" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }
  topic_name    = "scada-telemetry"
  partitions_count = 6
  rest_endpoint = var.kafka_rest_endpoint

  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
  }

  config = {
    "retention.ms" = "604800000"  # 7 days retention for telemetry data
    # compression.type removed - it's read-only and cannot be updated after topic creation
  }
}

resource "confluent_kafka_topic" "scada-alerts-topic" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }
  topic_name    = "scada-alerts"
  partitions_count = 3
  rest_endpoint = var.kafka_rest_endpoint

  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
  }

  config = {
    "retention.ms" = "2592000000"  # 30 days retention for alerts
  }
}

resource "confluent_kafka_topic" "error-scada-telemetry-topic" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }
  topic_name    = "error-scada-telemetry"
  partitions_count = 1
  rest_endpoint = var.kafka_rest_endpoint

  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
  }

  config = {
    "retention.ms" = "604800000"  # 7 days retention for error topic
  }
}

# ------------------------------------------------------
# Avro Schemas for SCADA
# ------------------------------------------------------

resource "confluent_schema" "avro-scada-telemetry" {
  schema_registry_cluster {
    id = var.schema_registry_id
  }
  rest_endpoint = var.schema_registry_rest_endpoint
  subject_name  = "scada-telemetry-value"
  format        = "AVRO"
  schema        = file("${path.root}/schemas/avro/scada-telemetry-value.avsc")
  hard_delete   = true

  credentials {
    key    = var.schema_registry_api_key
    secret = var.schema_registry_api_secret
  }

  depends_on = [
    confluent_kafka_topic.scada-telemetry-topic
  ]
}

resource "confluent_schema" "avro-scada-alerts" {
  schema_registry_cluster {
    id = var.schema_registry_id
  }
  rest_endpoint = var.schema_registry_rest_endpoint
  subject_name  = "scada-alerts-value"
  format        = "AVRO"
  schema        = file("${path.root}/schemas/avro/scada-alerts-value.avsc")
  hard_delete   = true

  credentials {
    key    = var.schema_registry_api_key
    secret = var.schema_registry_api_secret
  }

  depends_on = [
    confluent_kafka_topic.scada-alerts-topic
  ]
}

# ------------------------------------------------------
# PostgreSQL Tables for SCADA (via init script)
# ------------------------------------------------------
# NOTE: SCADA tables will be created by a separate init container
#       similar to the retail demo pattern. This will be implemented later.

# ------------------------------------------------------
# SCADA Simulator Application
# ------------------------------------------------------

# ECR Repository
resource "aws_ecr_repository" "scada_simulator_repo" {
  name = "${var.prefix}-scada-simulator-repo"
  force_delete = true
  lifecycle {
    prevent_destroy = false
  }
}

locals {
  scada_simulator_image_tag = "${aws_ecr_repository.scada_simulator_repo.repository_url}:latest"
}

# Build and Push SCADA Simulator using Docker provider
resource "docker_image" "scada_simulator" {
  name = "${aws_ecr_repository.scada_simulator_repo.repository_url}:latest"
  build {
    context = "../code/scada-simulator"
    platform = "linux/amd64"
  }
}

resource "docker_registry_image" "scada_simulator" {
  name = docker_image.scada_simulator.name
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "scada-simulator-log-group" {
  name = "/ecs/scada-simulator-task"
}

# ECS Task Definition for SCADA Simulator
resource "aws_ecs_task_definition" "scada_simulator_task" {
  family                   = "scada-simulator-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_container_role_arn
  memory                   = "512"
  cpu                      = "256"
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = var.cpu_architecture
  }

  container_definitions = jsonencode([
    {
      name      = "scada-simulator"
      image     = local.scada_simulator_image_tag
      essential = true

      environment = [
        { name = "BOOTSTRAP_SERVERS", value = var.kafka_bootstrap_endpoint },
        { name = "KAFKA_API_KEY", value = var.kafka_api_key },
        { name = "KAFKA_API_SECRET", value = var.kafka_api_secret },
        { name = "SCHEMA_REGISTRY_URL", value = var.schema_registry_rest_endpoint },
        { name = "SCHEMA_REGISTRY_KEY", value = var.schema_registry_api_key },
        { name = "SCHEMA_REGISTRY_SECRET", value = var.schema_registry_api_secret }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.scada-simulator-log-group.name
          awslogs-region        = var.cloud_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# ECS Service for SCADA Simulator
resource "aws_ecs_service" "scada_simulator_service" {
  name            = "scada-simulator-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.scada_simulator_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [var.subnet_id]
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  depends_on = [
    docker_registry_image.scada_simulator,
    confluent_schema.avro-scada-telemetry,
    confluent_schema.avro-scada-alerts
  ]
}
