//go:build integration
// +build integration

package queue_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"

	"github.com/anthdm/hollywood/actor"
	"github.com/streadway/amqp"

	queue "libs/golang/actors/common/rmq/queue"
)

type ProducerIntegrationTestSuite struct {
	suite.Suite
	engine    *actor.Engine
	conn      *amqp.Connection
	queueName string
	msgCh     <-chan amqp.Delivery
	producer  *actor.PID
}

func (s *ProducerIntegrationTestSuite) SetupSuite() {
	var err error
	s.conn, err = amqp.Dial("amqp://guest:guest@localhost:5672/")
	require.NoError(s.T(), err)

	s.queueName = "test-producer-suite"
	ch, err := s.conn.Channel()
	require.NoError(s.T(), err)

	_, err = ch.QueueDeclare(s.queueName, true, false, false, false, nil)
	require.NoError(s.T(), err)

	s.msgCh, err = ch.Consume(s.queueName, "", true, false, false, false, nil)
	require.NoError(s.T(), err)

	s.engine, err = actor.NewEngine(actor.NewEngineConfig())
	require.NoError(s.T(), err)

	producer := queue.NewProducer(queue.ProducerConfig{Conn: s.conn})
	s.producer = s.engine.Spawn(producer, "test-producer")

	time.Sleep(500 * time.Millisecond)
}

func (s *ProducerIntegrationTestSuite) TearDownSuite() {
	_ = s.conn.Close()
}

func (s *ProducerIntegrationTestSuite) publishAndAssert(body []byte) {
	s.engine.Send(s.producer, queue.PublishMessage{
		Exchange:   "",
		RoutingKey: s.queueName,
		ContentType: "text/plain",
		Body:       body,
	})

	select {
	case msg := <-s.msgCh:
		s.Equal(string(body), string(msg.Body))
	case <-time.After(3 * time.Second):
		s.T().Fatal("timeout waiting for published message")
	}
}

func (s *ProducerIntegrationTestSuite) TestShouldPublishMessageToQueue() {
	s.publishAndAssert([]byte("hello from producer"))
}

func (s *ProducerIntegrationTestSuite) TestShouldPublishMessageWithHeaders() {
	body := []byte("message with header")
	headers := amqp.Table{"x-flag": "value"}

	s.engine.Send(s.producer, queue.PublishMessage{
		Exchange:    "",
		RoutingKey:  s.queueName,
		ContentType: "text/plain",
		Body:        body,
		Headers:     headers,
	})

	select {
	case msg := <-s.msgCh:
		s.Equal(string(body), string(msg.Body))
		s.Equal("value", msg.Headers["x-flag"])
	case <-time.After(3 * time.Second):
		s.T().Fatal("timeout waiting for headered message")
	}
}

func (s *ProducerIntegrationTestSuite) TestShouldFailOnInvalidExchange() {
	s.engine.Send(s.producer, queue.PublishMessage{
		Exchange:    "invalid-exchange",
		RoutingKey:  s.queueName,
		ContentType: "text/plain",
		Body:        []byte("this should fail"),
	})
	time.Sleep(500 * time.Millisecond)
}

func (s *ProducerIntegrationTestSuite) TestConcurrentPublishes() {
	const count = 10
	body := []byte("concurrent")
	done := make(chan bool, count)

	for i := 0; i < count; i++ {
		go func() {
			s.engine.Send(s.producer, queue.PublishMessage{
				Exchange:    "",
				RoutingKey:  s.queueName,
				ContentType: "text/plain",
				Body:        body,
			})
			done <- true
		}()
	}

	received := 0
	timeout := time.After(4 * time.Second)
	for received < count {
		select {
		case msg := <-s.msgCh:
			s.Equal(string(body), string(msg.Body))
			received++
		case <-timeout:
			s.T().Fatalf("only received %d out of %d messages", received, count)
			return
		}
	}
}

func TestProducerIntegration(t *testing.T) {
	suite.Run(t, new(ProducerIntegrationTestSuite))
}
