package entity

import vo "services/identity-service/internal/domain/value-object"

type ResolvedIdentity struct {
	ID    *vo.IdentityID
	Perms *vo.PermissionSet
}

func (ri *ResolvedIdentity) Allows(m vo.Method, path string) bool {
	return ri.Perms.Allows(m, path)
}
