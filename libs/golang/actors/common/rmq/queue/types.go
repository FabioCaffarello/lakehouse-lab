package queue

import (
	"fmt"
	"time"

	"github.com/anthdm/hollywood/actor"
	"github.com/streadway/amqp"
)

type QueueWorker struct {
	Name     string
	Workers  int
	Prefetch int
	Args     amqp.Table
}

type ManagerConfig struct {
	SendTo              *actor.PID
	Queues              []QueueWorker
	ConnProvider        func() (*amqp.Connection, error)
	AutoAck             bool
	Prefetch            int
	MaxConsumerLifetime time.Duration
	RespawnOverlap      time.Duration
}

func (sc ManagerConfig) Validate() (ManagerConfig, error) {
	if sc.SendTo == nil {
		return sc, fmt.Errorf("SendTo is required")
	}
	if sc.ConnProvider == nil {
		return sc, fmt.Errorf("ConnProvider is required")
	}
	if len(sc.Queues) == 0 {
		return sc, fmt.Errorf("at least one QueueWorker must be defined")
	}
	if sc.MaxConsumerLifetime == 0 {
		sc.MaxConsumerLifetime = time.Hour
	}
	if sc.RespawnOverlap == 0 {
		sc.RespawnOverlap = 5 * time.Second
	}
	return sc, nil
}

type ConsumerConfig struct {
	QueueName  string
	ConsumerID string
	Conn       *amqp.Connection
	SendTo     *actor.PID
	AutoAck    bool
	Prefetch   int
	Args       amqp.Table
}

type stream struct {
	uid     string
	bid     int64
	pid     *actor.PID
	queue   string
	started time.Time
}

func (s *stream) ID() string {
	return fmt.Sprintf("%s-%s", s.queue, s.uid)
}
