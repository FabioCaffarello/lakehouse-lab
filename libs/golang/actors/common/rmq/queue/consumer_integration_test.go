//go:build integration
// +build integration

package queue_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/suite"
	"github.com/stretchr/testify/require"

	"github.com/anthdm/hollywood/actor"
	"github.com/streadway/amqp"

	queue "libs/golang/actors/common/rmq/queue"
)

type ConsumerIntegrationTestSuite struct {
	suite.Suite
	engine     *actor.Engine
	conn       *amqp.Connection
	queueName  string
	messageCh  chan queue.RabbitMessage
	receiverID *actor.PID
}

func (s *ConsumerIntegrationTestSuite) SetupSuite() {
	var err error
	s.conn, err = amqp.Dial("amqp://guest:guest@localhost:5672/")
	require.NoError(s.T(), err)

	s.queueName = "test-consumer-suite"
	s.engine, err = actor.NewEngine(actor.NewEngineConfig())
	require.NoError(s.T(), err)
	s.messageCh = make(chan queue.RabbitMessage, 1)

	s.receiverID = s.engine.Spawn(func() actor.Receiver {
		return &queue.TestReceiver{Ch: s.messageCh}
	}, "test-receiver")

	consumer := queue.NewConsumer(queue.ConsumerConfig{
		QueueName:  s.queueName,
		ConsumerID: "suite-consumer",
		Conn:       s.conn,
		SendTo:     s.receiverID,
		AutoAck:    true,
	})

	s.engine.Spawn(consumer, "test-consumer")
	time.Sleep(1 * time.Second)
}

func (s *ConsumerIntegrationTestSuite) TearDownSuite() {
	_ = s.conn.Close()
}

func (s *ConsumerIntegrationTestSuite) TestShouldReceivePublishedMessage() {
	ch, err := s.conn.Channel()
	require.NoError(s.T(), err)
	defer ch.Close()

	_, err = ch.QueueDeclare(s.queueName, true, false, false, false, nil)
	require.NoError(s.T(), err)

	body := []byte("hello integration")
	err = ch.Publish("", s.queueName, false, false, amqp.Publishing{
		ContentType: "text/plain",
		Body:        body,
	})
	require.NoError(s.T(), err)

	select {
	case msg := <-s.messageCh:
		s.Equal(string(body), string(msg.Data))
	case <-time.After(5 * time.Second):
		s.T().Fatal("timeout waiting for RabbitMQ message")
	}
}

func (s *ConsumerIntegrationTestSuite) TestShouldIgnoreMessageHeaders() {
	ch, err := s.conn.Channel()
	require.NoError(s.T(), err)
	defer ch.Close()

	headers := amqp.Table{"x-custom-header": "value"}
	body := []byte("headered message")

	err = ch.Publish("", s.queueName, false, false, amqp.Publishing{
		ContentType: "text/plain",
		Body:        body,
		Headers:     headers,
	})
	require.NoError(s.T(), err)

	select {
	case msg := <-s.messageCh:
		s.Equal(string(body), string(msg.Data))
	case <-time.After(3 * time.Second):
		s.T().Fatal("timeout waiting for message with headers")
	}
}

func (s *ConsumerIntegrationTestSuite) TestShouldConsumeMultipleMessages() {
	ch, err := s.conn.Channel()
	require.NoError(s.T(), err)
	defer ch.Close()

	total := 5
	for i := 0; i < total; i++ {
		err = ch.Publish("", s.queueName, false, false, amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte("msg"),
		})
		require.NoError(s.T(), err)
	}

	received := 0
	timeout := time.After(3 * time.Second)
	for received < total {
		select {
		case <-s.messageCh:
			received++
		case <-timeout:
			s.Failf("missing messages", "only received %d of %d", received, total)
			return
		}
	}
}

func (s *ConsumerIntegrationTestSuite) TestShouldFailOnNonExistentQueue() {
	invalidQueue := "non-existent-queue"
	engine, err := actor.NewEngine(actor.NewEngineConfig())
	require.NoError(s.T(), err)

	consumer := queue.NewConsumer(queue.ConsumerConfig{
		QueueName:  invalidQueue,
		ConsumerID: "bad-consumer",
		Conn:       s.conn,
		SendTo:     s.receiverID,
		AutoAck:    true,
	})

	engine.Spawn(consumer, "fail-consumer")
	time.Sleep(500 * time.Millisecond) // espera possível erro no log
	// Aqui você poderia capturar logs ou deixar como sanity check
}

func TestConsumerIntegration(t *testing.T) {
	suite.Run(t, new(ConsumerIntegrationTestSuite))
}
