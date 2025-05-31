package entity

import (
	vo "services/identity-service/internal/domain/value-object"
	"time"
)

type Group struct {
	ID          *vo.GroupID
	Name        string
	Description string
	Perms       *vo.PermissionSet
	RoleIDs     []*vo.RoleID
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewGroup(name, desc string, roles []*vo.RoleID, perms ...*vo.Permission) (*Group, error) {
	id, err := vo.NewGroupID(map[string]interface{}{"name": name})
	if err != nil {
		return nil, err
	}

	return &Group{
		ID:          id,
		Name:        name,
		Description: desc,
		RoleIDs:     roles,
		Perms:       vo.NewPermissionSet(perms...),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}, nil
}

func (g *Group) AddRole(rid *vo.RoleID) {
	g.RoleIDs = append(g.RoleIDs, rid)
	g.touch()
}

func (g *Group) RemoveRole(rid *vo.RoleID) {
	for i, id := range g.RoleIDs {
		if id.Equals(rid) {
			g.RoleIDs = append(g.RoleIDs[:i], g.RoleIDs[i+1:]...)
			break
		}
	}
	g.touch()
}

func (g *Group) AddPermission(p *vo.Permission) { g.Perms.Add(p); g.touch() }

func (g *Group) Allows(m vo.Method, path string) bool {
	return g.Perms.Allows(m, path)
}

func (g *Group) touch() { g.UpdatedAt = time.Now() }

func (g *Group) GetID() *vo.GroupID {
	return g.ID
}

func (g *Group) ToHashMap() map[string]interface{} {
	roleIDs := make([]string, len(g.RoleIDs))
	for _, rid := range g.RoleIDs {
		roleIDs = append(roleIDs, rid.String())
	}
	return map[string]interface{}{
		"_id":         g.ID.String(),
		"name":        g.Name,
		"description": g.Description,
		"permissions": g.Perms.ToSlice(),
		"role_ids":    vo.RoleIdsSliceToStringSlice(g.RoleIDs),
		"created_at":  g.CreatedAt.Format(time.RFC3339),
		"updated_at":  g.UpdatedAt.Format(time.RFC3339),
	}
}

func (g *Group) FromHashMap(data map[string]interface{}) error {
	if id, ok := data["_id"].(string); ok {
		g.ID = vo.NewGroupIDFromString(id)
	}

	if name, ok := data["name"].(string); ok {
		g.Name = name
	}

	if desc, ok := data["description"].(string); ok {
		g.Description = desc
	}

	if perms, ok := data["permissions"].([]map[string]string); ok {
		g.Perms.FromSlice(perms)
	}

	if createdAt, ok := data["created_at"].(string); ok {
		parsedTime, err := time.Parse(time.RFC3339, createdAt)
		if err != nil {
			return err
		}
		g.CreatedAt = parsedTime
	} else {
		g.CreatedAt = time.Now()
	}

	if updatedAt, ok := data["updated_at"].(string); ok {
		parsedTime, err := time.Parse(time.RFC3339, updatedAt)
		if err != nil {
			return err
		}
		g.UpdatedAt = parsedTime
	} else {
		g.UpdatedAt = time.Now()
	}
	if roleIDs, ok := data["role_ids"].([]string); ok {
		for _, rid := range roleIDs {
			roleID, err := vo.NewRoleID(rid)
			if err != nil {
				return err
			}
			g.RoleIDs = append(g.RoleIDs, roleID)
		}
	}
	return nil
}
