//go:build unit
// +build unit

package vo_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/suite"
	vo "services/identity-service/internal/domain/value-object"
)

type TokenTestSuite struct {
	suite.Suite
}

func TestTokenTestSuite(t *testing.T) {
	suite.Run(t, new(TokenTestSuite))
}

func (s *TokenTestSuite) TestNewRandom_GeneratesValidToken() {
	const ttl = time.Hour
	const issuer = "unit-test"

	tok, err := vo.NewRandom(ttl, issuer)
	s.Require().NoError(err, "NewRandom returned unexpected error")

	s.NotEmpty(tok.Value, "token value should not be empty")

	s.GreaterOrEqual(len(tok.Value), 43, "token length should be >= 43")

	s.Equal(issuer, tok.Issuer, "issuer mismatch")

	now := time.Now()
	s.InDelta(
		now.Add(ttl).Unix(),
		tok.ExpiresAt.Unix(),
		1,
		"ExpiresAt not within expected range",
	)
}

func (s *TokenTestSuite) TestNewRandom_UniqueValues() {
	tok1, _ := vo.NewRandom(time.Minute, "issuer")
	tok2, _ := vo.NewRandom(time.Minute, "issuer")

	s.NotEqual(tok1.Value, tok2.Value, "two consecutive tokens should differ")
}

func (s *TokenTestSuite) TestIsExpired_BeforeAndAfter() {
	tok, _ := vo.NewRandom(100*time.Millisecond, "issuer")

	s.False(tok.IsExpired(), "token should not be expired immediately after creation")

	time.Sleep(120 * time.Millisecond)
	s.True(tok.IsExpired(), "token should be expired after TTL")
}

func (s *TokenTestSuite) TestIsExpired_AlreadyExpired() {
	expiredTok, _ := vo.NewRandom(-time.Second, "issuer")
	s.True(expiredTok.IsExpired(), "token with negative TTL should be expired")
}
