module "local-k8s" {
  source       = "./modules/minikube"
  cluster_name = var.cluster_name
  nodes        = var.nodes
}

module "argocd" {
  source = "./modules/helm/argocd"
}

module "dashboard" {
  source    = "./modules/helm/kubectl-dashboard"
  namespace = "kubernetes-dashboard"

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }
}
