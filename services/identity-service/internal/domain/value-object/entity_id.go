package vo

import (
	"fmt"

	"libs/golang/common/id/go-md5"
)

type IdentityID struct {
	value gomd5.ID
}

func (id *IdentityID) String() string {
	return string(id.value)
}

func (id *IdentityID) Equals(other *IdentityID) bool {
	if other == nil {
		return false
	}
	return id.value == other.value
}

func (id *IdentityID) IsEmpty() bool {
	return id.value == ""
}

func NewIdentityID(data map[string]interface{}) (*IdentityID, error) {
	generated, err := gomd5.NewID(data)
	if err != nil {
		return nil, fmt.Errorf("error generating IdentityID: %w", err)
	}
	return &IdentityID{value: generated}, nil
}

type GroupID struct {
	value gomd5.ID
}

func (id *GroupID) String() string {
	return string(id.value)
}

func (id *GroupID) Equals(other *GroupID) bool {
	if other == nil {
		return false
	}
	return id.value == other.value
}

func (id *GroupID) IsEmpty() bool {
	return id.value == ""
}
func NewGroupIDFromString(id string) *GroupID {
	return &GroupID{value: gomd5.ID(id)}
}

func NewGroupID(data map[string]interface{}) (*GroupID, error) {
	generated, err := gomd5.NewID(data)
	if err != nil {
		return nil, fmt.Errorf("error generating GroupID: %w", err)
	}
	return &GroupID{value: generated}, nil
}

type RoleID struct {
	value gomd5.ID
}

func (id *RoleID) String() string {
	return string(id.value)
}

func (id *RoleID) Equals(other *RoleID) bool {
	if other == nil {
		return false
	}
	return id.value == other.value
}

func (id *RoleID) IsEmpty() bool {
	return id.value == ""
}

func NewRoleID(name string) (*RoleID, error) {
	generated, err := gomd5.NewID(name)
	if err != nil {
		return nil, fmt.Errorf("error generating RoleID: %w", err)
	}
	return &RoleID{value: generated}, nil
}

func RoleIdsSliceToStringSlice(ids []*RoleID) []string {
	result := make([]string, len(ids))
	for i, id := range ids {
		result[i] = id.String()
	}
	return result
}
