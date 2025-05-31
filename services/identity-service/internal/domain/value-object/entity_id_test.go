//go:build unit
// +build unit

package vo_test

import (
	"testing"

	"github.com/stretchr/testify/suite"
	vo "services/identity-service/internal/domain/value-object"
)

type EntityIDTestSuite struct {
	suite.Suite
}

func TestEntityIDTestSuite(t *testing.T) {
	suite.Run(t, new(EntityIDTestSuite))
}

func (s *EntityIDTestSuite) TestIdentityID_NewIdentityID() {
	data := map[string]interface{}{
		"username": "user1",
		"email":    "user1@example.com",
	}

	id, err := vo.NewIdentityID(data)
	s.Require().NoError(err)
	s.NotEmpty(id.String())
}

func (s *EntityIDTestSuite) TestGroupID_NewGroupID() {
	data := map[string]interface{}{
		"group_name": "admins",
	}

	id, err := vo.NewGroupID(data)
	s.Require().NoError(err)
	s.NotEmpty(id.String())
}

func (s *EntityIDTestSuite) TestRoleID_NewRoleID() {
	id, err := vo.NewRoleID("viewer")
	s.Require().NoError(err)
	s.NotEmpty(id.String())
}
