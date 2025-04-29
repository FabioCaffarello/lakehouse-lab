variable "project_id" {
  description = "The GCP project ID"
  type        = string
  nullable    = false
}

variable "cluster_gke_id" {
  description = "The GKE cluster ID"
  type        = string
  nullable    = false
}

variable "machine_type" {
  description = "The machine type for the GKE cluster"
  type        = string
  nullable    = false
}

variable "subnet_private_self_link" {
  description = "The self link of the private subnet"
  type        = string
  nullable    = false
}

variable "vpc_self_link" {
  description = "The self link of the VPC"
  type        = string
  nullable    = false
}
