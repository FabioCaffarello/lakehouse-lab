terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.31.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "2.17.0"
    }
  }
}
