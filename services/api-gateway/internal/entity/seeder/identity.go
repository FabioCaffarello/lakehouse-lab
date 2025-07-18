package seeder

import (
	"services/api-gateway/internal/entity"
)

type IdentitySeeder struct {
	Username         string
	Group            string
	AllowedProviders []string
	RoleIDs          []string
	Token            string
}

func NewIdentitySeeder(username, group string) *IdentitySeeder {
	return &IdentitySeeder{
		Username: username,
		Group:    group,
	}
}

func (s *IdentitySeeder) WithAllowedProviders(providers []string) *IdentitySeeder {
	s.AllowedProviders = providers
	return s
}

func (s *IdentitySeeder) WithRoleIDs(roleIDs []string) *IdentitySeeder {
	s.RoleIDs = roleIDs
	return s
}

func (s *IdentitySeeder) WithToken(token string) *IdentitySeeder {
	s.Token = token
	return s
}

func (s *IdentitySeeder) BuildHashMap() map[string]interface{} {
	id, _ := entity.GenerateIdentityID(s.Username, entity.NewIdentityGroup(s.Group))
	return map[string]interface{}{
		"_id":              id.String(),
		"username":         s.Username,
		"group":            s.Group,
		"allowedProviders": s.AllowedProviders,
		"roleIDs":          s.RoleIDs,
		"token":            s.Token,
	}
}

func (s *IdentitySeeder) BuildEntity() (*entity.Identity, error) {
	raw := s.BuildHashMap()
	identity := &entity.Identity{}
	if err := identity.FromHashMap(raw); err != nil {
		return nil, err
	}
	return identity, nil
}
