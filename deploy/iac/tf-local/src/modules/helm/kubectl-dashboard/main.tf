
resource "kubernetes_namespace" "dashboard" {
  metadata {
    name = var.namespace
  }
}

resource "kubernetes_service_account" "admin_user" {
  metadata {
    name      = "admin-user"
    namespace = kubernetes_namespace.dashboard.metadata[0].name
  }
}

resource "kubernetes_cluster_role_binding" "admin_user_binding" {
  metadata {
    name = "admin-user"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = "cluster-admin"
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.admin_user.metadata[0].name
    namespace = kubernetes_service_account.admin_user.metadata[0].namespace
  }
}
