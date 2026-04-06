# ------------------------------------------------------
# Demo Stacks - Modular Deployment
# ------------------------------------------------------
# This file manages the conditional deployment of demo stacks
# using feature flags: enable_retail_demo and enable_scada_demo
# ------------------------------------------------------

locals {
  deploy_retail = var.enable_retail_demo
  deploy_scada  = var.enable_scada_demo
}

# ------------------------------------------------------
# Retail Stack Module
# ------------------------------------------------------

module "retail_stack" {
  count  = local.deploy_retail ? 1 : 0
  source = "./modules/retail_stack"

  # Basic Configuration
  prefix         = var.prefix
  env_display_id = random_id.env_display_id.hex
  cloud_region   = var.cloud_region
  cpu_architecture = local.cpu_architecture

  # VPC and Networking
  vpc_id            = aws_vpc.ecs_vpc.id
  subnet_id         = aws_subnet.public_subnet.id
  security_group_id = aws_security_group.ecs_sg.id

  # ECS Cluster
  ecs_cluster_id              = aws_ecs_cluster.ecs_cluster.id
  ecs_task_execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  ecs_container_role_arn      = aws_iam_role.ecs_container_role.arn

  # Database
  db_address  = aws_db_instance.postgres_db.address
  db_username = var.db_username
  db_password = var.db_password

  # Confluent Kafka
  kafka_cluster_id         = confluent_kafka_cluster.standard.id
  kafka_bootstrap_endpoint = confluent_kafka_cluster.standard.bootstrap_endpoint
  kafka_rest_endpoint      = confluent_kafka_cluster.standard.rest_endpoint
  kafka_api_key            = confluent_api_key.app-manager-kafka-api-key.id
  kafka_api_secret         = confluent_api_key.app-manager-kafka-api-key.secret

  # Schema Registry
  schema_registry_id            = data.confluent_schema_registry_cluster.sr-cluster.id
  schema_registry_rest_endpoint = data.confluent_schema_registry_cluster.sr-cluster.rest_endpoint
  schema_registry_api_key       = confluent_api_key.app-manager-schema-registry-api-key.id
  schema_registry_api_secret    = confluent_api_key.app-manager-schema-registry-api-key.secret

  # Confluent Environment
  confluent_environment_id     = confluent_environment.staging.id
  confluent_service_account_id = confluent_service_account.app-manager.id

  # Dependencies
  psql_init_container_id = docker_container.psql_init.id
}

# ------------------------------------------------------
# SCADA Stack Module (Placeholder)
# ------------------------------------------------------

module "scada_stack" {
  count  = local.deploy_scada ? 1 : 0
  source = "./modules/scada_stack"

  # Basic Configuration
  prefix         = var.prefix
  env_display_id = random_id.env_display_id.hex
  cloud_region   = var.cloud_region
  cpu_architecture = local.cpu_architecture

  # VPC and Networking
  vpc_id            = aws_vpc.ecs_vpc.id
  subnet_id         = aws_subnet.public_subnet.id
  security_group_id = aws_security_group.ecs_sg.id

  # ECS Cluster
  ecs_cluster_id              = aws_ecs_cluster.ecs_cluster.id
  ecs_task_execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  ecs_container_role_arn      = aws_iam_role.ecs_container_role.arn

  # Database
  db_address  = aws_db_instance.postgres_db.address
  db_username = var.db_username
  db_password = var.db_password

  # Confluent Kafka
  kafka_cluster_id         = confluent_kafka_cluster.standard.id
  kafka_bootstrap_endpoint = confluent_kafka_cluster.standard.bootstrap_endpoint
  kafka_rest_endpoint      = confluent_kafka_cluster.standard.rest_endpoint
  kafka_api_key            = confluent_api_key.app-manager-kafka-api-key.id
  kafka_api_secret         = confluent_api_key.app-manager-kafka-api-key.secret

  # Schema Registry
  schema_registry_id            = data.confluent_schema_registry_cluster.sr-cluster.id
  schema_registry_rest_endpoint = data.confluent_schema_registry_cluster.sr-cluster.rest_endpoint
  schema_registry_api_key       = confluent_api_key.app-manager-schema-registry-api-key.id
  schema_registry_api_secret    = confluent_api_key.app-manager-schema-registry-api-key.secret

  # Confluent Environment
  confluent_environment_id     = confluent_environment.staging.id
  confluent_service_account_id = confluent_service_account.app-manager.id
}

# ------------------------------------------------------
# Outputs from Demo Stacks
# ------------------------------------------------------

output "retail_stack_deployed" {
  description = "Whether retail stack is deployed"
  value       = local.deploy_retail
}

output "scada_stack_deployed" {
  description = "Whether SCADA stack is deployed"
  value       = local.deploy_scada
}

output "retail_stack_outputs" {
  description = "Outputs from retail stack module"
  value       = local.deploy_retail ? module.retail_stack[0] : null
}

output "scada_stack_outputs" {
  description = "Outputs from SCADA stack module"
  value       = local.deploy_scada ? module.scada_stack[0] : null
}

# ======================================================
# Flink Queries - Conditional Deployment
# ======================================================

# Retail Flink Queries (6 queries)
module "retail_flink_queries" {
  count  = local.deploy_retail ? 1 : 0
  source = "./modules/retail_flink_queries"

  organization_id     = data.confluent_organization.main.id
  environment_id      = confluent_environment.staging.id
  compute_pool_id     = confluent_flink_compute_pool.flinkpool-main.id
  kafka_cluster_id    = confluent_kafka_cluster.standard.id
  service_account_id  = confluent_service_account.app-manager.id
  flink_api_key       = confluent_api_key.app-manager-flink-api-key.id
  flink_api_secret    = confluent_api_key.app-manager-flink-api-key.secret
  flink_rest_endpoint = data.confluent_flink_region.demo_flink_region.rest_endpoint
  stop_statements     = var.stop_flink_statements
  queries_dir         = "../queries/retail"

  depends_on = [
    module.retail_stack,
    confluent_flink_compute_pool.flinkpool-main,
    confluent_api_key.app-manager-flink-api-key,
    time_sleep.wait_for_cdc_topics
  ]
}

# SCADA Flink Queries (5 queries)
module "scada_flink_queries" {
  count  = local.deploy_scada ? 1 : 0
  source = "./modules/scada_flink_queries"

  organization_id     = data.confluent_organization.main.id
  environment_id      = confluent_environment.staging.id
  compute_pool_id     = confluent_flink_compute_pool.flinkpool-main.id
  kafka_cluster_id    = confluent_kafka_cluster.standard.id
  service_account_id  = confluent_service_account.app-manager.id
  flink_api_key       = confluent_api_key.app-manager-flink-api-key.id
  flink_api_secret    = confluent_api_key.app-manager-flink-api-key.secret
  flink_rest_endpoint = data.confluent_flink_region.demo_flink_region.rest_endpoint
  stop_statements     = var.stop_flink_statements
  queries_dir         = "../queries/scada"

  depends_on = [
    module.scada_stack,
    confluent_flink_compute_pool.flinkpool-main,
    confluent_api_key.app-manager-flink-api-key
  ]
}
