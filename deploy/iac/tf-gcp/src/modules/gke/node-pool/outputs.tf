output "node_pool_id" {
  description = "ID do node pool"
  value       = google_container_node_pool.general.id
}

output "node_pool_name" {
  description = "Nome do node pool"
  value       = google_container_node_pool.general.name
}
