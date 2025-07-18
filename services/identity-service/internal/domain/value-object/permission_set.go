package vo

type PermissionSet struct {
	values map[Permission]struct{}
}

func NewPermissionSet(perms ...*Permission) *PermissionSet {
	ps := &PermissionSet{values: make(map[Permission]struct{})}
	for _, p := range perms {
		if p != nil {
			ps.values[*p] = struct{}{}
		}
	}
	return ps
}

func (ps *PermissionSet) Add(p *Permission) {
	if p != nil {
		ps.values[*p] = struct{}{}
	}
}

func (ps *PermissionSet) Remove(p *Permission) {
	if p != nil {
		delete(ps.values, *p)
	}
}

func (ps *PermissionSet) Union(other *PermissionSet) *PermissionSet {
	out := NewPermissionSet()
	for p := range ps.values {
		out.Add(&p)
	}
	for p := range other.values {
		out.Add(&p)
	}
	return out
}

func (ps *PermissionSet) Allows(m Method, path string) bool {
	for p := range ps.values {
		if p.Allows(m, path) {
			return true
		}
	}
	return false
}

func (ps *PermissionSet) ToSlice() []map[string]string {
	out := make([]map[string]string, 0, len(ps.values))
	for p := range ps.values {
		out = append(out, p.ToHashMap())
	}
	return out
}

func (ps *PermissionSet) FromSlice(slice []map[string]string) error {
	for _, m := range slice {
		method, err := NewMethod(m["method"])
		if err != nil {
			return err
		}
		p, err := NewPermission(method, m["path"])
		if err != nil {
			return err
		}
		ps.Add(p)
	}
	return nil
}
