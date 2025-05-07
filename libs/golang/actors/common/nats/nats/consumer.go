package nats

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

type NatsConsumer struct {
	// nats connection
	nc *nats.Conn
	// jetstream context
	js jetstream.JetStream
	// quit signal
	quitch chan struct{}
	// map of durable consumers
	cctx map[string]jetstream.ConsumeContext
	mu   sync.RWMutex
}

func NewNatsConsumer(quitch chan struct{}) *NatsConsumer {
	return &NatsConsumer{
		cctx:   make(map[string]jetstream.ConsumeContext),
		quitch: quitch,
	}
}

func (c *NatsConsumer) Connect() error {
	natsUrl := os.Getenv("NATS_URL")
	if natsUrl == "" {
		return fmt.Errorf("NATS_URL is not set")
	}
	nc, err := nats.Connect(natsUrl)
	if err != nil {
		return fmt.Errorf("failed to connect to nats: %s", err)
	}
	c.nc = nc
	slog.Info("connected to nats", "url", natsUrl)

	js, err := jetstream.New(nc)
	if err != nil {
		return fmt.Errorf("failed to create jetstream context: %s", err)
	}
	c.js = js

	return nil
}

func (c *NatsConsumer) ensureConnected() error {
	if c.nc != nil && c.nc.Status() == nats.CONNECTED && c.js != nil {
		return nil
	}

	return c.reconnect(10, time.Second*1)
}

func (c *NatsConsumer) reconnect(maxAttempts int, baseDelay time.Duration) error {
	slog.Info("reconnecting to nats", "maxAttempts", maxAttempts, "baseDelay", baseDelay)
	attempts := 0
	for attempts < maxAttempts {
		if err := c.Connect(); err == nil {
			return nil
		}
		attempts++
		delay := baseDelay * time.Duration(1<<attempts)
		slog.Info("reconnecting to nats", "attempt", attempts, "delay", delay)
		time.Sleep(delay)
	}

	return fmt.Errorf("failed to reconnect after %d attempts", maxAttempts)
}

type ConsumerParams struct {
	// subject to consume from
	Subject Subject
	// name of the durable consumer
	// if not provided, a ephemeral consumer will be created
	Durable string
	// function to handle the message
	Handler func([]byte, *jetstream.MsgMetadata) error
	// optional function for metrics
	// takes error and the error type
	OnError func(error, string)
	name    string
}

// creates and starts a new consumer to be ran in goroutine
// will return an error early if there are problems with the setup
// otherwise will return nil and the consumer will be running
func (c *NatsConsumer) NewConsumer(params ConsumerParams) (string, error) {
	if params.Handler == nil {
		return "", fmt.Errorf("handler is required")
	}

	if !params.Subject.StreamType.IsValid() {
		return "", fmt.Errorf("invalid stream type: %s", params.Subject.StreamType)
	}

	if err := c.ensureConnected(); err != nil {
		return "", err
	}

	if params.Durable == "" {
		params.name = fmt.Sprintf("consumer-%s-%s", params.Subject.StreamType, uuid.NewString())
	} else {
		params.name = params.Durable
	}

	go func() {
		for {
			select {
			case <-c.quitch:
				return
			default:
				err := c.consume(params)
				if err == nil {
					return
				}

				slog.Error("failed to consume from nats", "error", err)
				time.Sleep(time.Second * 1)
			}
		}
	}()

	return params.name, nil
}

func (c *NatsConsumer) consume(params ConsumerParams) error {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	streamConfig := params.Subject.StreamType.Config()

	// todo: can this be cleaned
	var s jetstream.Stream
	var err error
	s, _ = c.js.Stream(ctx, streamConfig.Name)
	if s == nil {
		s, err = c.js.CreateOrUpdateStream(ctx, streamConfig)
		// possible race condition if other instance creates stream before this one
		// in this case, we will get an error, so we need to check if the stream exists
		if err != nil {
			s, err = c.js.Stream(ctx, streamConfig.Name)
			if s == nil {
				return fmt.Errorf("failed to create stream: %s", err)
			}
		}
	}

	consumer, err := createConsumer(ctx, s, params)
	if err != nil {
		reportError(err, ErrCreateConsumer, params.OnError)
		slog.Error("failed to create nats consumer",
			"stream", params.Subject.SubString(), "name", params.name, "error", err)
		return err
	}

	cctx, err := consumer.Consume(func(msg jetstream.Msg) {
		meta, _ := msg.Metadata()
		if err := params.Handler(msg.Data(), meta); err != nil {
			reportError(err, ErrConsumeHandler, params.OnError)
			slog.Error("nats consumer handler returned error", "error", err,
				"stream", params.Subject.SubString(), "name", params.name)
			msg.Nak()
			return
		}
		msg.Ack()
	})

	if err != nil {
		reportError(err, ErrStartConsumer, params.OnError)
		slog.Error("failed to start consuming from nats consumer",
			"stream", params.Subject.SubString(), "name", params.name, "error", err)
		return err
	}

	c.setCtx(params.name, cctx)
	slog.Info("nats consumer started", "stream", params.Subject.SubString(), "name", params.name)

	select {
	case <-c.quitch:
		slog.Info("nats consumer stopped: quitch", "stream", params.Subject.SubString(), "name", params.name)
	case <-cctx.Closed():
		slog.Info("nats consumer stopped: closed", "stream", params.Subject.SubString(), "name", params.name)
	}

	// TODO:
	// there is a possible bug here if the consumer is closed due to some nats error (disconnect, etc)
	// in this case, the consumer will not be restarted, as we can not tell if the consumer was closed
	// due to calling cctx.Stop() or some error within the nats consumer.
	// Which means that if there is a nats error, the consumer will not be restarted and we will not
	// know about it.

	cctx.Stop()
	c.removeCtx(params.name)
	return nil
}

func createConsumer(ctx context.Context, s jetstream.Stream, params ConsumerParams) (jetstream.Consumer, error) {
	if params.Durable == "" {
		return s.CreateConsumer(ctx, jetstream.ConsumerConfig{
			Name:           params.name,
			FilterSubjects: []string{params.Subject.SubString()},
			AckPolicy:      jetstream.AckExplicitPolicy,
			DeliverPolicy:  jetstream.DeliverNewPolicy,
		})
	}

	return s.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Durable:           params.Durable,
		FilterSubjects:    []string{params.Subject.SubString()},
		AckPolicy:         jetstream.AckExplicitPolicy,
		InactiveThreshold: time.Hour * 24,
	})
}

func (c *NatsConsumer) Close() error {
	c.mu.RLock()
	for _, cctx := range c.cctx {
		cctx.Stop()
	}
	c.mu.RUnlock()
	return nil
}

func (c *NatsConsumer) setCtx(name string, cctx jetstream.ConsumeContext) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cctx[name] = cctx
}

func (c *NatsConsumer) removeCtx(name string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.cctx, name)
}

// stops a consumer based on the name returned upon creation
func (c *NatsConsumer) RemoveConsumer(name string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	cctx, ok := c.cctx[name]
	if !ok {
		return fmt.Errorf("consumer not found")
	}

	if cctx != (jetstream.ConsumeContext)(nil) {
		cctx.Stop()
	}

	delete(c.cctx, name)
	return nil
}
