package gomd5

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type GoMd5IdSuite struct {
	suite.Suite
}

func TestGoMd5IdSuite(t *testing.T) {
	suite.Run(t, new(GoMd5IdSuite))
}

func (suite *GoMd5IdSuite) TestMd5Hash() {
	id := md5Hash("test")
	assert.Equal(suite.T(), ID("098f6bcd4621d373cade4e832627b4f6"), id)
}

func (suite *GoMd5IdSuite) TestNewIDWithString() {
	id, err := NewID("test")
	assert.Equal(suite.T(), ID("098f6bcd4621d373cade4e832627b4f6"), id)
	assert.NoError(suite.T(), err)
}

func (suite *GoMd5IdSuite) TestNewIDWithFloat64() {
	id, err := NewID(123.456)
	assert.Equal(suite.T(), ID("f6e809317508ea1fdcb5e6d878e166ef"), id)
	assert.NoError(suite.T(), err)
}

func (suite *GoMd5IdSuite) TestNewIDWithMapStringInterface() {
	data := map[string]interface{}{
		"foo": "bar",
		"baz": 123,
	}
	id, err := NewID(data)
	assert.Equal(suite.T(), ID("7cc94a32929de9da271e6f19ef1392d7"), id)
	assert.NoError(suite.T(), err)
}

func (suite *GoMd5IdSuite) TestNewIDWithMapStringString() {
	data := map[string]string{
		"foo": "bar",
		"baz": "qux",
	}
	id, err := NewID(data)
	assert.Equal(suite.T(), ID("491ebd8bf73d6a9b2fabf44575e98fbe"), id)
	assert.NoError(suite.T(), err)
}

func (suite *GoMd5IdSuite) TestNewIDWithInt() {
	id, err := NewID(123)
	assert.Equal(suite.T(), ID("202cb962ac59075b964b07152d234b70"), id)
	assert.NoError(suite.T(), err)
}

func (suite *GoMd5IdSuite) TestNewIDWithBool() {
	id, err := NewID(true)
	assert.Equal(suite.T(), ID("b326b5062b2f0e69046810717534cb09"), id)
	assert.NoError(suite.T(), err)

	id, err = NewID(false)
	assert.Equal(suite.T(), ID("68934a3e9455fa72420237eb05902327"), id)
	assert.NoError(suite.T(), err)
}
