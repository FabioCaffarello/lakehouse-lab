//go:build integration
// +build integration

package repository_test

import (
	"github.com/stretchr/testify/suite"
	"libs/golang/common/log"
	"libs/golang/common/resources/go-mongo"
	"services/api-gateway/internal/entity"
	"services/api-gateway/internal/entity/seeder"
	"services/api-gateway/internal/infra/database/repository"
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

func (suite *RoleRepositoryIntegrationTestSuite) TearDownSuite() {
	suite.NoError(suite.client.Disconnect())
}

func TestRoleRepositoryIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(RoleRepositoryIntegrationTestSuite))
}

func (suite *RoleRepositoryIntegrationTestSuite) TestSaveRole() {
	seeder := seeder.NewRoleSeeder("capture").
		WithPermissions(
			seeder.NewPermissionSeeder(
				entity.MethodGet,
				"/example/*",
			),
		)

	role, err := seeder.BuildEntity()
	suite.Require().NoError(err, "Failed to build role entity")

	err = suite.repo.Save(role)
	suite.Require().NoError(err, "Failed to save role")
}
