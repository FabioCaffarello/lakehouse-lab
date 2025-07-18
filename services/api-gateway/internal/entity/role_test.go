//go:build unit
// +build unit

package entity_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"services/api-gateway/internal/entity"
)

type RoleTestSuite struct {
	suite.Suite
}

func TestRoleTestSuite(t *testing.T) {
	suite.Run(t, new(RoleTestSuite))
}

func (s *RoleTestSuite) TestNewRole_WithValidProps_ReturnsRole() {
	p, _ := entity.NewPermission(entity.MethodGet, "/captcha/solve")
	props := &entity.RoleProps{
		Name:        "captcha-reader",
		Description: "Allows reading captcha solutions",
		Permissions: []entity.Permission{*p},
	}

	role, err := entity.NewRole(props)

	assert.NoError(s.T(), err)
	assert.Equal(s.T(), props.Name, role.Name)
	assert.Equal(s.T(), 1, len(role.Permissions))
	assert.True(s.T(), role.HasPermission(*p))
}

func (s *RoleTestSuite) TestNewRole_WithEmptyName_ReturnsError() {
	props := &entity.RoleProps{
		Name:        "",
		Description: "No name role",
	}

	role, err := entity.NewRole(props)

	assert.Error(s.T(), err)
	assert.Nil(s.T(), role)
}

func (s *RoleTestSuite) TestAddPermission_AddsNewPermission() {
	p, _ := entity.NewPermission(entity.MethodPost, "/captcha/solve")
	role := &entity.Role{
		ID:          "role-1",
		Name:        "captcha-writer",
		Permissions: []entity.Permission{},
	}

	err := role.AddPermission(*p)
	assert.NoError(s.T(), err)
	assert.True(s.T(), role.HasPermission(*p))
}

func (s *RoleTestSuite) TestAddPermission_DuplicatePermission_ReturnsError() {
	p, _ := entity.NewPermission(entity.MethodPost, "/captcha/solve")
	role := &entity.Role{
		ID:          "role-1",
		Name:        "captcha-writer",
		Permissions: []entity.Permission{*p},
	}

	err := role.AddPermission(*p)
	assert.Error(s.T(), err)
}

func (s *RoleTestSuite) TestAllows_WithWildcardPermission_ReturnsTrue() {
	p, _ := entity.NewPermission(entity.MethodGet, "/proxy/*")
	role := &entity.Role{
		Name:        "proxy-reader",
		Permissions: []entity.Permission{*p},
	}

	assert.True(s.T(), role.Allows("/proxy/123", entity.MethodGet))
	assert.False(s.T(), role.Allows("/proxy", entity.MethodGet)) // depende da regra usada
}

func (s *RoleTestSuite) TestHasPermission_ReturnsTrueWhenPresent() {
	p, _ := entity.NewPermission(entity.MethodDelete, "/task")
	role := &entity.Role{
		Name:        "task-manager",
		Permissions: []entity.Permission{*p},
	}

	assert.True(s.T(), role.HasPermission(*p))
}

func (s *RoleTestSuite) TestAddPermission_EmptyPermission_ReturnsError() {
	role := &entity.Role{
		Name: "some-role",
	}
	err := role.AddPermission(entity.Permission{})
	assert.Error(s.T(), err)
}

func (s *RoleTestSuite) TestRoleID_String_Conversion() {
	id := entity.NewRoleID("abc-123")
	assert.Equal(s.T(), "abc-123", id.String())
}
