# ------------------------------------------------------
# Shared ECS Infrastructure
# ------------------------------------------------------
# This file contains all shared infrastructure resources
# used by both retail and SCADA demo stacks
# ------------------------------------------------------

# ------------------------------------------------------
# Platform Detection (Windows vs Unix)
# ------------------------------------------------------

locals {
  is_windows = fileexists("C:\\Windows\\System32\\cmd.exe")
}

data "external" "arch_windows" {
  count   = local.is_windows ? 1 : 0
  program = ["powershell", "-NoProfile", "-Command", "$arch=$env:PROCESSOR_ARCHITECTURE; Write-Output ('{\"arch\":\"' + $arch + '\"}')"]
}

data "external" "arch_unix" {
  count   = local.is_windows ? 0 : 1
  program = ["/bin/sh", "-c", "printf '{\"arch\":\"%s\"}' \"$(uname -m)\""]
}

locals {
  detected_arch     = local.is_windows ? lower(trimspace(data.external.arch_windows[0].result.arch)) : lower(trimspace(data.external.arch_unix[0].result.arch))
  # Force X86_64 for Fargate compatibility - ARM64 not supported in all AZs
  cpu_architecture  = "X86_64"
}

# ------------------------------------------------------
# VPC and Networking
# ------------------------------------------------------

# VPC
resource "aws_vpc" "ecs_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# Public Subnet 1
resource "aws_subnet" "public_subnet" {
  vpc_id            = aws_vpc.ecs_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
}

# Public Subnet 2 (required for RDS multi-AZ requirement)
resource "aws_subnet" "public_subnet_2" {
  vpc_id            = aws_vpc.ecs_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]
}

# Data source for available AZs - exclude local zones and wavelength zones
data "aws_availability_zones" "available" {
  state = "available"

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.ecs_vpc.id
}

# Public Route Table
resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.ecs_vpc.id

  route {
    cidr_block = "0.0.0.0/0"  # This route allows all outbound traffic
    gateway_id = aws_internet_gateway.igw.id  # Route to the Internet Gateway
  }
}

# Associate Public Route Table with Public Subnets
resource "aws_route_table_association" "public_route_table_association" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_route_table.id
}

resource "aws_route_table_association" "public_route_table_association_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_route_table.id
}

# Security Group for ECS
resource "aws_security_group" "ecs_sg" {
  vpc_id = aws_vpc.ecs_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Backend API port"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ------------------------------------------------------
# ECS Cluster
# ------------------------------------------------------

resource "aws_ecs_cluster" "ecs_cluster" {
  name = "${var.prefix}-ecs-cluster"
}

# ------------------------------------------------------
# IAM Roles for ECS
# ------------------------------------------------------

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.prefix}-ecsTaskExecutionRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ECS-task-execution-attach" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for the containers (task role)
resource "aws_iam_role" "ecs_container_role" {
  name = "${var.prefix}-ecsTaskRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

# KMS usage policy for container role
resource "aws_iam_role_policy" "kms_usage_policy" {
  name = "${var.prefix}-kms-usage-policy"
  role = aws_iam_role.ecs_container_role.id

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
