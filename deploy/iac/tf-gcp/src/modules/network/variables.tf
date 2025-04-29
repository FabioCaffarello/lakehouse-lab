variable "gcp_region" {
  description = "The GCP region to deploy the resources"
  type        = string
  nullable    = false
}

variable "default_route_dest_range" {
  description = "The destination range for the default route"
  type        = string
  default     = "0.0.0.0/0"
}

variable "public_ip_cidr_range" {
  description = "The CIDR range for the public IP address"
  type        = string
  default     = "10.0.0.0/19"
}

variable "private_ip_cidr_range" {
  description = "The CIDR range for the private IP address"
  type        = string
  default     = "10.0.32.0/19"
}

variable "nat_ip_allocate_option" {
  description = "The IP allocation option for the NAT gateway"
  type        = string
  default     = "MANUAL_ONLY"
}
