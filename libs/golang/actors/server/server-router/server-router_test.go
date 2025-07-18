package serverrouter

import (
	"testing"
)

func TestServerRouter(t *testing.T) {
	result := ServerRouter("works")
	if result != "ServerRouter works" {
		t.Error("Expected ServerRouter to append 'works'")
	}
}
