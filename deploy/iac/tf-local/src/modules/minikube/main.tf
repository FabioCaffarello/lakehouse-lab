
resource "minikube_cluster" "minikube_docker" {
  provider     = minikube
  driver       = "docker"
  cluster_name = var.cluster_name
  nodes        = var.nodes
  addons = [
    "default-storageclass",
    "storage-provisioner"
  ]
}
