variable "cluster_name" {
  description = "The name of the minikube cluster"
  type        = string
}

variable "nodes" {
  description = "The number of nodes in the minikube cluster"
  type        = number
}
