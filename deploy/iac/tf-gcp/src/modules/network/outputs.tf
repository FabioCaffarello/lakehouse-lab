output "vpc_id" {
  description = "The ID of the VPC"
  value       = google_compute_network.vpc.id
}

output "public_subnet_id" {
  description = "The ID of the public subnet"
  value       = google_compute_subnetwork.public.id
}

output "private_subnet_id" {
  description = "The ID of the private subnet"
  value       = google_compute_subnetwork.private.id
}

output "nat_ip_address" {
  description = "The NAT IP address"
  value       = google_compute_address.nat.address
}

output "vpc_self_link" {
  description = "Self link da VPC criada"
  value       = google_compute_network.vpc.self_link
}

output "subnet_private_self_link" {
  description = "Self link da sub-rede privada (k8s)"
  value       = google_compute_subnetwork.private.self_link
}
