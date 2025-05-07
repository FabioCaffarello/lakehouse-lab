//go:build integration
// +build integration

package queue

import (
	"github.com/anthdm/hollywood/actor"
)

type TestReceiver struct {
	Ch chan RabbitMessage
}

func (r *TestReceiver) Receive(ctx *actor.Context) {
	switch msg := ctx.Message().(type) {
	case RabbitMessage:
		r.Ch <- msg
	}
}
