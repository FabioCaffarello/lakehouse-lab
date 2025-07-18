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

type ManagerIntegrationTestSuite struct {
	suite.Suite
	engine     *actor.Engine
	conn       *amqp.Connection
	queueName  string
	messageCh  chan queue.RabbitMessage
	receiverID *actor.PID
}

func (s *ManagerIntegrationTestSuite) SetupSuite() {
	var err error
	s.conn, err = amqp.Dial("amqp://guest:guest@localhost:5672/")
	require.NoError(s.T(), err)

	s.queueName = "test-manager-suite"
	s.engine, err = actor.NewEngine(actor.NewEngineConfig())
	require.NoError(s.T(), err)
	s.messageCh = make(chan queue.RabbitMessage, 10)

	s.receiverID = s.engine.Spawn(func() actor.Receiver {
		return &queue.TestReceiver{Ch: s.messageCh}
	}, "test-receiver")

	ch, err := s.conn.Channel()
	require.NoError(s.T(), err)
	_, err = ch.QueueDeclare(s.queueName, true, false, false, false, nil)
	require.NoError(s.T(), err)

	manager := queue.NewManager(queue.ManagerConfig{
		SendTo: s.receiverID,
		Queues: []queue.QueueWorker{
			{
				Name:     s.queueName,
				Workers:  2,
				Prefetch: 1,
			},
		},
		ConnProvider: func() (*amqp.Connection, error) {
			return s.conn, nil
		},
		MaxConsumerLifetime: 3 * time.Second,
		RespawnOverlap:      1 * time.Second,
		AutoAck:             true,
	})

	s.engine.Spawn(manager, "test-manager")
	time.Sleep(1 * time.Second) // garante consumidores ativos
}

func (s *ManagerIntegrationTestSuite) TearDownSuite() {
	_ = s.conn.Close()
}

func (s *ManagerIntegrationTestSuite) TestShouldDistributeMessagesAcrossWorkers() {
	ch, err := s.conn.Channel()
	require.NoError(s.T(), err)
	defer ch.Close()

	total := 5
	for i := 0; i < total; i++ {
		err := ch.Publish("", s.queueName, false, false, amqp.Publishing{
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
			s.T().Fatalf("only received %d out of %d messages", received, total)
			return
		}
	}
}

func (s *ManagerIntegrationTestSuite) TestShouldRespawnAfterLifetime() {
	// Aguarda o tempo de expiração dos consumidores e verifica se o manager ainda responde
	time.Sleep(5 * time.Second)

	ch, err := s.conn.Channel()
	require.NoError(s.T(), err)
	defer ch.Close()

	body := []byte("respawn-check")
	err = ch.Publish("", s.queueName, false, false, amqp.Publishing{
		ContentType: "text/plain",
		Body:        body,
	})
	require.NoError(s.T(), err)

	select {
	case msg := <-s.messageCh:
		s.Equal(string(body), string(msg.Data))
	case <-time.After(3 * time.Second):
		s.T().Fatal("timeout after manager respawn")
	}
}

func TestManagerIntegration(t *testing.T) {
	suite.Run(t, new(ManagerIntegrationTestSuite))
}
