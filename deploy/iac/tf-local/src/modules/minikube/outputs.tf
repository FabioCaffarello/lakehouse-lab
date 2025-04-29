output "cluster_host" {
  description = "The host of the minikube cluster"
  value       = minikube_cluster.minikube_docker.host
}

output "cluster_client_certificate" {
  description = "The client certificate of the minikube cluster"
  value       = minikube_cluster.minikube_docker.client_certificate
}

output "cluster_client_key" {
  description = "The client key of the minikube cluster"
  value       = minikube_cluster.minikube_docker.client_key
}

output "cluster_ca_certificate" {
  description = "The CA certificate of the minikube cluster"
  value       = minikube_cluster.minikube_docker.cluster_ca_certificate
}
