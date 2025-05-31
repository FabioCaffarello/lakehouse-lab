package seeder

import (
	"errors"

	"services/identity-service/internal/domain/entity"
	vo "services/identity-service/internal/domain/value-object"
)

type RoleSeeder struct {
	name        string
	description string
	permissions []*vo.Permission
}

func NewRoleSeeder() *RoleSeeder {
	readPermission, _ := vo.NewPermission(vo.MethodGet, "/default-path")
	return &RoleSeeder{
		name:        "default-role",
		description: "Default role description",
		permissions: []*vo.Permission{readPermission},
	}
}

func (s *RoleSeeder) WithName(name string) *RoleSeeder {
	s.name = name
	return s
}

func (s *RoleSeeder) WithDescription(description string) *RoleSeeder {
	s.description = description
	return s
}

func (s *RoleSeeder) WithPermissions(permissions ...*vo.Permission) *RoleSeeder {
	for _, p := range permissions {
		if p == nil {
			continue
		}
		s.permissions = append(s.permissions, p)
	}
	return s
}

func (s *RoleSeeder) Seed() (*entity.Role, error) {
	if s.name == "" {
		return nil, errors.New("role name cannot be empty")
	}

	if len(s.permissions) == 0 {
		readPermission, _ := vo.NewPermission(vo.MethodGet, "/default-path")
		s.permissions = []*vo.Permission{readPermission}
	}

	role, err := entity.NewRole(s.name, s.description, s.permissions...)
	if err != nil {
		return nil, err
	}

	return role, nil
}
