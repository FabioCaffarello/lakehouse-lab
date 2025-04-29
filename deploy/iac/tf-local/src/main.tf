module "local-k8s" {
  source       = "./modules/minikube"
  cluster_name = var.cluster_name
  nodes        = var.nodes
}

module "argocd" {
  source = "./modules/helm/argocd"
}
