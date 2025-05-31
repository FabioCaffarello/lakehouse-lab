package entity

import (
	"errors"
	"fmt"
	"regexp"
)

type HTTPMethod string

const (
	MethodGet     HTTPMethod = "GET"
	MethodPost    HTTPMethod = "POST"
	MethodPut     HTTPMethod = "PUT"
	MethodDelete  HTTPMethod = "DELETE"
	MethodPatch   HTTPMethod = "PATCH"
	MethodHead    HTTPMethod = "HEAD"
	MethodOptions HTTPMethod = "OPTIONS"
)

func IsValidMethod(method HTTPMethod) bool {
	switch method {
	case MethodGet, MethodPost, MethodPut, MethodDelete,
		MethodPatch, MethodHead, MethodOptions:
		return true
	default:
		return false
	}
}

type Permission struct {
	Path   string
	Method HTTPMethod
	Regex  *regexp.Regexp
}

func NewPermission(method HTTPMethod, path string) (*Permission, error) {
	if method == "" || path == "" {
		return nil, errors.New("method and path must not be empty")
	}

	if !IsValidMethod(method) {
		return nil, fmt.Errorf("invalid HTTP method: %s", method)
	}

	escaped := regexp.QuoteMeta(path)
	escaped = regexp.MustCompile(`/\\\*`).ReplaceAllString(escaped, `(?:/.+)$`)
	regexPattern := "^" + escaped + "$"
	regex, err := regexp.Compile(regexPattern)
	if err != nil {
		return nil, fmt.Errorf("invalid regex pattern: %w", err)
	}

	return &Permission{
		Method: method,
		Path:   path,
		Regex:  regex,
	}, nil
}

func (p Permission) Matches(path string, method HTTPMethod) bool {
	if p.Method != method {
		return false
	}
	if p.Regex != nil {
		return p.Regex.MatchString(path)
	}
	return p.Path == path
}

func (p Permission) Equals(other Permission) bool {
	return p.Path == other.Path && p.Method == other.Method
}

func (p Permission) IsZero() bool {
	return p.Path == "" || p.Method == ""
}

func (p Permission) ToHashMap() map[string]interface{} {
	return map[string]interface{}{
		"path":   p.Path,
		"method": p.Method,
	}
}

func (p *Permission) FromHashMap(data map[string]interface{}) error {
	if path, ok := data["path"].(string); ok {
		p.Path = path
	} else {
		return errors.New("path must be a string")
	}

	if method, ok := data["method"].(string); ok {
		p.Method = HTTPMethod(method)
	} else {
		return errors.New("method must be a string")
	}

	if !IsValidMethod(p.Method) {
		return fmt.Errorf("invalid HTTP method: %s", p.Method)
	}

	return nil
}
