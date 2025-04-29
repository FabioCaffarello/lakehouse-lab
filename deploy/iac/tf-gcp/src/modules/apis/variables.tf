variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
  nullable    = false
}

variable "enabled_apis" {
  description = "The APIs to enable for the GCP project"
  type        = list(string)
  default = [
    "serviceusage.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "container.googleapis.com",
    "logging.googleapis.com",
    "secretmanager.googleapis.com"
  ]
}
