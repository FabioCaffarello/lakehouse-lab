package seeder

import (
	"services/api-gateway/internal/entity"
)

type PermissionSeeder struct {
	Method entity.HTTPMethod
	Path   string
}

func NewPermissionSeeder(method entity.HTTPMethod, path string) *PermissionSeeder {
	return &PermissionSeeder{
		Method: method,
		Path:   path,
	}
}

func (s *PermissionSeeder) BuildHashMap() map[string]interface{} {
	return map[string]interface{}{
		"method": s.Method,
		"path":   s.Path,
	}
}

func (s *PermissionSeeder) Build() (*entity.Permission, error) {
	return entity.NewPermission(s.Method, s.Path)
}
