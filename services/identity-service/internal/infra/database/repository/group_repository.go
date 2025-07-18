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

type GroupRepository struct {
	logger     log.Log
	client     *gomongo.Client
	Database   string
	Collection string
}

func NewGroupRepository(logger log.Log, client *gomongo.Client, database, collection string) *GroupRepository {
	return &GroupRepository{
		logger:     logger,
		client:     client,
		Database:   database,
		Collection: collection,
	}
}

func (r *GroupRepository) Save(group *entity.Group) error {
	logger := r.logger.Method("repository.GroupRepository.Save")
	if group == nil {
		logger.Error("group cannot be nil")
		return errors.New("group cannot be nil")
	}

	err := r.client.Upsert(r.Database, r.Collection, group.ID.String(), group.ToHashMap())
	if err != nil {
		logger.Error("failed to save group: %v", err)
		return err
	}
	logger.Debug("group saved successfully: %s", group.ID.String())
	return nil
}

func (r *GroupRepository) FindByID(id *vo.GroupID) (*entity.Group, error) {
	logger := r.logger.Method("repository.GroupRepository.FindByID")
	if id == nil || id.IsEmpty() {
		logger.Error("group ID cannot be nil or empty")
		return nil, errors.New("group ID cannot be nil or empty")
	}

	record, err := r.client.GetByID(r.Database, r.Collection, id.String())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Warn("group not found: %s", id.String())
			return nil, nil
		}
		logger.Error("failed to find group by ID %s: %v", id.String(), err)
		return nil, err
	}

	var group entity.Group
	if err := group.FromHashMap(record); err != nil {
		logger.Error("failed to convert record to group: %v", err)
		return nil, fmt.Errorf("failed to convert record to group: %w", err)
	}

	logger.Debug("successfully found group by ID: %s", id.String())
	return &group, nil
}

func (r *GroupRepository) FindAll() ([]*entity.Group, error) {
	logger := r.logger.Method("repository.GroupRepository.FindAll")

	records, err := r.client.GetAll(r.Database, r.Collection)
	if err != nil {
		logger.Error("failed to find all groups: %v", err)
		return nil, err
	}

	var groups []*entity.Group
	for _, record := range records {
		var group entity.Group
		if err := group.FromHashMap(record); err != nil {
			logger.Error("failed to convert record to group: %v", err)
			return nil, fmt.Errorf("failed to convert record to group: %w", err)
		}
		groups = append(groups, &group)
	}

	logger.Debug("successfully found %d groups", len(groups))
	return groups, nil
}

func (r *GroupRepository) DeleteByID(id *vo.GroupID) error {
	logger := r.logger.Method("repository.GroupRepository.DeleteByID")
	if id == nil || id.IsEmpty() {
		logger.Error("group ID cannot be nil or empty")
		return errors.New("group ID cannot be nil or empty")
	}

	err := r.client.Remove(r.Database, r.Collection, id.String())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			logger.Warn("group not found for deletion: %s", id.String())
			return nil
		}
		logger.Error("failed to delete group by ID %s: %v", id.String(), err)
		return err
	}

	logger.Debug("successfully deleted group by ID: %s", id.String())
	return nil
}
