//go:build integration
// +build integration

package repository_test

import (
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"libs/golang/common/log"
	"libs/golang/common/resources/go-mongo"
	"services/identity-service/internal/domain/entity/seeder"
	vo "services/identity-service/internal/domain/value-object"
	"services/identity-service/internal/infra/database/repository"
	"testing"
	"time"
)

type GroupRepositoryIntegrationTestSuite struct {
	suite.Suite
	client     *gomongo.Client
	database   string
	collection string
	repo       *repository.GroupRepository
	logger     log.Log
}

func (suite *GroupRepositoryIntegrationTestSuite) SetupSuite() {
	mongoURI := "mongodb://user:password@mongo:27017"
	client, err := gomongo.New(mongoURI)
	suite.Require().NoError(err)

	serviceName := "repository-test"
	logLevel := log.InfoLevel
	logFormat := log.JSONFormat
	version := "No version provided"

	logger, err := log.InitializeLogger(serviceName, version, logLevel, logFormat)
	suite.Require().NoError(err, "Failed to initialize logger")
	suite.logger = logger

	suite.client = client
	suite.database = "test_db"
	suite.collection = "roles"
	suite.repo = repository.NewGroupRepository(suite.logger, suite.client, suite.database, suite.collection)
}

func (suite *GroupRepositoryIntegrationTestSuite) SetupTest() {
	err := suite.client.CreateIndex(suite.database, suite.collection, []map[string]interface{}{
		{"field": "_id", "order": 1},
	})
	suite.Require().NoError(err, "Failed to create required indexes")

	time.Sleep(500 * time.Millisecond)

	// Verify index creation
	indexes, err := suite.client.GetIndexes(suite.database, suite.collection)
	suite.Require().NoError(err, "Failed to fetch indexes")
	suite.Require().NotEmpty(indexes, "Indexes should exist but none found")
}

func (suite *GroupRepositoryIntegrationTestSuite) TearDownTest() {
	suite.NoError(suite.client.RemoveAll(suite.database, suite.collection))
}

func (suite *GroupRepositoryIntegrationTestSuite) TearDownSuite() {
	suite.NoError(suite.client.Disconnect())
}

func TestGroupRepositoryIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(GroupRepositoryIntegrationTestSuite))
}

func (suite *GroupRepositoryIntegrationTestSuite) TestSaveGroup() {
	permission1, err := vo.NewPermission(vo.MethodGet, "/admin")
	suite.Require().NoError(err, "Failed to create permission1")
	permission2, err := vo.NewPermission(vo.MethodPost, "/admin")
	suite.Require().NoError(err, "Failed to create permission2")
	role1, err := vo.NewRoleID("admin")
	seeder := seeder.NewGroupSeeder().
		WithName("admins").
		WithPermissions(permission1, permission2).
		WithDescription("Administrators group").
		WithRoles(role1)

	group, err := seeder.Seed()
	suite.Require().NoError(err, "Failed to seed group")

	err = suite.repo.Save(group)
	suite.Require().NoError(err, "Failed to save group")
}

func (suite *GroupRepositoryIntegrationTestSuite) TestFindByID() {
	permission1, err := vo.NewPermission(vo.MethodGet, "/admin")
	suite.Require().NoError(err, "Failed to create permission1")
	role1, err := vo.NewRoleID("admin")
	seeder := seeder.NewGroupSeeder().
		WithName("admins").
		WithPermissions(permission1).
		WithDescription("Administrators group").
		WithRoles(role1)

	group, err := seeder.Seed()
	suite.Require().NoError(err, "Failed to seed group")

	err = suite.repo.Save(group)
	suite.Require().NoError(err, "Failed to save group")

	foundGroup, err := suite.repo.FindByID(group.GetID())
	suite.Require().NoError(err, "Failed to find group by ID")
	// assert.True(suite.T(), group.GetID().Equals(foundGroup.GetID()), "Found group ID should match saved group ID")
	assert.Equal(suite.T(), group.GetID().String(), foundGroup.GetID().String(), "Found group ID should match saved group ID")
}

func (suite *GroupRepositoryIntegrationTestSuite) TestFindByID_NotFound() {
	nonExistentID, err := vo.NewGroupID(map[string]interface{}{
		"group_name": "non-existent-group",
	})
	suite.Require().NoError(err, "Failed to create non-existent group ID")

	foundGroup, err := suite.repo.FindByID(nonExistentID)
	suite.Require().NoError(err, "Finding non-existent group should not return an error")
	assert.Nil(suite.T(), foundGroup, "Found group should be nil for non-existent ID")
}

func (suite *GroupRepositoryIntegrationTestSuite) TestFindAll() {
	permission1, err := vo.NewPermission(vo.MethodGet, "/admin")
	suite.Require().NoError(err, "Failed to create permission1")
	role1, err := vo.NewRoleID("admin")
	seeder := seeder.NewGroupSeeder().
		WithName("admins").
		WithPermissions(permission1).
		WithDescription("Administrators group").
		WithRoles(role1)

	group, err := seeder.Seed()
	suite.Require().NoError(err, "Failed to seed group")

	err = suite.repo.Save(group)
	suite.Require().NoError(err, "Failed to save group")

	groups, err := suite.repo.FindAll()
	suite.Require().NoError(err, "Failed to find all groups")
	assert.NotEmpty(suite.T(), groups, "Groups should not be empty")
	assert.Equal(suite.T(), 1, len(groups), "Should find exactly one group")
}

func (suite *GroupRepositoryIntegrationTestSuite) TestDeleteGroup() {
	permission1, err := vo.NewPermission(vo.MethodGet, "/admin")
	suite.Require().NoError(err, "Failed to create permission1")
	role1, err := vo.NewRoleID("admin")
	seeder := seeder.NewGroupSeeder().
		WithName("admins").
		WithPermissions(permission1).
		WithDescription("Administrators group").
		WithRoles(role1)

	group, err := seeder.Seed()
	suite.Require().NoError(err, "Failed to seed group")

	err = suite.repo.Save(group)
	suite.Require().NoError(err, "Failed to save group")

	err = suite.repo.DeleteByID(group.GetID())
	suite.Require().NoError(err, "Failed to delete group")

	foundGroup, err := suite.repo.FindByID(group.GetID())
	suite.Require().NoError(err, "Finding deleted group should not return an error")
	assert.Nil(suite.T(), foundGroup, "Found group should be nil after deletion")
}
