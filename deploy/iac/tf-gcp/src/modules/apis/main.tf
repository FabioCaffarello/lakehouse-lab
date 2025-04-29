resource "google_project_service" "api" {
  for_each = toset(var.enabled_apis)
  service  = each.key
  project  = var.project_id

  disable_on_destroy = false
}
