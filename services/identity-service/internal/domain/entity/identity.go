package entity

import (
	"errors"
	"time"

	vo "services/identity-service/internal/domain/value-object"
)

type PrincipalType string

const (
	PrincipalHuman   PrincipalType = "human"
	PrincipalService PrincipalType = "service"
	PrincipalBot     PrincipalType = "bot"
)

type Identity struct {
	id          *vo.IdentityID
	name        string
	pType       PrincipalType
	groupIDs    map[string]*vo.GroupID
	roleIDs     map[string]*vo.RoleID
	directPerms *vo.PermissionSet
	token       vo.Token
	createdAt   time.Time
	updatedAt   time.Time
}

func NewIdentity(
	name string,
	ptype PrincipalType,
	groupIDs []*vo.GroupID,
	roleIDs []*vo.RoleID,
) (*Identity, error) {

	if name == "" {
		return nil, errors.New("identity name cannot be empty")
	}
	if ptype == "" {
		return nil, errors.New("principal type cannot be empty")
	}

	id, err := vo.NewIdentityID(map[string]interface{}{"name": name, "type": ptype})
	if err != nil {
		return nil, err
	}

	gmap := make(map[string]*vo.GroupID, len(groupIDs))
	for _, g := range groupIDs {
		gmap[g.String()] = g
	}
	rmap := make(map[string]*vo.RoleID, len(roleIDs))
	for _, r := range roleIDs {
		rmap[r.String()] = r
	}

	now := time.Now().UTC()

	return &Identity{
		id:          id,
		name:        name,
		pType:       ptype,
		groupIDs:    gmap,
		roleIDs:     rmap,
		directPerms: vo.NewPermissionSet(),
		createdAt:   now,
		updatedAt:   now,
	}, nil
}

func (i *Identity) ID() *vo.IdentityID                   { return i.id }
func (i *Identity) Name() string                         { return i.name }
func (i *Identity) Type() PrincipalType                  { return i.pType }
func (i *Identity) GroupIDs() []*vo.GroupID              { return values(i.groupIDs) }
func (i *Identity) RoleIDs() []*vo.RoleID                { return values(i.roleIDs) }
func (i *Identity) Token() vo.Token                      { return i.token }
func (i *Identity) CreatedAt() time.Time                 { return i.createdAt }
func (i *Identity) UpdatedAt() time.Time                 { return i.updatedAt }
func (i *Identity) DirectPermissions() *vo.PermissionSet { return i.directPerms }

func (i *Identity) AttachGroup(gid *vo.GroupID) {
	if _, ok := i.groupIDs[gid.String()]; !ok {
		i.groupIDs[gid.String()] = gid
		i.touch()
	}
}

func (i *Identity) DetachGroup(gid *vo.GroupID) {
	if _, ok := i.groupIDs[gid.String()]; ok {
		delete(i.groupIDs, gid.String())
		i.touch()
	}
}

func (i *Identity) AttachRole(rid *vo.RoleID) {
	if _, ok := i.roleIDs[rid.String()]; !ok {
		i.roleIDs[rid.String()] = rid
		i.touch()
	}
}

func (i *Identity) DetachRole(rid *vo.RoleID) {
	if _, ok := i.roleIDs[rid.String()]; ok {
		delete(i.roleIDs, rid.String())
		i.touch()
	}
}

func (i *Identity) GrantPermission(p *vo.Permission) {
	i.directPerms.Add(p)
	i.touch()
}

func (i *Identity) RevokePermission(p *vo.Permission) {
	i.directPerms.Remove(p)
	i.touch()
}

func (i *Identity) SetToken(tok vo.Token) {
	i.token = tok
	i.touch()
}

func (i *Identity) touch() { i.updatedAt = time.Now().UTC() }

func values[T any](m map[string]T) []T {
	out := make([]T, 0, len(m))
	for _, v := range m {
		out = append(out, v)
	}
	return out
}
