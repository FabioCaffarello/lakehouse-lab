package seeder

import (
	"errors"

	"services/identity-service/internal/domain/entity"
	vo "services/identity-service/internal/domain/value-object"
)

type GroupSeeder struct {
	name        string
	description string
	roles       []*vo.RoleID
	permissions []*vo.Permission
}

func NewGroupSeeder() *GroupSeeder {
	readPermission, _ := vo.NewPermission(vo.MethodGet, "/default-path")
	return &GroupSeeder{
		name:        "default-group",
		description: "Default group description",
		roles:       []*vo.RoleID{},
		permissions: []*vo.Permission{readPermission},
	}
}

func (s *GroupSeeder) WithName(name string) *GroupSeeder {
	s.name = name
	return s
}

func (s *GroupSeeder) WithDescription(description string) *GroupSeeder {
	s.description = description
	return s
}

func (s *GroupSeeder) WithRoles(roles ...*vo.RoleID) *GroupSeeder {
	s.roles = append(s.roles, roles...)
	return s
}

func (s *GroupSeeder) WithPermissions(permissions ...*vo.Permission) *GroupSeeder {
	for _, p := range permissions {
		if p == nil {
			continue
		}
		s.permissions = append(s.permissions, p)
	}
	return s
}

func (s *GroupSeeder) Seed() (*entity.Group, error) {
	if s.name == "" {
		return nil, errors.New("group name cannot be empty")
	}

	if len(s.permissions) == 0 {
		readPermission, _ := vo.NewPermission(vo.MethodGet, "/default-path")
		s.permissions = []*vo.Permission{readPermission}
	}

	group, err := entity.NewGroup(s.name, s.description, s.roles, s.permissions...)
	if err != nil {
		return nil, err
	}

	return group, nil
}
