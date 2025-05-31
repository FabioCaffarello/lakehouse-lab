//go:build unit
// +build unit

package vo_test

import (
	"testing"

	"github.com/stretchr/testify/suite"
	vo "services/identity-service/internal/domain/value-object"
)

type PermissionTestSuite struct {
	suite.Suite
}

func TestPermissionTestSuite(t *testing.T) {
	suite.Run(t, new(PermissionTestSuite))
}

func (s *PermissionTestSuite) TestNewPermission_Valid() {
	perm, err := vo.NewPermission(vo.MethodGet, "/users")
	s.NoError(err)
	s.NotNil(perm)
	s.Equal(vo.MethodGet, perm.Method())
	s.Equal("/users", perm.Path())
}

func (s *PermissionTestSuite) TestNewPermission_InvalidMethod() {
	perm, err := vo.NewPermission("INVALID", "/users")
	s.Error(err)
	s.Nil(perm)
}

func (s *PermissionTestSuite) TestNewPermission_EmptyPath() {
	perm, err := vo.NewPermission(vo.MethodGet, "")
	s.Error(err)
	s.Nil(perm)
}

func (s *PermissionTestSuite) TestAllows_ExactPath() {
	perm, _ := vo.NewPermission(vo.MethodGet, "/users")
	s.True(perm.Allows(vo.MethodGet, "/users"))
	s.False(perm.Allows(vo.MethodPost, "/users"))
	s.False(perm.Allows(vo.MethodGet, "/users/123"))
}

func (s *PermissionTestSuite) TestAllows_WildcardPath() {
	perm, _ := vo.NewPermission(vo.MethodGet, "/users/*")
	s.True(perm.Allows(vo.MethodGet, "/users/123"))
	s.True(perm.Allows(vo.MethodGet, "/users/abc/xyz"))
	s.False(perm.Allows(vo.MethodPost, "/users/123"))
	s.False(perm.Allows(vo.MethodGet, "/posts/123"))
}

func (s *PermissionTestSuite) TestEquals() {
	perm1, _ := vo.NewPermission(vo.MethodGet, "/users")
	perm2, _ := vo.NewPermission(vo.MethodGet, "/users")
	perm3, _ := vo.NewPermission(vo.MethodPost, "/users")
	perm4, _ := vo.NewPermission(vo.MethodGet, "/users/123")

	s.True(perm1.Equals(perm2))
	s.False(perm1.Equals(perm3))
	s.False(perm1.Equals(perm4))
	s.False(perm1.Equals(nil))
}
