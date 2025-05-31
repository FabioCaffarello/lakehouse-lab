//go:build integration
// +build integration

package repository_test

import (
	"github.com/stretchr/testify/suite"
	"libs/golang/common/log"
	"libs/golang/common/resources/go-mongo"
	"services/api-gateway/internal/entity/seeder"
	"services/api-gateway/internal/entity"
	"services/api-gateway/internal/infra/database/repository"
	"testing"
	"time"
)

type IdentityRepositoryIntegrationTestSuite struct {
	suite.Suite
	client     *gomongo.Client
	database   string
	collection string
	repo       *repository.IdentityRepository
	logger     log.Log
}

func (suite *IdentityRepositoryIntegrationTestSuite) SetupSuite() {
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
	suite.collection = "identities"
	suite.repo = repository.NewIdentityRepository(suite.logger, suite.client, suite.database, suite.collection)
}

func (suite *IdentityRepositoryIntegrationTestSuite) SetupTest() {
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

func (suite *IdentityRepositoryIntegrationTestSuite) TearDownSuite() {
	suite.NoError(suite.client.Disconnect())
}

func TestIdentityRepositoryIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(IdentityRepositoryIntegrationTestSuite))
}

func (suite *IdentityRepositoryIntegrationTestSuite) TestSaveIdentity() {
	seeder := seeder.NewIdentitySeeder("testuser", "bot").
		WithAllowedProviders([]string{"test-provider"}).
		WithRoleIDs([]string{"role1", "role2"})

	identity, err := seeder.BuildEntity()
	suite.Require().NoError(err, "Failed to build identity entity")

	err = suite.repo.Save(identity)
	suite.Require().NoError(err, "Failed to save identity")
}

func (suite *IdentityRepositoryIntegrationTestSuite) TestFindByID() {
	seeder := seeder.NewIdentitySeeder("testuser", "bot").
		WithAllowedProviders([]string{"test-provider"}).
		WithRoleIDs([]string{"role1", "role2"}).
		WithToken("test-token")

	identity, err := seeder.BuildEntity()
	suite.Require().NoError(err, "Failed to build identity entity")

	err = suite.repo.Save(identity)
	suite.Require().NoError(err, "Failed to save identity")

	foundIdentity, err := suite.repo.FindByID(identity.ID)
	suite.Require().NoError(err, "Failed to find identity by ID")
	suite.Require().NotNil(foundIdentity, "Found identity should not be nil")
	suite.Equal(identity.Username, foundIdentity.Username, "Usernames should match")
	suite.Equal(identity.Group, foundIdentity.Group, "Groups should match")
	suite.Equal(identity.AllowedProviders, foundIdentity.AllowedProviders, "Allowed providers should match")
	suite.Equal(identity.RoleIDs, foundIdentity.RoleIDs, "Role IDs should match")
	suite.Equal(identity.Token, foundIdentity.Token, "Tokens should match")
}

func (suite *IdentityRepositoryIntegrationTestSuite) TestFindByID_NotFound() {
	nonExistentID := entity.NewIdentityID("non-existent-id")
	foundIdentity, err := suite.repo.FindByID(nonExistentID)
	suite.NoError(err, "Finding a non-existent identity should not return an error")
	suite.Nil(foundIdentity, "Finding a non-existent identity should return nil")
}

func (suite *IdentityRepositoryIntegrationTestSuite) TestSaveIdentity_Nil() {
	err := suite.repo.Save(nil)
	suite.Require().Error(err, "Saving nil identity should return an error")
	suite.EqualError(err, "identity cannot be nil", "Error message should match")
}

func (suite *IdentityRepositoryIntegrationTestSuite) TestFindByID_EmptyID() {
	emptyID := entity.IdentityID("")
	foundIdentity, err := suite.repo.FindByID(emptyID)
	suite.Require().Error(err, "Finding identity with empty ID should return an error")
	suite.EqualError(err, "identity ID cannot be empty", "Error message should match")
	suite.Nil(foundIdentity, "Finding identity with empty ID should return nil")
}

func (suite *IdentityRepositoryIntegrationTestSuite) TestFindByToken() {
	seeder := seeder.NewIdentitySeeder("testuser", "bot").
		WithAllowedProviders([]string{"test-provider"}).
		WithRoleIDs([]string{"role1", "role2"}).
		WithToken("test-token")

	identity, err := seeder.BuildEntity()
	suite.Require().NoError(err, "Failed to build identity entity")

	err = suite.repo.Save(identity)
	suite.Require().NoError(err, "Failed to save identity")

	foundIdentity, err := suite.repo.FindByToken(identity.Token)
	suite.Require().NoError(err, "Failed to find identity by token")
	suite.Require().NotNil(foundIdentity, "Found identity should not be nil")
	suite.Equal(identity.Username, foundIdentity.Username, "Usernames should match")
	suite.Equal(identity.Group, foundIdentity.Group, "Groups should match")
	suite.Equal(identity.AllowedProviders, foundIdentity.AllowedProviders, "Allowed providers should match")
	suite.Equal(identity.RoleIDs, foundIdentity.RoleIDs, "Role IDs should match")
	suite.Equal(identity.Token, foundIdentity.Token, "Tokens should match")
}

func (suite *IdentityRepositoryIntegrationTestSuite) TestFindByToken_NotFound() {
	seeder := seeder.NewIdentitySeeder("testuser", "bot").
		WithAllowedProviders([]string{"test-provider"}).
		WithRoleIDs([]string{"role1", "role2"}).
		WithToken("test-token")

	identity, err := seeder.BuildEntity()
	suite.Require().NoError(err, "Failed to build identity entity")

	err = suite.repo.Save(identity)
	suite.Require().NoError(err, "Failed to save identity")

	foundIdentity, err := suite.repo.FindByToken("non-existent-token")
	suite.Require().NoError(err, "Finding identity by non-existent token should not return an error")

	suite.Nil(foundIdentity, "Finding identity by non-existent token should return nil")
}

func (suite *IdentityRepositoryIntegrationTestSuite) TestFindAll() {
	seeder1 := seeder.NewIdentitySeeder("testuser", "bot").
		WithAllowedProviders([]string{"test-provider"}).
		WithRoleIDs([]string{"role1", "role2"})

	identity1, err := seeder1.BuildEntity()
	suite.Require().NoError(err, "Failed to build identity entity")

	err = suite.repo.Save(identity1)
	suite.Require().NoError(err, "Failed to save identity")

	seeder2 := seeder.NewIdentitySeeder("testuser2", "bot").
		WithAllowedProviders([]string{"test-provider2"}).
		WithRoleIDs([]string{"role3", "role4"})

	identity2, err := seeder2.BuildEntity()
	suite.Require().NoError(err, "Failed to build identity entity")	

	err = suite.repo.Save(identity2)

	suite.Require().NoError(err, "Failed to save identity")
	identities, err := suite.repo.FindAll()
	suite.Require().NoError(err, "Failed to find all identities")
	suite.Require().NotEmpty(identities, "Identities should not be empty")
	suite.Len(identities, 2, "Should find two identities")
	suite.Equal(identity1.Username, identities[0].Username, "First identity username should match")
	suite.Equal(identity2.Username, identities[1].Username, "Second identity username should match")
}
