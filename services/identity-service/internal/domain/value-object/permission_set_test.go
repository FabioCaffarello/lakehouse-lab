//go:build unit
// +build unit

package vo_test

import (
	"testing"

	"github.com/stretchr/testify/suite"
	vo "services/identity-service/internal/domain/value-object"
)

type PermissionSetTestSuite struct {
	suite.Suite
	getUsers     *vo.Permission
	postUsers    *vo.Permission
	getUsersWild *vo.Permission
	getProducts  *vo.Permission
}

func TestPermissionSetTestSuite(t *testing.T) {
	suite.Run(t, new(PermissionSetTestSuite))
}

func (s *PermissionSetTestSuite) SetupSuite() {
	var err error
	s.getUsers, err = vo.NewPermission(vo.MethodGet, "/users")
	s.Require().NoError(err)

	s.postUsers, err = vo.NewPermission(vo.MethodPost, "/users")
	s.Require().NoError(err)

	s.getUsersWild, err = vo.NewPermission(vo.MethodGet, "/users/*")
	s.Require().NoError(err)

	s.getProducts, err = vo.NewPermission(vo.MethodGet, "/products")
	s.Require().NoError(err)
}

func (s *PermissionSetTestSuite) TestNewPermissionSet() {
	ps := vo.NewPermissionSet(s.getUsers, s.postUsers)
	s.True(ps.Allows(vo.MethodGet, "/users"))
	s.True(ps.Allows(vo.MethodPost, "/users"))
	s.False(ps.Allows(vo.MethodGet, "/products"))
}

func (s *PermissionSetTestSuite) TestAdd() {
	ps := vo.NewPermissionSet()
	ps.Add(s.getProducts)

	s.True(ps.Allows(vo.MethodGet, "/products"))
}

func (s *PermissionSetTestSuite) TestRemove() {
	ps := vo.NewPermissionSet(s.getUsers)
	ps.Remove(s.getUsers)

	s.False(ps.Allows(vo.MethodGet, "/users"))
}

func (s *PermissionSetTestSuite) TestAllows_WithWildcard() {
	ps := vo.NewPermissionSet(s.getUsersWild)

	s.True(ps.Allows(vo.MethodGet, "/users/123"))
	s.True(ps.Allows(vo.MethodGet, "/users/abc/xyz"))
	s.False(ps.Allows(vo.MethodGet, "/products"))
}

func (s *PermissionSetTestSuite) TestUnion() {
	left := vo.NewPermissionSet(s.getUsers)
	right := vo.NewPermissionSet(s.postUsers, s.getProducts)

	union := left.Union(right)

	s.True(union.Allows(vo.MethodGet, "/users"))
	s.True(union.Allows(vo.MethodPost, "/users"))
	s.True(union.Allows(vo.MethodGet, "/products"))
}

func (s *PermissionSetTestSuite) TestPointerIdentityUniqueness() {
	clone, _ := vo.NewPermission(vo.MethodGet, "/users")

	ps := vo.NewPermissionSet(s.getUsers)
	ps.Add(clone)

	s.True(ps.Allows(vo.MethodGet, "/users"))
}
