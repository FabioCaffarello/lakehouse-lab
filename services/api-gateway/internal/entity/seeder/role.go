package seeder

import (
	"fmt"
	"services/api-gateway/internal/entity"
)

type RoleSeeder struct {
	Name        string
	Description string
	Permissions []*PermissionSeeder
}

func NewRoleSeeder(name string) *RoleSeeder {
	return &RoleSeeder{
		Name: name,
	}
}

func (s *RoleSeeder) WithDescription(desc string) *RoleSeeder {
	s.Description = desc
	return s
}

func (s *RoleSeeder) WithPermissions(p ...*PermissionSeeder) *RoleSeeder {
	s.Permissions = append(s.Permissions, p...)
	return s
}

func (s *RoleSeeder) BuildHashMap() map[string]interface{} {
	perms := make([]map[string]interface{}, len(s.Permissions))
	for i, builder := range s.Permissions {
		perms[i] = builder.BuildHashMap()
	}
	return map[string]interface{}{
		"name":        s.Name,
		"description": s.Description,
		"permissions": perms,
	}
}

func (s *RoleSeeder) BuildEntity() (*entity.Role, error) {
	raw := s.BuildHashMap()
	role := &entity.Role{}
	if err := role.FromHashMap(raw); err != nil {
		return nil, fmt.Errorf("failed to build role: %w", err)
	}
	return role, nil
}
