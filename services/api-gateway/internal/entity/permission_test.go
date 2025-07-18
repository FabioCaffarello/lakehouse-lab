//go:build unit
// +build unit

package entity_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"services/api-gateway/internal/entity"
)

type PermissionTestSuite struct {
	suite.Suite
}

func TestPermissionTestSuite(t *testing.T) {
	suite.Run(t, new(PermissionTestSuite))
}

func (s *PermissionTestSuite) TestNewPermission_WithValidInput_ReturnsPermission() {
	p, err := entity.NewPermission(entity.MethodPost, "/captcha/solve")
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), entity.MethodPost, p.Method)
	assert.Equal(s.T(), "/captcha/solve", p.Path)
	assert.NotNil(s.T(), p.Regex)
}

func (s *PermissionTestSuite) TestNewPermission_WithInvalidMethod_ReturnsError() {
	p, err := entity.NewPermission("FOO", "/captcha/solve")
	assert.Error(s.T(), err)
	assert.Nil(s.T(), p)
}

func (s *PermissionTestSuite) TestNewPermission_WithWildcardPath_CompilesRegex() {
	p, err := entity.NewPermission(entity.MethodGet, "/proxy/*")
	assert.NoError(s.T(), err)
	assert.True(s.T(), p.Matches("/proxy/123", entity.MethodGet))
	assert.True(s.T(), p.Matches("/proxy/abc/def", entity.MethodGet))
	assert.False(s.T(), p.Matches("/proxy", entity.MethodGet)) // doesn't match exactly
}

func (s *PermissionTestSuite) TestMatches_ExactMatch_ReturnsTrue() {
	p, _ := entity.NewPermission(entity.MethodPost, "/captcha/solve")
	assert.True(s.T(), p.Matches("/captcha/solve", entity.MethodPost))
}

func (s *PermissionTestSuite) TestMatches_DifferentMethod_ReturnsFalse() {
	p, _ := entity.NewPermission(entity.MethodPost, "/captcha/solve")
	assert.False(s.T(), p.Matches("/captcha/solve", entity.MethodGet))
}

func (s *PermissionTestSuite) TestMatches_DifferentPath_ReturnsFalse() {
	p, _ := entity.NewPermission(entity.MethodPost, "/captcha/solve")
	assert.False(s.T(), p.Matches("/captcha/check", entity.MethodPost))
}

func (s *PermissionTestSuite) TestEquals_SameValues_ReturnsTrue() {
	p1 := entity.Permission{Path: "/captcha/solve", Method: entity.MethodPost}
	p2 := entity.Permission{Path: "/captcha/solve", Method: entity.MethodPost}
	assert.True(s.T(), p1.Equals(p2))
}

func (s *PermissionTestSuite) TestEquals_DifferentValues_ReturnsFalse() {
	p1 := entity.Permission{Path: "/captcha/solve", Method: entity.MethodPost}
	p2 := entity.Permission{Path: "/captcha/solve", Method: entity.MethodGet}
	assert.False(s.T(), p1.Equals(p2))
}

func (s *PermissionTestSuite) TestIsZero_WhenPathAndMethodAreEmpty_ReturnsTrue() {
	p := entity.Permission{}
	assert.True(s.T(), p.IsZero())
}

func (s *PermissionTestSuite) TestIsZero_WhenPathIsEmpty_ReturnsTrue() {
	p := entity.Permission{Method: entity.MethodGet}
	assert.True(s.T(), p.IsZero())
}

func (s *PermissionTestSuite) TestIsZero_WhenMethodIsEmpty_ReturnsTrue() {
	p := entity.Permission{Path: "/captcha"}
	assert.True(s.T(), p.IsZero())
}

func (s *PermissionTestSuite) TestIsZero_WhenPathAndMethodArePresent_ReturnsFalse() {
	p := entity.Permission{Path: "/captcha", Method: entity.MethodGet}
	assert.False(s.T(), p.IsZero())
}

func (s *PermissionTestSuite) TestToHashMap_ReturnsCorrectMap() {
	p := entity.Permission{Path: "/captcha", Method: entity.MethodPost}
	hash := p.ToHashMap()

	assert.Equal(s.T(), "/captcha", hash["path"])
	assert.Equal(s.T(), entity.MethodPost, hash["method"])
}

func (s *PermissionTestSuite) TestFromHashMap_WithValidMap_PopulatesFields() {
	data := map[string]interface{}{
		"path":   "/captcha",
		"method": "POST",
	}
	var p entity.Permission
	err := p.FromHashMap(data)

	assert.NoError(s.T(), err)
	assert.Equal(s.T(), "/captcha", p.Path)
	assert.Equal(s.T(), entity.MethodPost, p.Method)
}

func (s *PermissionTestSuite) TestFromHashMap_WithInvalidMethod_ReturnsError() {
	data := map[string]interface{}{
		"path":   "/captcha",
		"method": "INVALID",
	}
	var p entity.Permission
	err := p.FromHashMap(data)

	assert.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "invalid HTTP method")
}

func (s *PermissionTestSuite) TestFromHashMap_WithMissingPath_ReturnsError() {
	data := map[string]interface{}{
		"method": "GET",
	}
	var p entity.Permission
	err := p.FromHashMap(data)

	assert.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "path must be a string")
}

func (s *PermissionTestSuite) TestFromHashMap_WithMissingMethod_ReturnsError() {
	data := map[string]interface{}{
		"path": "/some",
	}
	var p entity.Permission
	err := p.FromHashMap(data)

	assert.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "method must be a string")
}
