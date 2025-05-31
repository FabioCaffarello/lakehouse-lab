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

type RoleRepository struct {
	logger     log.Log
	client     *gomongo.Client
	Database   string
	Collection string
}

func NewRoleRepository(logger log.Log, client *gomongo.Client, database, collection string) *RoleRepository {
	return &RoleRepository{
		logger:     logger,
		client:     client,
		Database:   database,
		Collection: collection,
	}
}

func (r *RoleRepository) Save(role *entity.Role) error {
	logger := r.logger.Method("repository.RoleRepository.Save")
	if role == nil {
		logger.Error("role cannot be nil")
		return errors.New("role cannot be nil")
	}

	err := r.client.Upsert(r.Database, r.Collection, role.ID.String(), role.ToHashMap())
	if err != nil {
		logger.Error("failed to save role: %v", err)
		return err
	}
	logger.Debug("role saved successfully: %s", role.ID.String())
	return nil
}

func (r *RoleRepository) FindByID(id *vo.RoleID) (*entity.Role, error) {
	logger := r.logger.Method("repository.RoleRepository.FindByID")
	if id == nil || id.IsEmpty() {
		logger.Error("role ID cannot be nil or empty")
		return nil, errors.New("role ID cannot be nil or empty")
	}

	record, err := r.client.GetByID(r.Database, r.Collection, id.String())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Warn("role not found: %s", id.String())
			return nil, nil
		}
		logger.Error("failed to find role by ID %s: %v", id.String(), err)
		return nil, err
	}

	var role entity.Role
	if err := role.FromHashMap(record); err != nil {
		logger.Error("failed to convert record to role: %v", err)
		return nil, fmt.Errorf("failed to convert record to role: %v", err)
	}

	logger.Debug("successfully found role by ID: %s", id.String())
	return &role, nil
}

func (r *RoleRepository) FindAll() ([]*entity.Role, error) {
	logger := r.logger.Method("repository.RoleRepository.FindAll")

	records, err := r.client.GetAll(r.Database, r.Collection)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Warn("no roles found, returning empty list")
			return []*entity.Role{}, nil
		}
		logger.Error("failed to find roles: %v", err)
		return nil, fmt.Errorf("failed to find roles: %v", err)
	}

	var roles []*entity.Role
	for _, record := range records {
		var role entity.Role
		if err := role.FromHashMap(record); err != nil {
			logger.Error("failed to convert record to role: %v", err)
			return nil, fmt.Errorf("failed to convert record to role: %v", err)
		}
		roles = append(roles, &role)
	}

	logger.Debug("successfully found %d roles", len(roles))
	return roles, nil
}

func (r *RoleRepository) DeleteByID(id *vo.RoleID) error {
	logger := r.logger.Method("repository.RoleRepository.DeleteByID")
	if id == nil || id.IsEmpty() {
		logger.Error("role ID cannot be nil or empty")
		return errors.New("role ID cannot be nil or empty")
	}

	err := r.client.Remove(r.Database, r.Collection, id.String())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Warn("role not found for deletion: %s", id.String())
			return nil
		}
		logger.Error("failed to delete role by ID %s: %v", id.String(), err)
		return err
	}

	logger.Debug("successfully deleted role by ID: %s", id.String())
	return nil
}
