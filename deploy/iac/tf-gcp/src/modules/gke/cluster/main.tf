resource "google_container_cluster" "gke" {
  name                     = var.cluster_name
  location                 = var.gcp_location
  remove_default_node_pool = true
  initial_node_count       = 1
  network                  = var.vpc_self_link
  subnetwork               = var.subnet_private_self_link
  networking_mode          = "VPC_NATIVE"

  deletion_protection = false

  addons_config {
    http_load_balancing {
      disabled = true
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
  }

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "k8s-pods"
    services_secondary_range_name = "k8s-services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "192.168.0.0/28"
  }
}
