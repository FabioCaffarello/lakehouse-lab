variable "namespace" {
  description = "Namespace where the dashboard will be installed"
  type        = string
  default     = "kubernetes-dashboard"
}

variable "helm_values_path" {
  description = "Optional path to Helm values file"
  type        = string
  default     = ""
}

variable "dashboard_version" {
  description = "Dashboard Helm chart version"
  type        = string
  default     = "2.7.0"
}
