package vo

import (
	"crypto/rand"
	"encoding/base64"
	"time"
)

type Token struct {
	Value     string
	ExpiresAt time.Time
	Issuer    string
}

func NewRandom(ttl time.Duration, issuer string) (Token, error) {
	rnd := make([]byte, 32)
	if _, err := rand.Read(rnd); err != nil {
		return Token{}, err
	}
	return Token{
		Value:     base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(rnd),
		ExpiresAt: time.Now().Add(ttl),
		Issuer:    issuer,
	}, nil
}

func (t Token) IsExpired() bool { return time.Now().After(t.ExpiresAt) }

func (t Token) Equals(other Token) bool {
	return t.Value == other.Value && t.ExpiresAt.Equal(other.ExpiresAt) && t.Issuer == other.Issuer
}
