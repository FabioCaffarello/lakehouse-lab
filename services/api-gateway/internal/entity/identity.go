package entity

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"libs/golang/common/id/go-md5"
)

type IdentityID string

func NewIdentityID(id string) IdentityID {
	return IdentityID(id)
}

func (i IdentityID) String() string {
	return string(i)
}

type IdentityGroup string

func (g IdentityGroup) String() string {
	return string(g)
}

func NewIdentityGroup(group string) IdentityGroup {
	return IdentityGroup(group)
}

const (
	GroupBot     IdentityGroup = "bot"
	GroupService IdentityGroup = "service"
	GroupHuman   IdentityGroup = "human"
)

type Identity struct {
	ID               IdentityID
	Username         string
	Group            IdentityGroup
	Token            string // API key or JWT
	AllowedProviders []string
	RoleIDs          []string
}

type IdentityProps struct {
	Username         string
	Group            IdentityGroup
	AllowedProviders []string
	RoleIDs          []string
}

func NewIdentity(props *IdentityProps) (*Identity, error) {
	if err := props.validate(); err != nil {
		return nil, err
	}

	entityID, err := generateIdentityEntityID(props.Username, string(props.Group))
	if err != nil {
		return nil, err
	}

	apiKey, err := generateAPIKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate api key: %w", err)
	}

	identity := &Identity{
		ID:               entityID,
		Username:         props.Username,
		Group:            props.Group,
		Token:            apiKey,
		AllowedProviders: props.AllowedProviders,
		RoleIDs:          props.RoleIDs,
	}

	if err := identity.validate(); err != nil {
		return nil, err
	}

	return identity, nil
}

func (p *IdentityProps) validate() error {
	if p.Username == "" {
		return errors.New("username cannot be empty")
	}
	if p.Group == "" {
		return errors.New("group cannot be empty")
	}
	if p.AllowedProviders == nil {
		return errors.New("allowed providers cannot be nil")
	}
	return nil
}

func (i *Identity) validate() error {
	if i.Username == "" {
		return errors.New("username cannot be empty")
	}
	if i.Group == "" {
		return errors.New("group cannot be empty")
	}
	if i.AllowedProviders == nil {
		return errors.New("allowed providers cannot be nil")
	}
	return nil
}

func (i *Identity) HasRole(roleID string) bool {
	for _, id := range i.RoleIDs {
		if id == roleID {
			return true
		}
	}
	return false
}

func (i *Identity) IsBot() bool {
	return i.Group == GroupBot
}

func (i *Identity) ToHashMap() map[string]interface{} {
	return map[string]interface{}{
		"_id":              i.ID.String(),
		"username":         i.Username,
		"group":            i.Group.String(),
		"token":            i.Token,
		"allowedProviders": i.AllowedProviders,
		"roleIDs":          i.RoleIDs,
	}
}

func (i *Identity) FromHashMap(data map[string]interface{}) error {
	if id, ok := data["_id"].(string); ok {
		i.ID = NewIdentityID(id)
	} else {
		return errors.New("invalid ID format")
	}

	if username, ok := data["username"].(string); ok {
		i.Username = username
	}

	if group, ok := data["group"].(string); ok {
		i.Group = IdentityGroup(group)
	}

	if token, ok := data["token"].(string); ok {
		i.Token = token
	}

	switch allowedProviders := data["allowedProviders"].(type) {
	case []string:
		i.AllowedProviders = data["allowedProviders"].([]string)
	case []interface{}:
		i.AllowedProviders = convertToStringSlice(allowedProviders)
	}

	switch authRuleIdsRaw := data["roleIDs"].(type) {
	case []string:
		i.RoleIDs = data["roleIDs"].([]string)
	case []interface{}:
		i.RoleIDs = convertToStringSlice(authRuleIdsRaw)
	}

	return nil
}

func convertToStringSlice(input []interface{}) []string {
	var result []string
	for _, item := range input {
		if str, ok := item.(string); ok {
			result = append(result, str)
		}
	}
	return result
}

func (i *Identity) RotateToken() error {
	apiKey, err := generateAPIKey()
	if err != nil {
		return err
	}
	i.Token = apiKey
	return nil
}

func GenerateIdentityID(user string, group IdentityGroup) (IdentityID, error) {
	return generateIdentityEntityID(user, string(group))
}

func generateIdentityEntityID(user string, group string) (IdentityID, error) {
	idData := map[string]interface{}{
		"username": user,
		"group":    group,
	}
	id, err := gomd5.NewID(idData)
	if err != nil {
		return "", err
	}
	return NewIdentityID(string(id)), nil
}

func generateAPIKey() (string, error) {
	// 32 bytes = 256 bits of entropy
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(randomBytes), nil
}
