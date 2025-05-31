package vo

import "time"

type TokenClaims struct {
	Sub       string    `json:"sub"` // IdentityID
	Roles     []string  `json:"roles"`
	Groups    []string  `json:"groups"`
	ExpiresAt time.Time `json:"exp"`
	Issuer    string    `json:"iss"`
}
