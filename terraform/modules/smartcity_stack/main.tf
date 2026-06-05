# ------------------------------------------------------
# Smart City Madrid Stack Module - Main Resources
# ------------------------------------------------------

# This module deploys resources for the Smart City Madrid demo
# including topics, schemas, and infrastructure for monitoring
# traffic sensors, air quality, EMT buses, and citizen services.

data "aws_caller_identity" "current" {}

# ------------------------------------------------------
# Kafka Topics for Smart City Madrid
# ------------------------------------------------------

resource "confluent_kafka_topic" "smartcity-traffic-topic" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }
  topic_name       = "smartcity-traffic"
  partitions_count = 6
  rest_endpoint    = var.kafka_rest_endpoint

  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
  }

  config = {
    "retention.ms" = "604800000" # 7 days retention for traffic data
  }
}

resource "confluent_kafka_topic" "smartcity-airquality-topic" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }
  topic_name       = "smartcity-airquality"
  partitions_count = 3
  rest_endpoint    = var.kafka_rest_endpoint

  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
  }

  config = {
    "retention.ms" = "604800000" # 7 days retention for air quality data
  }
}

resource "confluent_kafka_topic" "smartcity-emtbus-topic" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }
  topic_name       = "smartcity-emtbus"
  partitions_count = 3
  rest_endpoint    = var.kafka_rest_endpoint

  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
  }

  config = {
    "retention.ms" = "604800000" # 7 days retention for EMT bus telemetry
  }
}

resource "confluent_kafka_topic" "smartcity-service-topic" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }
  topic_name       = "smartcity-service"
  partitions_count = 3
  rest_endpoint    = var.kafka_rest_endpoint

  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
  }

  config = {
    "retention.ms" = "2592000000" # 30 days retention for citizen service requests
  }
}

resource "confluent_kafka_topic" "smartcity-alert-topic" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }
  topic_name       = "smartcity-alert"
  partitions_count = 3
  rest_endpoint    = var.kafka_rest_endpoint

  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
  }

  config = {
    "retention.ms" = "2592000000" # 30 days retention for alerts
  }
}

# ------------------------------------------------------
# Avro Schemas for Smart City Madrid
# ------------------------------------------------------

resource "confluent_schema" "avro-smartcity-traffic" {
  schema_registry_cluster {
    id = var.schema_registry_id
  }
  rest_endpoint = var.schema_registry_rest_endpoint
  subject_name  = "smartcity-traffic-value"
  format        = "AVRO"
  schema        = file("${path.root}/schemas/avro/smartcity-traffic-value.avsc")
  hard_delete   = true

  credentials {
    key    = var.schema_registry_api_key
    secret = var.schema_registry_api_secret
  }

  depends_on = [
    confluent_kafka_topic.smartcity-traffic-topic
  ]
}

resource "confluent_schema" "avro-smartcity-airquality" {
  schema_registry_cluster {
    id = var.schema_registry_id
  }
  rest_endpoint = var.schema_registry_rest_endpoint
  subject_name  = "smartcity-airquality-value"
  format        = "AVRO"
  schema        = file("${path.root}/schemas/avro/smartcity-airquality-value.avsc")
  hard_delete   = true

  credentials {
    key    = var.schema_registry_api_key
    secret = var.schema_registry_api_secret
  }

  depends_on = [
    confluent_kafka_topic.smartcity-airquality-topic
  ]
}

resource "confluent_schema" "avro-smartcity-emtbus" {
  schema_registry_cluster {
    id = var.schema_registry_id
  }
  rest_endpoint = var.schema_registry_rest_endpoint
  subject_name  = "smartcity-emtbus-value"
  format        = "AVRO"
  schema        = file("${path.root}/schemas/avro/smartcity-emtbus-value.avsc")
  hard_delete   = true

  credentials {
    key    = var.schema_registry_api_key
    secret = var.schema_registry_api_secret
  }

  depends_on = [
    confluent_kafka_topic.smartcity-emtbus-topic
  ]
}

resource "confluent_schema" "avro-smartcity-service" {
  schema_registry_cluster {
    id = var.schema_registry_id
  }
  rest_endpoint = var.schema_registry_rest_endpoint
  subject_name  = "smartcity-service-value"
  format        = "AVRO"
  schema        = file("${path.root}/schemas/avro/smartcity-service-value.avsc")
  hard_delete   = true

  credentials {
    key    = var.schema_registry_api_key
    secret = var.schema_registry_api_secret
  }

  depends_on = [
    confluent_kafka_topic.smartcity-service-topic
  ]
}

resource "confluent_schema" "avro-smartcity-alert" {
  schema_registry_cluster {
    id = var.schema_registry_id
  }
  rest_endpoint = var.schema_registry_rest_endpoint
  subject_name  = "smartcity-alert-value"
  format        = "AVRO"
  schema        = file("${path.root}/schemas/avro/smartcity-alert-value.avsc")
  hard_delete   = true

  credentials {
    key    = var.schema_registry_api_key
    secret = var.schema_registry_api_secret
  }

  depends_on = [
    confluent_kafka_topic.smartcity-alert-topic
  ]
}

# ------------------------------------------------------
# Smart City Simulator Application
# ------------------------------------------------------

# ECR Repository
resource "aws_ecr_repository" "smartcity_simulator_repo" {
  name         = "${var.prefix}-smartcity-simulator-repo"
  force_delete = true
  lifecycle {
    prevent_destroy = false
  }
}

locals {
  smartcity_simulator_image_tag = "${aws_ecr_repository.smartcity_simulator_repo.repository_url}:latest"
}

# Build and Push Smart City images using external script
# This avoids timeout issues with the Terraform Docker provider
resource "null_resource" "build_and_push_smartcity_images" {
  # Trigger rebuild when ECR repos change
  triggers = {
    smartcity_simulator_repo = aws_ecr_repository.smartcity_simulator_repo.id
    smartcity_dashboard_repo = aws_ecr_repository.smartcity_dashboard_repo.id
  }

  provisioner "local-exec" {
    command = "/Users/lsanchezacera/ls-confluent-demos/build-and-push-smartcity-images.sh us-east-1 ${aws_ecr_repository.smartcity_simulator_repo.name} ${aws_ecr_repository.smartcity_dashboard_repo.name}"
  }

  depends_on = [
    aws_ecr_repository.smartcity_simulator_repo,
    aws_ecr_repository.smartcity_dashboard_repo
  ]
}

# Reference the simulator image that was just built
data "docker_registry_image" "smartcity_simulator" {
  name = "${aws_ecr_repository.smartcity_simulator_repo.repository_url}:latest"

  depends_on = [null_resource.build_and_push_smartcity_images]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "smartcity-simulator-log-group" {
  name = "/ecs/smartcity-simulator-task"
}

# ECS Task Definition for Smart City Simulator
resource "aws_ecs_task_definition" "smartcity_simulator_task" {
  family                   = "smartcity-simulator-task"
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
      name      = "smartcity-simulator"
      image     = local.smartcity_simulator_image_tag
      essential = true

      environment = [
        { name = "KAFKA_BOOTSTRAP_SERVERS", value = var.kafka_bootstrap_endpoint },
        { name = "KAFKA_SECURITY_PROTOCOL", value = "SASL_SSL" },
        { name = "KAFKA_SASL_MECHANISM", value = "PLAIN" },
        {
          name = "KAFKA_SASL_JAAS_CONFIG",
          value = "org.apache.kafka.common.security.plain.PlainLoginModule required username='${var.kafka_api_key}' password='${var.kafka_api_secret}';"
        },
        { name = "SCHEMA_REGISTRY_URL", value = var.schema_registry_rest_endpoint },
        { name = "SCHEMA_REGISTRY_BASIC_AUTH_USER_INFO", value = "${var.schema_registry_api_key}:${var.schema_registry_api_secret}" },
        { name = "INTERVAL_SECONDS", value = "5" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.smartcity-simulator-log-group.name
          awslogs-region        = var.cloud_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# ECS Service for Smart City Simulator
resource "aws_ecs_service" "smartcity_simulator_service" {
  name            = "smartcity-simulator-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.smartcity_simulator_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [var.subnet_id]
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  depends_on = [
    data.docker_registry_image.smartcity_simulator,
    confluent_schema.avro-smartcity-traffic,
    confluent_schema.avro-smartcity-airquality,
    confluent_schema.avro-smartcity-emtbus,
    confluent_schema.avro-smartcity-service,
    confluent_schema.avro-smartcity-alert
  ]
}

# ------------------------------------------------------
# Smart City Dashboard Application
# ------------------------------------------------------

# ECR Repository for Dashboard
resource "aws_ecr_repository" "smartcity_dashboard_repo" {
  name         = "${var.prefix}-smartcity-dashboard-repo"
  force_delete = true
  lifecycle {
    prevent_destroy = false
  }
}

locals {
  smartcity_dashboard_image_tag = "${aws_ecr_repository.smartcity_dashboard_repo.repository_url}:latest"
}

# Reference the dashboard image that was built by the same null_resource above
data "docker_registry_image" "smartcity_dashboard" {
  name = "${aws_ecr_repository.smartcity_dashboard_repo.repository_url}:latest"

  depends_on = [null_resource.build_and_push_smartcity_images]
}

# CloudWatch Log Group for Dashboard
resource "aws_cloudwatch_log_group" "smartcity-dashboard-log-group" {
  name = "/ecs/smartcity-dashboard-task"
}

# ECS Task Definition for Smart City Dashboard
resource "aws_ecs_task_definition" "smartcity_dashboard_task" {
  family                   = "smartcity-dashboard-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_container_role_arn
  memory                   = "1024"
  cpu                      = "512"
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = var.cpu_architecture
  }

  container_definitions = jsonencode([
    {
      name      = "smartcity-dashboard"
      image     = local.smartcity_dashboard_image_tag
      essential = true

      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "POSTGRES_HOST", value = var.db_address },
        { name = "POSTGRES_PORT", value = "5432" },
        { name = "POSTGRES_USER", value = var.db_username },
        { name = "POSTGRES_PASSWORD", value = var.db_password },
        { name = "POSTGRES_DATABASE", value = "onlinestoredb" },
        { name = "POSTGRES_SSL", value = "true" },
        { name = "PORT", value = "3000" },
        { name = "NODE_ENV", value = "production" },
        { name = "CACHE_TTL", value = "5" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.smartcity-dashboard-log-group.name
          awslogs-region        = var.cloud_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

# ECS Service for Smart City Dashboard
resource "aws_ecs_service" "smartcity_dashboard_service" {
  name            = "smartcity-dashboard-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.smartcity_dashboard_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [var.subnet_id]
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  depends_on = [
    data.docker_registry_image.smartcity_dashboard,
    confluent_schema.avro-smartcity-traffic,
    confluent_schema.avro-smartcity-airquality,
    confluent_schema.avro-smartcity-emtbus,
    confluent_schema.avro-smartcity-service,
    confluent_schema.avro-smartcity-alert
  ]
}
