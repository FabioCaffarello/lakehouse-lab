package queue

import (
	"fmt"
	"log/slog"
	"math"
	"time"

	"github.com/anthdm/hollywood/actor"
	"github.com/google/uuid"
	"github.com/streadway/amqp"
)

type Manager struct {
	config   ManagerConfig
	streams  []*stream
	repeater *actor.SendRepeater
}

type loop struct{}

func NewManager(config ManagerConfig) actor.Producer {
	return func() actor.Receiver {
		return &Manager{
			config: config,
		}
	}
}

func (m *Manager) Receive(c *actor.Context) {
	switch msg := c.Message().(type) {
	case actor.Initialized:
	case actor.Started:
		m.init(c)
	case actor.Stopped:
	case *loop:
		m.updateStreams(c)
	default:
		slog.Error("manager.Receive(): unknown message", "msg", msg)
	}
}

func (m *Manager) init(c *actor.Context) {
	cfg, err := m.config.Validate()
	if err != nil {
		panic("invalid ManagerConfig: " + err.Error())
	}
	m.config = cfg

	i := 0
	for _, q := range m.config.Queues {
		for w := 0; w < q.Workers; w++ {
			conn, err := m.config.ConnProvider()
			if err != nil {
				panic("failed to connect to RabbitMQ: " + err.Error())
			}

			s := &stream{
				uid:     uuid.New().String(),
				bid:     int64(i),
				started: time.Now(),
				queue:   q.Name,
			}

			conf := m.buildConsumerConfig(q, i, conn, false)

			pid := c.SpawnChild(
				NewConsumer(conf),
				"rabbit-consumer",
				actor.WithID(fmt.Sprintf("%s-%d-%s", q.Name, s.bid, s.uid)),
				actor.WithMaxRestarts(math.MaxInt),
				actor.WithRestartDelay(time.Second),
			)

			s.pid = pid
			m.streams = append(m.streams, s)
			i++
		}
	}

	repeater := c.Engine().SendRepeat(c.PID(), &loop{}, time.Second)
	m.repeater = &repeater
}

func (m *Manager) updateStreams(c *actor.Context) {
	for i, oldStream := range m.streams {
		if time.Since(oldStream.started) < m.config.MaxConsumerLifetime {
			continue
		}

		slog.Info("stream expired", "stream", oldStream.ID())

		if m.config.RespawnOverlap > 0 {
			newStream := m.createNewStream(c, oldStream, i)
			m.streams[i] = newStream
			time.Sleep(m.config.RespawnOverlap)
			c.Engine().Poison(oldStream.pid)
		} else {
			<-c.Engine().Poison(oldStream.pid).Done()
			newStream := m.createNewStream(c, oldStream, i)
			m.streams[i] = newStream
		}
	}
}

func (m *Manager) createNewStream(c *actor.Context, oldStream *stream, index int) *stream {
	conn, err := m.config.ConnProvider()
	if err != nil {
		panic("failed to connect to RabbitMQ: " + err.Error())
	}

	qDef, err := m.findQueueConfig(oldStream.queue)
	if err != nil {
		panic(err)
	}

	newStream := &stream{
		uid:     uuid.New().String(),
		bid:     int64(index),
		started: time.Now(),
		queue:   qDef.Name,
	}

	conf := m.buildConsumerConfig(qDef, index, conn, true)

	pid := c.SpawnChild(
		NewConsumer(conf),
		"rabbit-consumer",
		actor.WithID(fmt.Sprintf("%s-%d-%s", qDef.Name, newStream.bid, newStream.uid)),
		actor.WithMaxRestarts(math.MaxInt),
		actor.WithRestartDelay(time.Second),
	)

	newStream.pid = pid
	return newStream
}

func (m *Manager) findQueueConfig(name string) (QueueWorker, error) {
	for _, q := range m.config.Queues {
		if q.Name == name {
			return q, nil
		}
	}
	return QueueWorker{}, fmt.Errorf("queue config not found for: %s", name)
}

func (m *Manager) buildConsumerConfig(q QueueWorker, index int, conn *amqp.Connection, respawn bool) ConsumerConfig {
	prefetch := q.Prefetch
	if prefetch == 0 {
		prefetch = m.config.Prefetch
	}
	suffix := "init"
	if respawn {
		suffix = "respawned"
	}

	return ConsumerConfig{
		QueueName:  q.Name,
		ConsumerID: fmt.Sprintf("%s-%s-%d", q.Name, suffix, index),
		Conn:       conn,
		SendTo:     m.config.SendTo,
		AutoAck:    m.config.AutoAck,
		Prefetch:   prefetch,
		Args:       q.Args,
	}
}
