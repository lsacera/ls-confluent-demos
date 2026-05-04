# ========================================
# Dashboards ECS Deployment - Conditional
# ========================================
# Deploys retail and/or SCADA dashboards based on feature flags
# Each dashboard is a combined container running both frontend (nginx)
# and backend (node.js) using supervisord

# ========================================
# RETAIL DASHBOARD
# ========================================

# ----------------------------------------
# Retail Dashboard - ECR Repository
# ----------------------------------------

resource "aws_ecr_repository" "retail_dashboard" {
  count                = local.deploy_retail ? 1 : 0
  name                 = "${var.prefix}-retail-dashboard"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.prefix}-retail-dashboard"
    Application = "retail-dashboard"
  }
}

resource "aws_ecr_lifecycle_policy" "retail_dashboard_lifecycle" {
  count      = local.deploy_retail ? 1 : 0
  repository = aws_ecr_repository.retail_dashboard[0].name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}

# ----------------------------------------
# Retail Dashboard - Docker Image
# ----------------------------------------

resource "docker_image" "retail_dashboard" {
  count = local.deploy_retail ? 1 : 0
  name  = "${aws_ecr_repository.retail_dashboard[0].repository_url}:latest"

  build {
    context    = "../retail-web-dashboard"
    platform   = "linux/amd64"
    dockerfile = "Dockerfile"
  }

  depends_on = [aws_ecr_repository.retail_dashboard]
}

resource "docker_registry_image" "retail_dashboard" {
  count = local.deploy_retail ? 1 : 0
  name  = docker_image.retail_dashboard[0].name
}

# ----------------------------------------
# Retail Dashboard - CloudWatch Logs
# ----------------------------------------

resource "aws_cloudwatch_log_group" "retail_dashboard_log_group" {
  count             = local.deploy_retail ? 1 : 0
  name              = "/ecs/retail-dashboard-${random_id.env_display_id.hex}"
  retention_in_days = 7
}

# ----------------------------------------
# Retail Dashboard - ECS Task Definition
# ----------------------------------------

resource "aws_ecs_task_definition" "retail_dashboard_task" {
  count                    = local.deploy_retail ? 1 : 0
  family                   = "retail-dashboard-task-${random_id.env_display_id.hex}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_container_role.arn
  memory                   = "1024"
  cpu                      = "512"

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = local.cpu_architecture
  }

  container_definitions = jsonencode([
    {
      name      = "retail-dashboard"
      image     = "${aws_ecr_repository.retail_dashboard[0].repository_url}:latest"
      essential = true

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "POSTGRES_HOST", value = aws_db_instance.postgres_db.address },
        { name = "POSTGRES_PORT", value = tostring(aws_db_instance.postgres_db.port) },
        { name = "POSTGRES_USER", value = var.db_username },
        { name = "POSTGRES_PASSWORD", value = var.db_password },
        { name = "POSTGRES_DATABASE", value = "onlinestoredb" },
        { name = "POSTGRES_SSL", value = "true" },
        { name = "CACHE_TTL", value = "5" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.retail_dashboard_log_group[0].name
          awslogs-region        = var.cloud_region
          awslogs-stream-prefix = "ecs"
        }
      }

      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
          protocol      = "tcp"
        }
      ]

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

# ----------------------------------------
# Retail Dashboard - ECS Service
# ----------------------------------------

resource "aws_ecs_service" "retail_dashboard_service" {
  count           = local.deploy_retail ? 1 : 0
  name            = "retail-dashboard-service"
  cluster         = aws_ecs_cluster.ecs_cluster.id
  task_definition = aws_ecs_task_definition.retail_dashboard_task[0].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_subnet.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  depends_on = [
    aws_db_instance.postgres_db,
    docker_registry_image.retail_dashboard,
    module.retail_flink_queries
  ]
}

# ========================================
# SCADA DASHBOARD
# ========================================

# ----------------------------------------
# SCADA Dashboard - ECR Repository
# ----------------------------------------

resource "aws_ecr_repository" "scada_dashboard" {
  count                = local.deploy_scada ? 1 : 0
  name                 = "${var.prefix}-scada-dashboard"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.prefix}-scada-dashboard"
    Application = "scada-dashboard"
  }
}

resource "aws_ecr_lifecycle_policy" "scada_dashboard_lifecycle" {
  count      = local.deploy_scada ? 1 : 0
  repository = aws_ecr_repository.scada_dashboard[0].name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}

# ----------------------------------------
# SCADA Dashboard - Docker Image
# ----------------------------------------

resource "docker_image" "scada_dashboard" {
  count = local.deploy_scada ? 1 : 0
  name  = "${aws_ecr_repository.scada_dashboard[0].repository_url}:latest"

  build {
    context    = "../scada-web-dashboard"
    platform   = "linux/amd64"
    dockerfile = "Dockerfile"
  }

  depends_on = [aws_ecr_repository.scada_dashboard]
}

resource "docker_registry_image" "scada_dashboard" {
  count = local.deploy_scada ? 1 : 0
  name  = docker_image.scada_dashboard[0].name
}

# ----------------------------------------
# SCADA Dashboard - CloudWatch Logs
# ----------------------------------------

resource "aws_cloudwatch_log_group" "scada_dashboard_log_group" {
  count             = local.deploy_scada ? 1 : 0
  name              = "/ecs/scada-dashboard-${random_id.env_display_id.hex}"
  retention_in_days = 7
}

# ----------------------------------------
# SCADA Dashboard - ECS Task Definition
# ----------------------------------------

resource "aws_ecs_task_definition" "scada_dashboard_task" {
  count                    = local.deploy_scada ? 1 : 0
  family                   = "scada-dashboard-task-${random_id.env_display_id.hex}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_container_role.arn
  memory                   = "1024"
  cpu                      = "512"

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = local.cpu_architecture
  }

  container_definitions = jsonencode([
    {
      name      = "scada-dashboard"
      image     = "${aws_ecr_repository.scada_dashboard[0].repository_url}:latest"
      essential = true

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "POSTGRES_HOST", value = aws_db_instance.postgres_db.address },
        { name = "POSTGRES_PORT", value = tostring(aws_db_instance.postgres_db.port) },
        { name = "POSTGRES_USER", value = var.db_username },
        { name = "POSTGRES_PASSWORD", value = var.db_password },
        { name = "POSTGRES_DATABASE", value = "onlinestoredb" },
        { name = "POSTGRES_SSL", value = "true" },
        { name = "CACHE_TTL", value = "5" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.scada_dashboard_log_group[0].name
          awslogs-region        = var.cloud_region
          awslogs-stream-prefix = "ecs"
        }
      }

      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
          protocol      = "tcp"
        }
      ]

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

# ----------------------------------------
# SCADA Dashboard - ECS Service
# ----------------------------------------

resource "aws_ecs_service" "scada_dashboard_service" {
  count           = local.deploy_scada ? 1 : 0
  name            = "scada-dashboard-service"
  cluster         = aws_ecs_cluster.ecs_cluster.id
  task_definition = aws_ecs_task_definition.scada_dashboard_task[0].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_subnet.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  depends_on = [
    aws_db_instance.postgres_db,
    docker_registry_image.scada_dashboard,
    module.scada_flink_queries
  ]
}

# ========================================
# OUTPUTS
# ========================================

output "retail_dashboard_deployed" {
  description = "Whether retail dashboard is deployed"
  value       = local.deploy_retail
}

output "scada_dashboard_deployed" {
  description = "Whether SCADA dashboard is deployed"
  value       = local.deploy_scada
}

output "retail_dashboard_ecs_info" {
  description = "Retail Dashboard ECS deployment information"
  value = local.deploy_retail ? {
    service   = aws_ecs_service.retail_dashboard_service[0].name
    cluster   = aws_ecs_cluster.ecs_cluster.name
    log_group = aws_cloudwatch_log_group.retail_dashboard_log_group[0].name
  } : null
}

output "scada_dashboard_ecs_info" {
  description = "SCADA Dashboard ECS deployment information"
  value = local.deploy_scada ? {
    service   = aws_ecs_service.scada_dashboard_service[0].name
    cluster   = aws_ecs_cluster.ecs_cluster.name
    log_group = aws_cloudwatch_log_group.scada_dashboard_log_group[0].name
  } : null
}
