module "apis" {
  source     = "./modules/apis"
  project_id = var.project_id
}

module "network" {
  source     = "./modules/network"
  gcp_region = var.gcp_region
  depends_on = [module.apis]
}

module "gke" {
  source                   = "./modules/gke"
  project_id               = var.project_id
  gcp_location             = var.gcp_location
  cluster_name             = var.cluster_name
  vpc_self_link            = module.network.vpc_self_link
  subnet_private_self_link = module.network.subnet_private_self_link
  depends_on               = [module.network]
}
