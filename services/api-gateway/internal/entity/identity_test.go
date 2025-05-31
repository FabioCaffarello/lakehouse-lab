//go:build unit
// +build unit

package entity_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"services/api-gateway/internal/entity"
)

type IdentityTestSuite struct {
	suite.Suite
}

func TestIdentityTestSuite(t *testing.T) {
	suite.Run(t, new(IdentityTestSuite))
}

func (s *IdentityTestSuite) TestNewIdentity_WithValidProps_CreatesIdentity() {
	props := &entity.IdentityProps{
		Username:         "bot-001",
		Group:            entity.GroupBot,
		AllowedProviders: []string{"internal"},
		RoleIDs:          []string{"role1", "role2"},
	}

	identity, err := entity.NewIdentity(props)

	assert.NoError(s.T(), err)
	assert.Equal(s.T(), props.Username, identity.Username)
	assert.Equal(s.T(), props.Group, identity.Group)
	assert.Len(s.T(), identity.AllowedProviders, 1)
	assert.NotEmpty(s.T(), identity.Token)
}

func (s *IdentityTestSuite) TestNewIdentity_WithEmptyUsername_ReturnsError() {
	props := &entity.IdentityProps{
		Username:         "",
		Group:            entity.GroupHuman,
		AllowedProviders: []string{"auth"},
	}
	identity, err := entity.NewIdentity(props)

	assert.Error(s.T(), err)
	assert.Nil(s.T(), identity)
}

func (s *IdentityTestSuite) TestNewIdentity_WithNilProviders_ReturnsError() {
	props := &entity.IdentityProps{
		Username:         "johndoe",
		Group:            entity.GroupHuman,
		AllowedProviders: nil,
	}
	identity, err := entity.NewIdentity(props)

	assert.Error(s.T(), err)
	assert.Nil(s.T(), identity)
}

func (s *IdentityTestSuite) TestRotateToken_RegeneratesToken() {
	props := &entity.IdentityProps{
		Username:         "rotate-test",
		Group:            entity.GroupService,
		AllowedProviders: []string{"api"},
	}

	identity, _ := entity.NewIdentity(props)
	oldToken := identity.Token

	err := identity.RotateToken()

	assert.NoError(s.T(), err)
	assert.NotEqual(s.T(), oldToken, identity.Token)
	assert.Len(s.T(), identity.Token, 43) // base64 32 bytes → 43 chars
}

func (s *IdentityTestSuite) TestHasRole_WhenRoleExists_ReturnsTrue() {
	identity := &entity.Identity{
		Username: "bot",
		RoleIDs:  []string{"admin", "analytics"},
	}
	assert.True(s.T(), identity.HasRole("admin"))
	assert.False(s.T(), identity.HasRole("guest"))
}

func (s *IdentityTestSuite) TestIsBot_WhenGroupIsBot_ReturnsTrue() {
	identity := &entity.Identity{
		Group: entity.GroupBot,
	}
	assert.True(s.T(), identity.IsBot())
}

func (s *IdentityTestSuite) TestToHashMap_SerializesCorrectly() {
	identity := &entity.Identity{
		ID:               "abc-123",
		Username:         "test",
		Group:            entity.GroupHuman,
		Token:            "key123",
		AllowedProviders: []string{"web"},
		RoleIDs:          []string{"role1"},
	}

	hash := identity.ToHashMap()
	assert.Equal(s.T(), "abc-123", hash["_id"])
	assert.Equal(s.T(), "test", hash["username"])
	assert.Equal(s.T(), "human", hash["group"])
	assert.Equal(s.T(), "key123", hash["token"])
	assert.ElementsMatch(s.T(), []string{"web"}, hash["allowedProviders"].([]string))
	assert.ElementsMatch(s.T(), []string{"role1"}, hash["roleIDs"].([]string))
}
