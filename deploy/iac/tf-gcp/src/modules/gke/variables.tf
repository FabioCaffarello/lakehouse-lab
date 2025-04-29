variable "project_id" {
  description = "The GCP project ID"
  type        = string
  nullable    = false
}

variable "gcp_location" {
  description = "The GCP location to deploy the resources"
  type        = string
  default     = "us-central1-a"
}

variable "cluster_name" {
  description = "The name of the GKE cluster"
  type        = string
  nullable    = false
}

variable "vpc_self_link" {
  description = "The self link of the VPC"
  type        = string
  nullable    = false
}

variable "subnet_private_self_link" {
  description = "The self link of the private subnet"
  type        = string
  nullable    = false
}

variable "machine_type" {
  description = "The machine type for the GKE cluster"
  type        = string
  default     = "e2-medium"
}
