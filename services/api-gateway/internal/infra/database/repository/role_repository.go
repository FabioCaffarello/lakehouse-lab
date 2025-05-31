package repository

import (
	"errors"
	"fmt"
	"libs/golang/common/log"
	"libs/golang/common/resources/go-mongo"
	"services/api-gateway/internal/entity"
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
	logger.Info("role saved successfully: %s", role.ID.String())
	return nil
}

func (r *RoleRepository) FindByID(id entity.RoleID) (*entity.Role, error) {
	logger := r.logger.Method("repository.RoleRepository.FindByID")
	if id == "" {
		logger.Error("role ID cannot be empty")
		return nil, errors.New("role ID cannot be empty")
	}

	record, err := r.client.GetByID(r.Database, r.Collection, id.String())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Info("role not found: %s", id.String())
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

	logger.Info("successfully found role by ID: %s", id.String())
	return &role, nil
}

func (r *RoleRepository) FindAll() ([]*entity.Role, error) {
	logger := r.logger.Method("repository.RoleRepository.FindAll")

	records, err := r.client.GetAll(r.Database, r.Collection)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Info("no roles found, returning empty list")
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

	logger.Info("successfully found %d roles: %d", len(roles))
	return roles, nil
}

func (r *RoleRepository) FindByName(name string) (*entity.Role, error) {
	logger := r.logger.Method("repository.RoleRepository.FindByName")
	if name == "" {
		logger.Error("role name cannot be empty")
		return nil, errors.New("role name cannot be empty")
	}

	filter := gomongo.Filter{
		Fields: []gomongo.FilterField{
			{
				Name:               "name",
				Value:              name,
				ComparisonOperator: gomongo.Equal,
			},
		},
	}

	records, err := r.client.Get(r.Database, r.Collection, filter)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Error("Error querying mongo: %v", err)
			return nil, err
		}
		logger.Error("Error fetching document by token: %v", err)
		return nil, fmt.Errorf("Error fetching document by token: %w", err)
	}

	var role entity.Role
	if err := role.FromHashMap(records[0]); err != nil {
		logger.Error("failed to convert record to role: %v", err)
		return nil, fmt.Errorf("failed to convert record to role: %v", err)
	}

	logger.Info("successfully found role by name: %s", name)
	return &role, nil
}
