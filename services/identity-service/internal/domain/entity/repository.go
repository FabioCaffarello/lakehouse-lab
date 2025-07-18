package entity

import (
	vo "services/identity-service/internal/domain/value-object"
)

type IdentityRepositoryInterface interface {
	Save(identity *Identity) error
	FindByID(id *vo.IdentityID) (*Identity, error)
	FindByToken(token vo.Token) (*Identity, error)
	FindAll() ([]*Identity, error)
	DeleteByID(id *vo.IdentityID) error
}

type GroupRepositoryInterface interface {
	Save(group *Group) error
	FindByID(id *vo.GroupID) (*Group, error)
	FindAll() ([]*Group, error)
	DeleteByID(id *vo.GroupID) error
}

type RoleRepositoryInterface interface {
	Save(role *Role) error
	FindByID(id *vo.RoleID) (*Role, error)
	FindAll() ([]*Role, error)
	DeleteByID(id *vo.RoleID) error
}
