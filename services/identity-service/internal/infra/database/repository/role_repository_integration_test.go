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

type RoleRepositoryIntegrationTestSuite struct {
	suite.Suite
	client     *gomongo.Client
	database   string
	collection string
	repo       *repository.RoleRepository
	logger     log.Log
}

func (suite *RoleRepositoryIntegrationTestSuite) SetupSuite() {
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
	suite.repo = repository.NewRoleRepository(suite.logger, suite.client, suite.database, suite.collection)
}

func (suite *RoleRepositoryIntegrationTestSuite) SetupTest() {
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

func (suite *RoleRepositoryIntegrationTestSuite) TearDownTest() {
	suite.NoError(suite.client.RemoveAll(suite.database, suite.collection))
}

func (suite *RoleRepositoryIntegrationTestSuite) TearDownSuite() {
	suite.NoError(suite.client.Disconnect())
}

func TestRoleRepositoryIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(RoleRepositoryIntegrationTestSuite))
}

func (suite *RoleRepositoryIntegrationTestSuite) TestSaveRole() {
	permission1, err := vo.NewPermission(vo.MethodGet, "/admin")
	suite.Require().NoError(err, "Failed to create permission 1")
	seeder := seeder.NewRoleSeeder().
		WithName("Admin").
		WithDescription("Administrator role").
		WithPermissions(
			permission1,
		)

	role, err := seeder.Seed()
	suite.Require().NoError(err, "Failed to seed role")

	err = suite.repo.Save(role)
	suite.Require().NoError(err, "Failed to save role")
}

func (suite *RoleRepositoryIntegrationTestSuite) TestFindByID() {
	permission1, err := vo.NewPermission(vo.MethodGet, "/admin")
	suite.Require().NoError(err, "Failed to create permission 1")
	seeder := seeder.NewRoleSeeder().
		WithName("Admin").
		WithDescription("Administrator role").
		WithPermissions(
			permission1,
		)

	role, err := seeder.Seed()
	suite.Require().NoError(err, "Failed to seed role")

	err = suite.repo.Save(role)
	suite.Require().NoError(err, "Failed to save role")

	foundRole, err := suite.repo.FindByID(role.ID)
	suite.Require().NoError(err, "Failed to find role by ID")
	suite.Require().NotNil(foundRole, "Found role should not be nil")
}

func (suite *RoleRepositoryIntegrationTestSuite) TestFindByID_NotFound() {
	nonExistentID, err := vo.NewRoleID("non-existent-id")
	suite.Require().NoError(err, "Failed to create non-existent role ID")

	role, err := suite.repo.FindByID(nonExistentID)
	suite.Require().NoError(err, "Finding non-existent role should not return an error")
	suite.Nil(role, "Role should be nil for non-existent ID")
}

func (suite *RoleRepositoryIntegrationTestSuite) TestFindAll() {
	permission1, err := vo.NewPermission(vo.MethodGet, "/admin")
	suite.Require().NoError(err, "Failed to create permission 1")
	seeder := seeder.NewRoleSeeder().
		WithName("Admin").
		WithDescription("Administrator role").
		WithPermissions(
			permission1,
		)

	role, err := seeder.Seed()
	suite.Require().NoError(err, "Failed to seed role")

	err = suite.repo.Save(role)
	suite.Require().NoError(err, "Failed to save role")

	roles, err := suite.repo.FindAll()
	suite.Require().NoError(err, "Failed to find all roles")
	suite.Require().NotEmpty(roles, "Roles should not be empty")
	assert.Equal(suite.T(), 1, len(roles), "There should be one role in the database")
}

func (suite *RoleRepositoryIntegrationTestSuite) TestFindAll_NoRoles() {
	roles, err := suite.repo.FindAll()
	suite.Require().NoError(err, "Finding all roles should not return an error")
	suite.Empty(roles, "Roles should be empty when no roles exist")
}

func (suite *RoleRepositoryIntegrationTestSuite) TestDelete() {
	permission1, err := vo.NewPermission(vo.MethodGet, "/admin")
	suite.Require().NoError(err, "Failed to create permission 1")
	seeder := seeder.NewRoleSeeder().
		WithName("Admin").
		WithDescription("Administrator role").
		WithPermissions(
			permission1,
		)

	role, err := seeder.Seed()
	suite.Require().NoError(err, "Failed to seed role")

	err = suite.repo.Save(role)
	suite.Require().NoError(err, "Failed to save role")

	err = suite.repo.DeleteByID(role.ID)
	suite.Require().NoError(err, "Failed to delete role")

	deletedRole, err := suite.repo.FindByID(role.ID)
	suite.Require().NoError(err, "Finding deleted role should not return an error")
	suite.Nil(deletedRole, "Deleted role should be nil")
}
