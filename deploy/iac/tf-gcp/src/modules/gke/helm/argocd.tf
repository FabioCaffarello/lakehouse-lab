resource "helm_release" "argocd" {
  name             = "argocd"
  chart            = "argo-cd"
  repository       = "https://argoproj.github.io/argo-helm"
  namespace        = "argocd"
  create_namespace = "true"

  values = [
    <<EOF
        server:
          service:
            type: ClusterIP
        EOF
  ]
}
