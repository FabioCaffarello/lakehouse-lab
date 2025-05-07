//go:build integration
package nats_test

import (
	"context"
	"sync"
	"os"
	"testing"
	"time"

	"github.com/nats-io/nats.go/jetstream"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	libnats "libs/golang/actors/common/nats/nats"
)

const (
	consumerStreamName  = "trades"               // <-- StreamType deve ser um valor válido
	consumerSubject     = "trades.BINANCE.BTCUSDT"
	handlerErrorSubject = "trades.BINANCE.ETHUSDT"
	multiMsgSubject     = "trades.BINANCE.LTCUSDT"
)

func setupConsumerSuite(t *testing.T, subject string) (*libnats.NatsProducer, *libnats.NatsConsumer) {
	t.Helper()
	os.Setenv("NATS_URL", "nats://127.0.0.1:4222")

	streamCfg := jetstream.StreamConfig{
		Name:     consumerStreamName,
		Subjects: []string{subject},
		Storage:  jetstream.MemoryStorage,
	}

	producer := libnats.NewNatsProducer([]jetstream.StreamConfig{streamCfg})
	err := producer.Setup()
	require.NoError(t, err)

	quitch := make(chan struct{})
	consumer := libnats.NewNatsConsumer(quitch)
	require.NoError(t, consumer.Connect())

	t.Cleanup(func() {
		_ = consumer.Close()
		_ = producer.Close()
	})

	return producer, consumer
}

func TestNatsConsumerSuite(t *testing.T) {
	t.Run("TestConsume_Success", func(t *testing.T) {
		producer, consumer := setupConsumerSuite(t, consumerSubject)

		var received []byte
		var mu sync.Mutex
		var wg sync.WaitGroup
		wg.Add(1)

		_, err := consumer.NewConsumer(libnats.ConsumerParams{
			Subject: libnats.Subject{
				StreamType: libnats.StreamTypeTrade, // <-- string constante
				Exchange:   "BINANCE",
				Symbol:     "BTCUSDT",
			},
			Durable: "consumer-success",
			Handler: func(data []byte, _ *jetstream.MsgMetadata) error {
				mu.Lock()
				defer mu.Unlock()
				received = data
				wg.Done()
				return nil
			},
		})
		require.NoError(t, err)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		expected := []byte("hello consumer")
		err = producer.Publish(ctx, libnats.PublishParams{
			Subject: consumerSubject,
			Msg:     expected,
		})
		require.NoError(t, err)

		waitCh := make(chan struct{})
		go func() {
			wg.Wait()
			close(waitCh)
		}()

		select {
		case <-waitCh:
		case <-time.After(5 * time.Second):
			t.Fatal("timeout waiting for message")
		}

		mu.Lock()
		assert.Equal(t, expected, received)
		mu.Unlock()
	})
}
