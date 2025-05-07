package queue

import (
	"log/slog"
	"sync"

	"github.com/anthdm/hollywood/actor"
	"github.com/streadway/amqp"
)

type PublishMessage struct {
	Exchange    string
	RoutingKey  string
	Body        []byte
	Headers     amqp.Table
	ContentType string
}

type ProducerConfig struct {
	Conn *amqp.Connection
}

type Producer struct {
	config  ProducerConfig
	channel *amqp.Channel
	lock    sync.Mutex
}

func NewProducer(config ProducerConfig) actor.Producer {
	return func() actor.Receiver {
		return &Producer{
			config: config,
		}
	}
}

func (p *Producer) ensureChannel() error {
	p.lock.Lock()
	defer p.lock.Unlock()

	if p.channel != nil {
		// try a passive call to check if still valid
		if err := p.channel.Qos(0, 0, true); err == nil {
			return nil
		}
		_ = p.channel.Close()
	}

	ch, err := p.config.Conn.Channel()
	if err != nil {
		return err
	}
	p.channel = ch
	return nil
}

func (p *Producer) Receive(c *actor.Context) {
	switch msg := c.Message().(type) {
	case actor.Started:
		if err := p.ensureChannel(); err != nil {
			slog.Error("failed to initialize channel", "err", err.Error())
		}

	case PublishMessage:
		if err := p.ensureChannel(); err != nil {
			slog.Error("failed to ensure channel", "err", err.Error())
			return
		}

		err := p.channel.Publish(
			msg.Exchange,
			msg.RoutingKey,
			false,
			false,
			amqp.Publishing{
				ContentType: msg.ContentType,
				Body:        msg.Body,
				Headers:     msg.Headers,
			},
		)
		if err != nil {
			slog.Error("failed to publish message", "err", err.Error())

			// tenta reestabelecer o canal para próximas tentativas
			_ = p.ensureChannel()
		}
	}
}
