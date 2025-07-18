package serversession

import (
	"testing"
)

func TestServerSession(t *testing.T) {
	result := ServerSession("works")
	if result != "ServerSession works" {
		t.Error("Expected ServerSession to append 'works'")
	}
}
