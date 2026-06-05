variable "email" {
  description = "Your email to tag all AWS resources"
  type        = string
}


variable "prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "shiftleft"
}

variable "cloud_region"{
  description = "AWS Cloud Region"
  type        = string
  default     = "us-east-1"    
}

variable "db_username"{
  description = "Postgres DB username"
  type        = string
  default     = "postgres"  
}

variable "db_password"{
  description = "Postgres DB password"
  type        = string
  default     = "Admin123456!!"  
}


variable "confluent_cloud_api_key"{
    description = "Confluent Cloud API Key"
    type        = string
}

variable "confluent_cloud_api_secret"{
    description = "Confluent Cloud API Secret"
    type        = string     
}

variable "data_warehouse" {
  description = "Type of data warehouse to use (either 'redshift' or 'snowflake')"
  type        = string
  default     = "none"
  validation {
    condition     = contains(["redshift", "snowflake", "none"], var.data_warehouse)
    error_message = "The data_warehouse variable must be either 'redshift', 'snowflake' or 'none'."
  }
}

variable "snowflake_account" {
  description = "Snowflake account identifier"
  type        = string
  default     = "redshift_selected"
}

variable "snowflake_username" {
  description = "Snowflake username"
  type        = string
  default     = ""
}

variable "snowflake_password" {
  description = "Snowflake password"
  type        = string
  default     = ""
}

variable "stop_flink_statements" {
  description = "Stop all Flink statements (set to true before destroying to avoid errors)"
  type        = bool
  default     = false
}

# ------------------------------------------------------
# Demo Feature Flags
# ------------------------------------------------------

variable "enable_retail_demo" {
  description = "Enable retail demo (DB feeder, Payments app, retail analytics)"
  type        = bool
  default     = false
}

variable "enable_scada_demo" {
  description = "Enable SCADA energy grid demo (SCADA simulator, energy analytics)"
  type        = bool
  default     = false
}

variable "enable_smartcity_demo" {
  description = "Enable Smart City Madrid demo (traffic, air quality, EMT buses, citizen services)"
  type        = bool
  default     = false
}

variable "twingate_ip" {
  description = "Twingate IP address for database access (optional, leave empty if not using Twingate)"
  type        = string
  default     = ""
}
