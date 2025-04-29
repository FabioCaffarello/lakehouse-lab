module "cluster" {
  source                   = "./cluster"
  project_id               = var.project_id
  gcp_location             = var.gcp_location
  cluster_name             = var.cluster_name
  vpc_self_link            = var.vpc_self_link
  subnet_private_self_link = var.subnet_private_self_link
}

module "node-pool" {
  source                   = "./node-pool"
  project_id               = var.project_id
  cluster_gke_id           = module.cluster.gke_cluster_id
  vpc_self_link            = var.vpc_self_link
  subnet_private_self_link = var.subnet_private_self_link
  machine_type             = var.machine_type
}
