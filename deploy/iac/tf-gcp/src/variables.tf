variable "project_id" {
  description = "The GCP project ID"
  type        = string
  nullable    = false
}

variable "gcp_region" {
  description = "The GCP region to deploy the resources"
  type        = string
  nullable    = false
}

variable "gcp_location" {
  description = "The GCP location to deploy the resources"
  type        = string
  nullable    = false
}

variable "cluster_name" {
  description = "The name of the GKE cluster"
  type        = string
  nullable    = false
}

variable "machine_type" {
  description = "The machine type for the GKE cluster"
  type        = string
  default     = "e2-medium"
}
