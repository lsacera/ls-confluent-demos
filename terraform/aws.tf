# Security group for PostgreSQL database in ECS VPC
resource "aws_security_group" "db_security_group" {
  # name   = "db_sg_${random_id.env_display_id.hex}"
  name   = "db_sg_ls-retail"
  vpc_id = aws_vpc.ecs_vpc.id

  description = "Security group for PostgreSQL - allows access from ECS VPC and Twingate IP"
}

# Allow inbound PostgreSQL from ECS VPC (for containers)
resource "aws_security_group_rule" "allow_inbound_postgres_from_vpc" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  security_group_id = aws_security_group.db_security_group.id
  cidr_blocks       = ["10.0.0.0/16"]  # ECS VPC CIDR
  description       = "Allow PostgreSQL from ECS VPC"
}

# Allow inbound PostgreSQL from Twingate IP (for local access)
resource "aws_security_group_rule" "allow_inbound_postgres_from_twingate" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  security_group_id = aws_security_group.db_security_group.id
  cidr_blocks       = ["213.94.23.170/32"]  # Twingate IP
  description       = "Allow PostgreSQL from Twingate IP"
}

# Allow inbound PostgreSQL from Confluent Cloud egress IPs
resource "aws_security_group_rule" "allow_inbound_postgres_from_confluent" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  security_group_id = aws_security_group.db_security_group.id
  cidr_blocks       = [
    "100.24.204.241/32",
    "107.21.116.39/32",
    "18.204.235.237/32",
    "18.232.30.126/32",
    "3.217.171.197/32",
    "3.227.73.0/32",
    "3.234.42.230/32",
    "34.204.253.120/32",
    "34.205.233.46/32",
    "34.231.151.179/32",
    "35.173.154.142/32",
    "52.201.77.94/32",
    "52.3.108.122/32",
    "52.4.168.0/32",
    "52.45.226.34/32",
    "52.5.120.21/32",
    "52.55.155.248/32",
    "52.73.34.234/32",
    "54.146.88.203/32",
    "54.156.105.40/32",
    "54.172.40.193/32",
    "54.204.102.217/32",
    "54.204.113.211/32",
    "54.237.164.14/32",
    "54.242.207.111/32",
    "54.243.244.175/32",
    "54.83.252.163/32"
  ]
  description       = "Allow PostgreSQL from Confluent Cloud egress IPs (us-east-1)"
}

# Allow all outbound traffic
resource "aws_security_group_rule" "allow_outbound_postgres" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.db_security_group.id
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
}


# DB Subnet Group for RDS in ECS VPC
resource "aws_db_subnet_group" "postgres_subnet_group" {
  name       = "${var.prefix}-postgres-subnet-group"
  subnet_ids = [aws_subnet.public_subnet.id, aws_subnet.public_subnet_2.id]

  tags = {
    Name = "${var.prefix}-postgres-subnet-group"
  }
}

resource "aws_db_instance" "postgres_db" {
  allocated_storage      = 30
  engine                 = "postgres"
  engine_version         = "16.11"
  instance_class         = "db.t3.medium"
  #identifier            = "${var.prefix}-onlinestoredb-${random_id.env_display_id.hex}"
  identifier             = "${var.prefix}-onlinestoredb"
  db_name                = "onlinestoredb"
  username               = var.db_username
  password               = var.db_password
  publicly_accessible    = true
  parameter_group_name   = aws_db_parameter_group.pg_parameter_group.name
  db_subnet_group_name   = aws_db_subnet_group.postgres_subnet_group.name
  vpc_security_group_ids = [aws_security_group.db_security_group.id]
  apply_immediately      = true
  skip_final_snapshot    = true

  # Wait for RDS to be fully ready before proceeding
  provisioner "local-exec" {
    command = <<-EOT
      echo "Waiting for RDS to be fully available..."
      sleep 60
    EOT
  }
}


resource "aws_db_parameter_group" "pg_parameter_group" {
  #name   = "${var.prefix}-rds-pg-debezium-${random_id.env_display_id.hex}"
  name   = "${var.prefix}-rds-pg-debezium"
  family = "postgres16"

  parameter {
    apply_method = "pending-reboot"
    name  = "rds.logical_replication"
    value = 1
  }
}

resource "docker_image" "postgres_client" {
  name = "public.ecr.aws/docker/library/postgres:16"
}

# Initialize the database tables using a short-lived Docker container (no local psql needed)
resource "docker_container" "psql_init" {
  #name      = "psql-init-${random_id.env_display_id.hex}"
  name      = "psql-init-ls-retail"
  image     = docker_image.postgres_client.name
  must_run  = false
  env       = [
    "PGPASSWORD=${var.db_password}"
  ]
  command   = [
    "sh","-c",
    <<-EOC
    psql -h ${aws_db_instance.postgres_db.address} -p ${aws_db_instance.postgres_db.port} -U ${aws_db_instance.postgres_db.username} -d ${aws_db_instance.postgres_db.db_name} -c "
    CREATE TABLE IF NOT EXISTS products (
        ProductID INT PRIMARY KEY,
        Brand VARCHAR(255) NOT NULL,
        ProductName VARCHAR(255) NOT NULL,
        Category VARCHAR(100) NOT NULL,
        Description TEXT,
        Color VARCHAR(50),
        Size VARCHAR(50),
        Price DECIMAL(10, 2) NOT NULL,
        Stock INT NOT NULL
    );";
    psql -h ${aws_db_instance.postgres_db.address} -p ${aws_db_instance.postgres_db.port} -U ${aws_db_instance.postgres_db.username} -d ${aws_db_instance.postgres_db.db_name} -c "
    CREATE TABLE IF NOT EXISTS customers (
        CustomerID INT PRIMARY KEY,
        CustomerName VARCHAR(255) NOT NULL,
        Email VARCHAR(255) NOT NULL UNIQUE,
        Segment VARCHAR(50) NOT NULL,
        shipping_address_id VARCHAR(255) NOT NULL,
        billing_address_id VARCHAR(255) NOT NULL
    );";
    psql -h ${aws_db_instance.postgres_db.address} -p ${aws_db_instance.postgres_db.port} -U ${aws_db_instance.postgres_db.username} -d ${aws_db_instance.postgres_db.db_name} -c "
    CREATE TABLE IF NOT EXISTS addresses (
        AddressID VARCHAR(255) PRIMARY KEY,
        Street VARCHAR(255) NOT NULL,
        City VARCHAR(255) NOT NULL UNIQUE,
        State VARCHAR(50) NOT NULL,
        PostalCode VARCHAR(255) NOT NULL,
        Country VARCHAR(255) NOT NULL
    );";
    psql -h ${aws_db_instance.postgres_db.address} -p ${aws_db_instance.postgres_db.port} -U ${aws_db_instance.postgres_db.username} -d ${aws_db_instance.postgres_db.db_name} -c "
    CREATE TABLE IF NOT EXISTS orders (
        OrderID INT PRIMARY KEY,
        CustomerID INT NOT NULL,
        OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        Status VARCHAR(50) NOT NULL,
        FOREIGN KEY (CustomerID) REFERENCES customers(CustomerID)
    );";
    psql "postgresql://${aws_db_instance.postgres_db.username}:${var.db_password}@${aws_db_instance.postgres_db.address}:${aws_db_instance.postgres_db.port}/${aws_db_instance.postgres_db.db_name}" -c "
    CREATE TABLE IF NOT EXISTS order_items (
        OrderItemID INT PRIMARY KEY,
        OrderID INT NOT NULL,
        ProductID INT NOT NULL,
        Quantity INT NOT NULL,
        FOREIGN KEY (OrderID) REFERENCES orders(OrderID),
        FOREIGN KEY (ProductID) REFERENCES products(ProductID)
    );"
    EOC
  ]
  depends_on = [aws_db_instance.postgres_db]
}


# ------------------------------------------------------
# KMS Key for CSFLE
# ------------------------------------------------------
# NOTE: KMS key has been moved to modules/retail_stack/main.tf
#       It is now created conditionally when retail demo is enabled.
#       This avoids circular dependencies between the KMS key policy
#       (which needs the IAM user ARN) and the retail_stack module
#       (which needs the KMS key ARN).

data "aws_caller_identity" "current" {}




locals {
  #tableflow_iam_role_name = "${var.prefix}-tableflow-role-${random_id.env_display_id.hex}"
  #tableflow_bucket_name   = "${var.prefix}-tableflow-bucket-${random_id.env_display_id.hex}"
  tableflow_iam_role_name = "${var.prefix}-tableflow-role"
  tableflow_bucket_name   = "${var.prefix}-tableflow-bucket"
  customer_s3_access_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.tableflow_iam_role_name}"

}

module "aws_s3_bucket" {
  source        = "./modules/aws_s3_bucket"
  bucket_name = local.tableflow_bucket_name
}

module "provider_integration" {
  source            = "./modules/provider_integration"
  environment_id    = confluent_environment.staging.id
  customer_role_arn = local.customer_s3_access_role_arn
  depends_on        = [confluent_environment.staging, module.aws_s3_bucket, confluent_kafka_cluster.standard]
}


# creates IAM role for Tableflow Provider Integration
module "aws_iam_role" {
  source                           = "./modules/aws_iam_role"
  customer_role_name               = local.tableflow_iam_role_name
  s3_bucket_name                   = local.tableflow_bucket_name
  provider_integration_role_arn    = module.provider_integration.confluent_iam_role_arn
  provider_integration_external_id = module.provider_integration.provider_integration_external_id
  random_suffix                    = random_id.env_display_id.hex
  aws_account_id                   = data.aws_caller_identity.current.account_id
}
