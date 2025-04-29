data "google_client_config" "default" {}

provider "google" {
  project = var.project_id
  region  = var.gcp_region
}

provider "helm" {
  kubernetes {
    host                   = "https://${module.gke.gke_cluster_endpoint}"
    token                  = data.google_client_config.default.access_token
    client_certificate     = base64decode(module.gke.client_certificate)
    client_key             = base64decode(module.gke.client_key)
    cluster_ca_certificate = base64decode(module.gke.cluster_ca_certificate)
  }
}
