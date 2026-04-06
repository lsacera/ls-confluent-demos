# ------------------------------------------------------
# Retail Stack Module - Main Resources
# ------------------------------------------------------

# ------------------------------------------------------
# KMS Key for CSFLE (Client-Side Field Level Encryption)
# ------------------------------------------------------

data "aws_caller_identity" "current" {}

resource "aws_kms_key" "kms_key" {
  description = "An symmetric encryption KMS key used for CSFLE"
  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "key-default-1-ls-retail"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = data.aws_caller_identity.current.arn
        },
        Action   = "kms:*",
        Resource = "*"
      },
      {
        Sid    = "Enable Any IAM User Permission to DESCRIBE"
        Effect = "Allow"
        Principal = {
          AWS = "*"
        },
        Action = [
          "kms:DescribeKey",
          "kms:GetKeyPolicy"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_user.payments_app_user.arn
        },
        Action = [
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "kms_key_alias" {
  name          = "alias/${var.prefix}_csfle_key"
  target_key_id = aws_kms_key.kms_key.key_id
}

# Schema Registry KEK (Key Encryption Key) for CSFLE
resource "confluent_schema_registry_kek" "aws_key" {
  schema_registry_cluster {
    id = var.schema_registry_id
  }
  rest_endpoint = var.schema_registry_rest_endpoint
  credentials {
    key    = var.schema_registry_api_key
    secret = var.schema_registry_api_secret
  }

  name        = "CSFLE_Key"
  kms_type    = "aws-kms"
  kms_key_id  = aws_kms_key.kms_key.arn
  hard_delete = true
}

# ------------------------------------------------------
# IAM Resources for Payments App
# ------------------------------------------------------

resource "aws_iam_user" "payments_app_user" {
  name = "payments_app_user_${var.env_display_id}"
}

resource "aws_iam_access_key" "payments_app_aws_key" {
  user = aws_iam_user.payments_app_user.name
}

resource "aws_iam_user_policy" "payments_app_iam_policy" {
  name   = "payments_app_iam_policy__${var.env_display_id}"
  user   = aws_iam_user.payments_app_user.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kms:*",
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

# ------------------------------------------------------
# Application Configuration Files
# ------------------------------------------------------

# DB Feeder properties file
resource "local_file" "db_feeder_properties" {
  filename = "../code/postgresql-data-feeder/src/main/resources/db.properties"
  content  = <<-EOT
    db.url=jdbc:postgresql://${var.db_address}/onlinestoredb
    db.user=${var.db_username}
    db.password=${var.db_password}
  EOT
}

# Payments app properties file
resource "local_file" "payment_app_properties" {
  filename = "../code/payments-app/src/main/resources/cc-orders.properties"
  content  = <<-EOT
#Environment: inventory_mgmt
#Cluster: inventory analytics
bootstrap.servers=${var.kafka_bootstrap_endpoint}
security.protocol=SASL_SSL
ssl.endpoint.identification.algorithm=https
sasl.mechanism=PLAIN
num.partitions=6
replication.factor=3
sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username="${var.kafka_api_key}" password="${var.kafka_api_secret}";


# Confluent Cloud Schema Registry
schema.registry.url=${var.schema_registry_rest_endpoint}
schema.registry.basic.auth.user.info= ${var.schema_registry_api_key}:${var.schema_registry_api_secret}
basic.auth.credentials.source=USER_INFO

## Data quality rules
#KMS Props
rule.executors._default_.param.access.key.id=${aws_iam_access_key.payments_app_aws_key.id}
rule.executors._default_.param.secret.access.key=${aws_iam_access_key.payments_app_aws_key.secret}
  EOT
}

# Payments App Data Quality Rules file
resource "local_file" "payment_app_dqr" {
  filename = "../code/payments-app/src/main/datacontracts/avro/payments-value-dqr.json"
  content  = <<-EOT
  {
    "metadata": {
        "tags": {
            "Sale.cc_number": [ "pci" ]
        }
    },
    "ruleSet": {
        "domainRules": [
            {
                "name": "pci_encrypt",
                "kind": "TRANSFORM",
                "mode": "WRITEREAD",
                "type": "ENCRYPT",
                "tags": ["pci"],
                "params": {
                    "encrypt.kek.name": "pci_encrypt_key",
                    "encrypt.kms.key.id": "${aws_kms_key.kms_key.arn}",
                    "encrypt.kms.type": "aws-kms"
                },
                "onFailure": "ERROR,NONE",
                "disabled": true
            },
            {
                "name": "validateConfirmationCode",
                "kind": "CONDITION",
                "mode": "WRITE",
                "type": "CEL",
                "expr": "message.confirmation_code.matches('^[A-Z0-9]{8}$')",
                "onFailure": "DLQ",
                "params": {
                    "dlq.topic": "error-payments",
                    "dlq.auto.flush": "true"
                }
            }
        ]
    }
}
  EOT
}

# ------------------------------------------------------
# ECR Repositories
# ------------------------------------------------------

resource "aws_ecr_repository" "payment_app_repo" {
  name = "${var.prefix}-payment-app-repo-${var.env_display_id}"
  force_delete = true
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_ecr_repository" "dbfeeder_app_repo" {
  name = "${var.prefix}-dbfeeder-app-repo-${var.env_display_id}"
  force_delete = true
  lifecycle {
    prevent_destroy = false
  }
}

# ------------------------------------------------------
# Docker Images
# ------------------------------------------------------

locals {
  payment_app_image_tag  = "${aws_ecr_repository.payment_app_repo.repository_url}:latest"
  dbfeeder_app_image_tag = "${aws_ecr_repository.dbfeeder_app_repo.repository_url}:latest"
}

# Build and Push Payment App using Docker provider
resource "docker_image" "payment_app" {
  name = "${aws_ecr_repository.payment_app_repo.repository_url}:latest"
  build {
    context  = "../code/payments-app"
    platform = "linux/amd64"
  }
  triggers = {
    properties_file = sha256(local_file.payment_app_properties.content)
    dqr_file       = sha256(local_file.payment_app_dqr.content)
  }
  depends_on = [
    local_file.payment_app_properties,
    local_file.payment_app_dqr
  ]
}

resource "docker_registry_image" "payment_app" {
  name = docker_image.payment_app.name
}

# Build and Push DB Feeder App using Docker provider
resource "docker_image" "dbfeeder_app" {
  name = "${aws_ecr_repository.dbfeeder_app_repo.repository_url}:latest"
  build {
    context  = "../code/postgresql-data-feeder"
    platform = "linux/amd64"
  }
  triggers = {
    properties_file = sha256(local_file.db_feeder_properties.content)
  }
  depends_on = [
    local_file.db_feeder_properties,
    var.psql_init_container_id  # Ensure DB is initialized first
  ]
}

resource "docker_registry_image" "dbfeeder_app" {
  name = docker_image.dbfeeder_app.name
}

# ------------------------------------------------------
# CloudWatch Log Groups
# ------------------------------------------------------

resource "aws_cloudwatch_log_group" "dbfeeder-log-group" {
  name = "/ecs/db-feeder-task-${var.env_display_id}"
}

resource "aws_cloudwatch_log_group" "payments-task-log-group" {
  name = "/ecs/payments-task-${var.env_display_id}"
}

# ------------------------------------------------------
# ECS Task Definitions
# ------------------------------------------------------

# Task Definition for Payment App
resource "aws_ecs_task_definition" "payment_app_task" {
  family                   = "payment-app-task-${var.env_display_id}"
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
      name      = "payment-app"
      image     = local.payment_app_image_tag
      essential = true

      environment = [
        { name = "BOOTSTRAP_SERVERS", value = var.kafka_bootstrap_endpoint },
        { name = "KAFKA_API_KEY", value = var.kafka_api_key },
        { name = "KAFKA_API_SECRET", value = var.kafka_api_secret },
        { name = "SCHEMA_REGISTRY_URL", value = var.schema_registry_rest_endpoint },
        { name = "SCHEMA_REGISTRY_KEY", value = var.schema_registry_api_key },
        { name = "SCHEMA_REGISTRY_SECRET", value = var.schema_registry_api_secret },
        { name = "AWS_ACCESS_KEY_ID_KMS", value = aws_iam_access_key.payments_app_aws_key.id },
        { name = "AWS_SECRET_ACCESS_KEY_KMS", value = aws_iam_access_key.payments_app_aws_key.secret }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.payments-task-log-group.name
          awslogs-region        = var.cloud_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# Task Definition for DB Feeder App
resource "aws_ecs_task_definition" "dbfeeder_app_task" {
  family                   = "dbfeeder-app-task-${var.env_display_id}"
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
      name      = "dbfeeder-app"
      image     = local.dbfeeder_app_image_tag
      essential = true

      environment = [
        { name = "DB_URL", value = "jdbc:postgresql://${var.db_address}/onlinestoredb" },
        { name = "DB_USER", value = var.db_username },
        { name = "DB_PASSWORD", value = var.db_password }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.dbfeeder-log-group.name
          awslogs-region        = var.cloud_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# ------------------------------------------------------
# ECS Services
# ------------------------------------------------------

# ECS Service for Payment App
resource "aws_ecs_service" "payment_app_service" {
  name            = "payment-app-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.payment_app_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [var.subnet_id]
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  depends_on = [
    docker_registry_image.payment_app,
    confluent_kafka_topic.error-payments-topic,
    confluent_kafka_topic.payments-topic,
    confluent_schema.avro-payments
  ]
}

# ECS Service for DB Feeder App
resource "aws_ecs_service" "dbfeeder_app_service" {
  name            = "dbfeeder-app-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.dbfeeder_app_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [var.subnet_id]
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  depends_on = [
    docker_registry_image.dbfeeder_app,
    var.psql_init_container_id
  ]
}

# ------------------------------------------------------
# Kafka Topics
# ------------------------------------------------------

resource "confluent_kafka_topic" "error-payments-topic" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }
  topic_name         = "error-payments"
  rest_endpoint      = var.kafka_rest_endpoint
  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
  }
}

resource "confluent_kafka_topic" "payments-topic" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }
  topic_name         = "payments"
  rest_endpoint      = var.kafka_rest_endpoint
  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
  }
}

# ------------------------------------------------------
# Schemas
# ------------------------------------------------------

resource "confluent_schema" "avro-payments" {
  schema_registry_cluster {
    id = var.schema_registry_id
  }
  rest_endpoint = var.schema_registry_rest_endpoint
  subject_name = "payments-value"
  format = "AVRO"
  schema = file("${path.module}/../../schemas/avro/payments-value.avsc")
  hard_delete = true
  credentials {
    key    = var.schema_registry_api_key
    secret = var.schema_registry_api_secret
  }

  # Note: Data quality rules commented out due to Flink bug
  # ruleset {
  #   domain_rules {
  #     name = "validateConfirmationCode"
  #     kind = "CONDITION"
  #     mode = "WRITEREAD"
  #     type = "CEL"
  #     expr = "message.confirmation_code.matches('^[A-Z0-9]{8}$')"
  #     on_failure = "DLQ"
  #     params = {
  #       "dlq.topic" = "error-payments"
  #       "dlq.auto.flush" = "true"
  #     }
  #   }
  # }
}
