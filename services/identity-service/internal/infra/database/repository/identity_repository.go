package repository

import (
	"errors"
	"fmt"
	"libs/golang/common/log"
	"libs/golang/common/resources/go-mongo"
	"services/identity-service/internal/domain/entity"
	vo "services/identity-service/internal/domain/value-object"
	"strings"
)

type IdentityRepository interface {
	logger log.Log
	client *gomongo.Client
	Database string
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
	logger.Debug("identity saved successfully: %s", identity.ID.String())
	return nil
}

func (r *IdentityRepository) FindByID(id *vo.IdentityID) (*entity.Identity, error) {
	logger := r.logger.Method("repository.IdentityRepository.FindByID")
	if id == nil || id.IsEmpty() {
		logger.Error("identity ID cannot be nil or empty")
		return nil, errors.New("identity ID cannot be nil or empty")
	}

	record, err := r.client.GetByID(r.Database, r.Collection, id.String())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Warn("identity not found: %s", id.String())
			return nil, nil
		}
		logger.Error("failed to find identity by ID %s: %v", id.String(), err)
		return nil, err
	}

	var identity entity.Identity
	if err := identity.FromHashMap(record); err != nil {
		logger.Error("failed to convert record to identity: %v", err)
		return nil, fmt.Errorf("failed to convert record to identity: %w", err)
	}

	logger.Debug("successfully found identity by ID: %s", id.String())
	return identity, nil
}

// FIXME:
func (r *IdentityRepository) FindByToken(token vo.Token) (*Identity, error) {
	logger := r.logger.Method("repository.IdentityRepository.FindByToken")
	if token == "" {
		logger.Error("token cannot be empty")
		return nil, errors.New("token cannot be empty")
	}

	filter := gomongo.Filter{
		Fields: []gomongo.FilterField{
			{
				Name:               "user",
				Value:              clientID,
				ComparisonOperator: gomongo.Equal,
			},
		},
	}

	records, err := r.client.Get(r.database, r.collection, filter)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Warn("identity not found for token: %s", token)
			return nil, nil
		}
		logger.Error("failed to find identity by token %s: %v", token, err)
		return nil, err
	}

	var identity entity.Identity
	if err := identity.FromHashMap(record); err != nil {
		logger.Error("failed to convert record to identity: %v", err)
		return nil, fmt.Errorf("failed to convert record to identity: %w", err)
	}

	logger.Debug("successfully found identity by token: %s", token)
	return &identity, nil
}

func (r *IdentityRepository) FindAll() ([]*entity.Identity, error) {
	logger := r.logger.Method("repository.IdentityRepository.FindAll")

	records, err := r.client.GetAll(r.Database, r.Collection)
	if err != nil {
		logger.Error("failed to find all identities: %v", err)
		return nil, err
	}

	var identities []*entity.Identity
	for _, record := range records {
		var identity entity.Identity
		if err := identity.FromHashMap(record); err != nil {
			logger.Error("failed to convert record to identity: %v", err)
			return nil, fmt.Errorf("failed to convert record to identity: %w", err)
		}
		identities = append(identities, &identity)
	}

	logger.Debug("successfully found %d identities", len(identities))
	return identities, nil
}

func (r *IdentityRepository) DeleteByID(id *vo.IdentityID) error {
	logger := r.logger.Method("repository.IdentityRepository.DeleteByID")
	if id == nil || id.IsEmpty() {
		logger.Error("identity ID cannot be nil or empty")
		return errors.New("identity ID cannot be nil or empty")
	}

	err := r.client.Remove(r.Database, r.Collection, id.String())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Warn("identity not found for deletion: %s", id.String())
			return nil
		}
		logger.Error("failed to delete identity by ID %s: %v", id.String(), err)
		return err
	}

	logger.Debug("identity deleted successfully: %s", id.String())
	return nil
}
