provider "minikube" {}

provider "helm" {
  kubernetes {
    host                   = module.local-k8s.cluster_host
    client_certificate     = module.local-k8s.cluster_client_certificate
    client_key             = module.local-k8s.cluster_client_key
    cluster_ca_certificate = module.local-k8s.cluster_ca_certificate
  }
}
