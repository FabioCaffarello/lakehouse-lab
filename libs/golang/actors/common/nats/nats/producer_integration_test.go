//go:build integration

package nats_test

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/nats-io/nats.go/jetstream"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	libnats "libs/golang/actors/common/nats/nats" // ajuste conforme seu módulo
)

const (
	natsURL         = "nats://127.0.0.1:4222"
	streamName      = "TEST_STREAM_SUITE"
	streamSubject   = "suite.test.subject"
	invalidSubject  = ""
	emptyMsgSubject = "suite.test.empty"
)

func setupProducerSuite(t *testing.T) *libnats.NatsProducer {
	t.Helper()
	os.Setenv("NATS_URL", natsURL)

	streamCfg := jetstream.StreamConfig{
		Name:     streamName,
		Subjects: []string{streamSubject, emptyMsgSubject},
		Storage:  jetstream.MemoryStorage,
	}

	producer := libnats.NewNatsProducer([]jetstream.StreamConfig{streamCfg})
	err := producer.Setup()
	require.NoError(t, err, "failed to setup producer")
	t.Cleanup(func() {
		_ = producer.Close()
	})

	return producer
}

func TestNatsProducerSuite(t *testing.T) {
	t.Run("TestPublish_Success", func(t *testing.T) {
		producer := setupProducerSuite(t)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		err := producer.Publish(ctx, libnats.PublishParams{
			Subject: streamSubject,
			Msg:     []byte("successful message"),
		})
		assert.NoError(t, err, "should publish successfully")
	})

	t.Run("TestPublish_MissingSubject", func(t *testing.T) {
		producer := setupProducerSuite(t)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		err := producer.Publish(ctx, libnats.PublishParams{
			Subject: invalidSubject,
			Msg:     []byte("fail due to no subject"),
		})
		assert.ErrorContains(t, err, "missing subject")
	})

	t.Run("TestPublish_EmptyMessage", func(t *testing.T) {
		producer := setupProducerSuite(t)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		err := producer.Publish(ctx, libnats.PublishParams{
			Subject: emptyMsgSubject,
			Msg:     []byte(""),
		})
		assert.ErrorContains(t, err, "empty message")
	})

	t.Run("TestReconnect_FailsWhenNatsDown", func(t *testing.T) {
		// Somente se você tiver controle do container NATS no CI
		// Para evitar que quebre localmente sem docker-compose

		t.Skip("requires NATS to be stopped externally")

		os.Setenv("NATS_URL", "nats://localhost:65535") // porta inválida
		producer := libnats.NewNatsProducer(nil)

		err := producer.Setup()
		assert.Error(t, err, "should fail due to connection issue")
	})
}
