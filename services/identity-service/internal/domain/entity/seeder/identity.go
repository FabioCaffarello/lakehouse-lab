package seeder

import (
	"errors"

	"services/identity-service/internal/domain/entity"
	vo "services/identity-service/internal/domain/value-object"
)

type IdentitySeeder struct {
	name     string
	pType    entity.PrincipalType
	groupIDs []*vo.GroupID
	roleIDs  []*vo.RoleID
	perms    []*vo.Permission
	token    vo.Token
}

func NewIdentitySeeder() *IdentitySeeder {
	return &IdentitySeeder{
		name:     "default-identity",
		pType:    entity.PrincipalHuman,
		groupIDs: []*vo.GroupID{},
		roleIDs:  []*vo.RoleID{},
		perms:    []*vo.Permission{},
	}
}

func (s *IdentitySeeder) WithName(name string) *IdentitySeeder {
	s.name = name
	return s
}

func (s *IdentitySeeder) WithType(pType entity.PrincipalType) *IdentitySeeder {
	s.pType = pType
	return s
}

func (s *IdentitySeeder) WithGroups(groups ...*vo.GroupID) *IdentitySeeder {
	s.groupIDs = append(s.groupIDs, groups...)
	return s
}

func (s *IdentitySeeder) WithRoles(roles ...*vo.RoleID) *IdentitySeeder {
	s.roleIDs = append(s.roleIDs, roles...)
	return s
}

func (s *IdentitySeeder) WithPermissions(perms ...*vo.Permission) *IdentitySeeder {
	for _, p := range perms {
		if p != nil {
			s.perms = append(s.perms, p)
		}
	}
	return s
}

func (s *IdentitySeeder) WithToken(token vo.Token) *IdentitySeeder {
	s.token.Equals(token)
	return s
}

func (s *IdentitySeeder) Seed() (*entity.Identity, error) {
	if s.name == "" {
		return nil, errors.New("identity name cannot be empty")
	}

	if s.pType == "" {
		return nil, errors.New("principal type cannot be empty")
	}

	identity, err := entity.NewIdentity(s.name, s.pType, s.groupIDs, s.roleIDs)
	if err != nil {
		return nil, err
	}

	for _, perm := range s.perms {
		identity.GrantPermission(perm)
	}

	if !s.token.IsExpired() {
		identity.SetToken(s.token)
	}

	return identity, nil
}
