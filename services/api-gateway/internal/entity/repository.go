package entity

type IdentityRepositoryInterface interface {
	FindByID(id IdentityID) (*Identity, error)
	FindByToken(token string) (*Identity, error)
	FindAll() ([]*Identity, error)
	Save(identity *Identity) error
}

type RoleRepositoryInterface interface {
	FindByID(id string) (*Role, error)
	FindByName(name string) (*Role, error)
	FindAll() ([]*Role, error)
	Save(role *Role) error
}
