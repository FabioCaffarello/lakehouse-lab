package base

import (
	"context"
	"fmt"
	"time"

	"libs/golang/actors/common/metrics/metrics"
	"libs/golang/actors/common/nats/nats"

	"github.com/fxamacker/cbor/v2"
	"github.com/google/uuid"
	"github.com/nats-io/nats.go/jetstream"
)

func (b *BaseConsumer) GetJetstreamConfig(streams []nats.StreamType) []jetstream.StreamConfig {
	s := make([]jetstream.StreamConfig, 0, len(streams))
	for _, stream := range streams {
		s = append(s, stream.Config())
	}
	return s
}

type BaseConsumer struct {
	Exchange string
	nats     *nats.NatsProducer
	quitch   chan struct{}

	metricsServer *metrics.MetricsServer
}

func NewBaseConsumer(exchange string, quitch chan struct{}, streams []nats.StreamType) (*BaseConsumer, error) {
	bc := &BaseConsumer{
		Exchange: exchange,
		quitch:   quitch,
	}

	metricsServer, err := metrics.NewMetricsServer(metrics.Config{
		Tags:      []string{"consumer", exchange},
		ServiceID: fmt.Sprintf("consumer-%s-%s", exchange, uuid.New().String()),
	}, quitch)
	if err != nil {
		return nil, fmt.Errorf("failed to create metrics server: %w", err)
	}
	bc.metricsServer = metricsServer

	if err := metricsServer.Start(); err != nil {
		return nil, fmt.Errorf("failed to start metrics server: %w", err)
	}

	bc.metricsServer.RegisterAll(metrics.ConsumerMetrics...)
	bc.nats = nats.NewNatsProducer(bc.GetJetstreamConfig(streams))
	if err := bc.nats.Setup(); err != nil {
		return nil, fmt.Errorf("failed to connect to nats: %w", err)
	}

	return bc, nil
}

type PublishMessageParams struct {
	Stream nats.StreamType
	Symbol string
	Msg    any
	Key    string
}

func (b *BaseConsumer) PublishMessage(ctx context.Context, p PublishMessageParams) error {
	st := time.Now()

	data, err := cbor.Marshal(p.Msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	msg := nats.PublishParams{
		Subject: nats.Subject{
			StreamType: p.Stream,
			Exchange:   b.Exchange,
			Symbol:     p.Symbol,
		}.PubString(),
		Msg:   data,
		MsgID: p.Key,
	}

	if err := b.nats.Publish(ctx, msg); err != nil {
		metrics.ReportConsumerPublishError(b.Exchange, string(p.Stream), p.Symbol, err.Error())
		return fmt.Errorf("failed to publish message: %w", err)
	}

	metrics.ReportConsumerPublish(b.Exchange, string(p.Stream), p.Symbol, st)
	return nil
}

func (b *BaseConsumer) Close() error {
	if b.metricsServer != nil {
		b.metricsServer.Stop()
	}
	if b.nats != nil {
		b.nats.Close()
	}
	return nil
}
