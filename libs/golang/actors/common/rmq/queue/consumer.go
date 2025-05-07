package queue

import (
	"log/slog"
	"sync"
	"time"
	"fmt"

	"github.com/anthdm/hollywood/actor"
	"github.com/streadway/amqp"
)

type RabbitMessage struct {
	Data   []byte
	RecvAt time.Time
}

type Consumer struct {
	c        *actor.Context
	config   ConsumerConfig
	channel  *amqp.Channel
	quitch   chan struct{}
	stopOnce sync.Once
}

func NewConsumer(config ConsumerConfig) actor.Producer {
	return func() actor.Receiver {
		return &Consumer{
			config: config,
			quitch: make(chan struct{}),
		}
	}
}

func (c *Consumer) Receive(ac *actor.Context) {
	switch msg := ac.Message().(type) {
	case actor.Started:
		c.c = ac
		go c.connect()

	case actor.Stopped:
		c.Stop()

	default:
		slog.Debug("unhandled message", "type", fmt.Sprintf("%T", msg))
	}
}

func (c *Consumer) connect() {
	ch, err := c.config.Conn.Channel()
	if err != nil {
		slog.Error("failed to open RabbitMQ channel", "err", err.Error())
		return
	}
	c.channel = ch

	if c.config.Prefetch > 0 {
		_ = ch.Qos(c.config.Prefetch, 0, false)
	}

	_, err = ch.QueueDeclare(
		c.config.QueueName,
		true,
		false,
		false,
		false,
		c.config.Args,
	)
	if err != nil {
		slog.Error("failed to declare RabbitMQ queue", "err", err.Error())
		return
	}

	msgs, err := ch.Consume(
		c.config.QueueName,
		c.config.ConsumerID,
		c.config.AutoAck,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		slog.Error("failed to register RabbitMQ consumer", "err", err.Error())
		return
	}

	for {
		select {
		case <-c.quitch:
			return
		case msg, ok := <-msgs:
			if !ok {
				slog.Warn("channel closed")
				return
			}
			c.c.Send(c.config.SendTo, RabbitMessage{
				Data:   msg.Body,
				RecvAt: time.Now(),
			})
		}
	}
}

func (c *Consumer) Stop() {
	c.stopOnce.Do(func() {
		close(c.quitch)
		if c.channel != nil {
			_ = c.channel.Close()
		}
	})
}
