output "gke_cluster_id" {
  description = "The GKE cluster ID"
  value       = google_container_cluster.gke.id
}

output "gke_cluster_self_link" {
  description = "Self link do cluster GKE"
  value       = google_container_cluster.gke.self_link
}

output "gke_cluster_endpoint" {
  description = "Endpoint do API server do GKE"
  value       = google_container_cluster.gke.endpoint
}

output "client_certificate" {
  description = "Certificado do cliente do GKE"
  value       = google_container_cluster.gke.master_auth[0].client_certificate
}

output "client_key" {
  description = "Chave do cliente do GKE"
  value       = google_container_cluster.gke.master_auth[0].client_key
}

output "cluster_ca_certificate" {
  description = "Certificado CA do cluster GKE"
  value       = google_container_cluster.gke.master_auth[0].cluster_ca_certificate
}
