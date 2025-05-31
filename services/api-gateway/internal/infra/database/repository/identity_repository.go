package repository

import (
	"errors"
	"fmt"
	"libs/golang/common/log"
	"libs/golang/common/resources/go-mongo"
	"services/api-gateway/internal/entity"
	"strings"
)

type IdentityRepository struct {
	logger     log.Log
	client     *gomongo.Client
	Database   string
	Collection string
}

func NewIdentityRepository(logger log.Log, client *gomongo.Client, database, collection string) *IdentityRepository {
	return &IdentityRepository{
		logger:     logger,
		client:     client,
		Database:   database,
		Collection: collection,
	}
}

func (r *IdentityRepository) Save(identity *entity.Identity) error {
	logger := r.logger.Method("repository.IdentityRepository.Save")
	if identity == nil {
		logger.Error("identity cannot be nil")
		return errors.New("identity cannot be nil")
	}

	err := r.client.Upsert(r.Database, r.Collection, identity.ID.String(), identity.ToHashMap())
	if err != nil {
		logger.Error("failed to save identity: %v", err)
		return err
	}
	logger.Info("identity saved successfully: %s", identity.ID.String())
	return nil
}

func (r *IdentityRepository) FindByID(id entity.IdentityID) (*entity.Identity, error) {
	logger := r.logger.Method("repository.IdentityRepository.FindByID")
	if id == "" {
		logger.Error("identity ID cannot be empty")
		return nil, errors.New("identity ID cannot be empty")
	}

	record, err := r.client.GetByID(r.Database, r.Collection, id.String())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Info("identity not found: %s", id.String())
			return nil, nil
		}
		logger.Error("failed to find identity by ID %s: %v", id.String(), err)
		return nil, err
	}

	var identity entity.Identity
	if err := identity.FromHashMap(record); err != nil {
		logger.Error("failed to unmarshal identity: %v", err)
		return nil, fmt.Errorf("failed to unmarshal identity: %w", err)
	}

	logger.Info("successfully found identity by ID: %s", id.String())
	return &identity, nil
}

func (r *IdentityRepository) FindAll() ([]*entity.Identity, error) {
	logger := r.logger.Method("repository.IdentityRepository.FindAll")

	records, err := r.client.GetAll(r.Database, r.Collection)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Info("no identities found, returning empty slice")
			return []*entity.Identity{}, nil
		}
		logger.Error("failed to find identities: %v", err)
		return nil, fmt.Errorf("failed to find identities: %w", err)
	}

	var identities []*entity.Identity
	for _, record := range records {
		var identity entity.Identity
		if err := identity.FromHashMap(record); err != nil {
			logger.Error("failed to unmarshal identity: %v", err)
			return nil, fmt.Errorf("failed to unmarshal identity: %w", err)
		}
		identities = append(identities, &identity)
	}

	logger.Info("successfully found %d identities", len(identities))
	return identities, nil
}

func (r *IdentityRepository) FindByToken(token string) (*entity.Identity, error) {
	logger := r.logger.Method("repository.IdentityRepository.FindByToken")
	if token == "" {
		logger.Error("identity token cannot be empty")
		return nil, errors.New("identity token cannot be empty")
	}

	filter := gomongo.Filter{
		Fields: []gomongo.FilterField{
			{
				Name:               "token",
				Value:              token,
				ComparisonOperator: gomongo.Equal,
			},
		},
	}

	records, err := r.client.Get(r.Database, r.Collection, filter)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Error("Error querying mongo: %v", err)
			return nil, nil
		}
		logger.Error("Error fetching document by token: %v", err)
		return nil, fmt.Errorf("Error fetching document by token: %w", err)
	}

	var identity entity.Identity
	if err := identity.FromHashMap(records[0]); err != nil {
		logger.Error("failed to unmarshal identity: %v", err)
		return nil, fmt.Errorf("failed to unmarshal identity: %w", err)
	}

	logger.Info("successfully found identity by token: %s", token)
	return &identity, nil
}
