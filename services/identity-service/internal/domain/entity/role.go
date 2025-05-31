package entity

import (
	vo "services/identity-service/internal/domain/value-object"
	"time"
)

type Role struct {
	ID          *vo.RoleID
	Name        string
	Description string
	Permissions *vo.PermissionSet
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewRole(name, description string, perms ...*vo.Permission) (*Role, error) {
	rid, err := vo.NewRoleID(name)
	if err != nil {
		return nil, err
	}

	return &Role{
		ID:          rid,
		Name:        name,
		Description: description,
		Permissions: vo.NewPermissionSet(perms...),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}, nil
}

func (r *Role) AddPermission(p *vo.Permission)       { r.Permissions.Add(p); r.touch() }
func (r *Role) RemovePermission(p *vo.Permission)    { r.Permissions.Remove(p); r.touch() }
func (r *Role) Allows(m vo.Method, path string) bool { return r.Permissions.Allows(m, path) }
func (r *Role) touch()                               { r.UpdatedAt = time.Now() }

func (r *Role) GetID() *vo.RoleID {
	return r.ID
}

func (r *Role) ToHashMap() map[string]interface{} {
	return map[string]interface{}{
		"id":          r.ID.String(),
		"name":        r.Name,
		"description": r.Description,
		"permissions": r.Permissions.ToSlice(),
		"created_at":  r.CreatedAt.Format(time.RFC3339),
		"updated_at":  r.UpdatedAt.Format(time.RFC3339),
	}
}

func (r *Role) FromHashMap(data map[string]interface{}) error {
	if id, ok := data["id"].(string); ok {
		rid, err := vo.NewRoleID(id)
		if err != nil {
			return err
		}
		r.ID = rid
	}

	if name, ok := data["name"].(string); ok {
		r.Name = name
	}

	if desc, ok := data["description"].(string); ok {
		r.Description = desc
	}

	if perms, ok := data["permissions"].([]map[string]string); ok {
		r.Permissions.FromSlice(perms)
	}

	if createdAt, ok := data["created_at"].(string); ok {
		parsedTime, err := time.Parse(time.RFC3339, createdAt)
		if err != nil {
			return err
		}
		r.CreatedAt = parsedTime
	} else {
		r.CreatedAt = time.Now()
	}

	if updatedAt, ok := data["updated_at"].(string); ok {
		parsedTime, err := time.Parse(time.RFC3339, updatedAt)
		if err != nil {
			return err
		}
		r.UpdatedAt = parsedTime
	} else {
		r.UpdatedAt = time.Now()
	}

	return nil
}
