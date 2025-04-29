output "node_pool_id" {
  description = "ID do node pool"
  value       = module.cluster.gke_cluster_id
}

output "node_pool_name" {
  description = "Nome do node pool"
  value       = module.node-pool.node_pool_name
}

output "gke_cluster_endpoint" {
  description = "Endpoint do API server do GKE"
  value       = module.cluster.gke_cluster_endpoint
}

output "client_certificate" {
  description = "Certificado do cliente do GKE"
  value       = module.cluster.client_certificate
}

output "client_key" {
  description = "Chave do cliente do GKE"
  value       = module.cluster.client_key
}

output "cluster_ca_certificate" {
  description = "Certificado CA do cluster GKE"
  value       = module.cluster.cluster_ca_certificate
}
