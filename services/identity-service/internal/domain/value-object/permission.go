package vo

import (
	"fmt"
	"regexp"
)

type Method string

const (
	MethodGet     Method = "GET"
	MethodPost    Method = "POST"
	MethodPut     Method = "PUT"
	MethodDelete  Method = "DELETE"
	MethodPatch   Method = "PATCH"
	MethodHead    Method = "HEAD"
	MethodOptions Method = "OPTIONS"
)

func (m Method) String() string {
	return string(m)
}

func NewMethod(method string) (Method, error) {
	if method == "" {
		return "", fmt.Errorf("method cannot be empty")
	}
	switch Method(method) {
	case MethodGet, MethodPost, MethodPut, MethodDelete,
		MethodPatch, MethodHead, MethodOptions:
		return Method(method), nil
	default:
		return "", fmt.Errorf("invalid HTTP method: %s", method)
	}
}

func isValidMethod(method Method) bool {
	switch method {
	case MethodGet, MethodPost, MethodPut, MethodDelete,
		MethodPatch, MethodHead, MethodOptions:
		return true
	default:
		return false
	}
}

type Permission struct {
	method Method
	path   string
	re     *regexp.Regexp
}

func NewPermission(method Method, path string) (*Permission, error) {
	if !isValidMethod(method) || path == "" {
		return nil, fmt.Errorf("invalid permission")
	}
	pat := "^" + regexp.MustCompile(`/\\\*`).ReplaceAllString(
		regexp.QuoteMeta(path), `(?:/.+)$`) + "$"
	return &Permission{method, path, regexp.MustCompile(pat)}, nil
}

func (p *Permission) Method() Method {
	return p.method
}

func (p *Permission) Path() string {
	return p.path
}

func (p *Permission) Allows(method Method, path string) bool {
	if p.method != method {
		return false
	}
	if p.re != nil {
		return p.re.MatchString(path)
	}
	return p.path == path
}

func (p *Permission) Equals(other *Permission) bool {
	if other == nil {
		return false
	}
	return p.method == other.method && p.path == other.path
}

func (p *Permission) ToHashMap() map[string]string {
	return map[string]string{
		"method": p.method.String(),
		"path":   p.path,
	}
}
