package nats

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

type NatsProducer struct {
	nc      *nats.Conn
	js      jetstream.JetStream
	streams []jetstream.StreamConfig
}

func NewNatsProducer(streams []jetstream.StreamConfig) *NatsProducer {
	if streams == nil {
		streams = make([]jetstream.StreamConfig, 0)
	}

	return &NatsProducer{
		streams: streams,
	}
}

func (p *NatsProducer) Setup() error {
	natsUrl := os.Getenv("NATS_URL")
	if natsUrl == "" {
		return fmt.Errorf("NATS_URL is not set")
	}

	nc, err := nats.Connect(natsUrl)
	if err != nil {
		return fmt.Errorf("failed to connect to nats: %s", err)
	}
	p.nc = nc
	slog.Info("connected to nats", "url", natsUrl)

	js, err := jetstream.New(nc)
	if err != nil {
		return fmt.Errorf("failed to create jetstream context: %s", err)
	}
	p.js = js

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	return p.ensureStreams(ctx)
}

// ensure streams creates the streams if they do not exisit
func (p *NatsProducer) ensureStreams(ctx context.Context) error {
	for _, stream := range p.streams {
		s, _ := p.js.Stream(ctx, stream.Name)
		slog.Info("stream", "name", stream.Name, "exists", s != nil)

		if s == nil {
			slog.Info("stream does not exist, creating", "name", stream.Name)
			_, err := p.js.CreateStream(ctx, stream)
			if err != nil {
				return fmt.Errorf("failed to create stream %s: %w", stream.Name, err)
			}
			slog.Info("stream created", "name", stream.Name)
		}

	}
	return nil
}

func (p *NatsProducer) ensureConnected() error {
	if p.nc == nil {
		slog.Error("nats connection is nil, attempting to reconnect")
		return p.reconnect(10, time.Second*1)
	}

	if p.js == nil {
		slog.Error("jetstream context is nil, attempting to reconnect")
		return p.reconnect(10, time.Second*1)
	}

	if p.nc.Status() != nats.CONNECTED {
		slog.Error("nats connection is not connected", "status", p.nc.Status())
		return p.reconnect(10, time.Second*1)
	}

	return nil
}

func (p *NatsProducer) reconnect(maxAttempts int, baseDelay time.Duration) error {
	slog.Info("reconnecting to nats", "maxAttempts", maxAttempts, "baseDelay", baseDelay)
	attempts := 0
	for attempts < maxAttempts {
		if err := p.Setup(); err == nil {
			return nil
		}
		attempts++
		delay := baseDelay * time.Duration(1<<attempts)
		slog.Info("reconnecting to nats", "attempt", attempts, "delay", delay)
		time.Sleep(delay)
	}

	return fmt.Errorf("failed to reconnect after %d attempts", maxAttempts)
}

type PublishParams struct {
	// message subject
	Subject string
	// bytes to be published
	Msg []byte
	// MsgID used for deduplication, must be unique
	MsgID string
}

func (p *NatsProducer) Publish(ctx context.Context, params PublishParams) error {
	if err := p.ensureConnected(); err != nil {
		return err
	}

	if params.Subject == "" {
		return fmt.Errorf("missing subject")
	}

	if len(params.Msg) == 0 {
		return fmt.Errorf("empty message")
	}

	if params.MsgID == "" {
		params.MsgID = uuid.NewString()
	}

	_, err := p.js.Publish(ctx, params.Subject, params.Msg, jetstream.WithMsgID(params.MsgID))
	if err != nil {
		return fmt.Errorf("failed to publish message to %s: %w", params.Subject, err)
	}

	return nil
}

func (p *NatsProducer) Close() error {
	if p.nc != nil {
		p.nc.Close()
	}
	return nil
}
