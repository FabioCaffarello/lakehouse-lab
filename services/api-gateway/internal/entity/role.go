package entity

import (
	"errors"
	"fmt"
	"libs/golang/common/id/go-md5"
)

type RoleID string

func NewRoleID(id string) RoleID {
	return RoleID(id)
}

func (r RoleID) String() string {
	return string(r)
}

type Role struct {
	ID          RoleID
	Name        string
	Description string
	Permissions []Permission
}

type RoleProps struct {
	Name        string
	Description string
	Permissions []Permission
}

func (p *RoleProps) validate() error {
	if p.Name == "" {
		return errors.New("name cannot be empty")
	}
	return nil
}

func NewRole(props *RoleProps) (*Role, error) {
	if err := props.validate(); err != nil {
		return nil, err
	}

	roleID, err := generateRoleID(props.Name)
	if err != nil {
		return nil, err
	}

	role := &Role{
		ID:          roleID,
		Name:        props.Name,
		Description: props.Description,
		Permissions: make([]Permission, 0),
	}

	for _, p := range props.Permissions {
		if err := role.AddPermission(p); err != nil {
			return nil, err
		}
	}

	if err := role.validate(); err != nil {
		return nil, err
	}

	return role, nil
}

func (r *Role) validate() error {
	if r.Name == "" {
		return errors.New("role name cannot be empty")
	}
	return nil
}

func (r *Role) AddPermission(p Permission) error {
	if p.IsZero() {
		return errors.New("permission cannot be empty")
	}
	if r.HasPermission(p) {
		return fmt.Errorf("permission already exists: %s %s", p.Method, p.Path)
	}
	r.Permissions = append(r.Permissions, p)
	return nil
}

func (r *Role) HasPermission(p Permission) bool {
	for _, perm := range r.Permissions {
		if perm.Equals(p) {
			return true
		}
	}
	return false
}

func (r *Role) Allows(path string, method HTTPMethod) bool {
	for _, p := range r.Permissions {
		if p.Matches(path, method) {
			return true
		}
	}
	return false
}

func generateRoleID(name string) (RoleID, error) {
	id, err := gomd5.NewID(map[string]interface{}{
		"name": name,
	})
	if err != nil {
		return "", err
	}
	return NewRoleID(string(id)), nil
}

func (r *Role) ToHashMap() map[string]interface{} {
	return map[string]interface{}{
		"_id":         r.ID.String(),
		"name":        r.Name,
		"description": r.Description,
		"permissions": permissionsToHashMap(r.Permissions),
	}
}

func (r *Role) FromHashMap(data map[string]interface{}) error {
	if id, ok := data["_id"].(string); ok {
		r.ID = NewRoleID(id)
	}
	if name, ok := data["name"].(string); ok {
		r.Name = name
	}
	if desc, ok := data["description"].(string); ok {
		r.Description = desc
	}
	if perms, ok := data["permissions"].([]interface{}); ok {
		for _, p := range perms {
			var perm Permission
			if err := perm.FromHashMap(p.(map[string]interface{})); err != nil {
				return fmt.Errorf("failed to unmarshal permission: %w", err)
			}
			r.Permissions = append(r.Permissions, perm)
		}
	}

	return nil
}

func permissionsToHashMap(perms []Permission) []map[string]interface{} {
	var result []map[string]interface{}
	for _, p := range perms {
		result = append(result, p.ToHashMap())
	}
	return result
}
