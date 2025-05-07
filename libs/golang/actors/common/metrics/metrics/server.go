package metrics

import (
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/hashicorp/consul/api"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type MetricsServer struct {
	config       Config
	port         int
	consulClient *api.Client
	registration *api.AgentServiceRegistration
	server       *http.Server
	wg           sync.WaitGroup
	quitch       chan struct{}
	shutdown     chan struct{}
}

type Config struct {
	Tags      []string
	Meta      map[string]string
	ServiceID string
}

func NewMetricsServer(config Config, quitch chan struct{}) (*MetricsServer, error) {
	consulAddr := os.Getenv("CONSUL_ADDR")
	if consulAddr == "" {
		consulAddr = "127.0.0.1:8500"
	}

	consulClient, err := api.NewClient(&api.Config{
		Address: consulAddr,
	})
	if err != nil {
		slog.Warn("failed to create Consul client, metrics will still be available but not discoverable", "error", err)
		consulClient = nil
	}

	s := &MetricsServer{
		config:       config,
		consulClient: consulClient,
		quitch:       quitch,
		shutdown:     make(chan struct{}),
	}

	return s, nil
}

func (s *MetricsServer) Start() error {
	listener, err := net.Listen("tcp", "0.0.0.0:0")
	if err != nil {
		return fmt.Errorf("failed to create listener: %w", err)
	}

	// Get container hostname for Consul registration
	hostname, err := os.Hostname()
	if err != nil {
		slog.Warn("failed to get hostname, using listener IP", "error", err)
		hostname = listener.Addr().(*net.TCPAddr).IP.String()
	}

	s.port = listener.Addr().(*net.TCPAddr).Port
	slog.Info("starting metrics server", "host", hostname, "port", s.port)

	addrs, _ := net.InterfaceAddrs()
	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok &&
			!ipNet.IP.IsLoopback() &&
			ipNet.IP.To4() != nil {
			hostname = ipNet.IP.String()
			break
		}
	}

	s.server = &http.Server{
		Handler: promhttp.Handler(),
	}

	s.registration = &api.AgentServiceRegistration{
		ID:      s.config.ServiceID,
		Port:    s.port,
		Address: hostname,
		Name:    "lake-actors-cluster-metrics",
		Tags:    append(s.config.Tags, "metrics"),
		Meta:    s.config.Meta,
		Check: &api.AgentServiceCheck{
			HTTP:     fmt.Sprintf("http://%s:%d/metrics", hostname, s.port),
			Interval: "10s",
			Timeout:  "2s",
		},
	}

	s.wg.Add(1)
	go s.run(listener)

	return nil
}

func (s *MetricsServer) run(listener net.Listener) {
	defer s.wg.Done()

	// TODO:
	// this kinda got a bit out of hand, might need a rethink
	// the server should always run, regardless of consul availability
	// but we also need to handle the case where the server starts before consul is ready
	// so we should retry registering with consul

	// start the metrics server
	errChan := make(chan error, 1)
	go func() {
		errChan <- s.server.Serve(listener)
	}()

	consulDone := make(chan struct{})
	defer close(consulDone)

	// register with consul
	if s.consulClient != nil {
		registered := make(chan struct{})
		go func() {
			maxAttempts := 10
			baseDelay := time.Second * 1
			attempts := 0
			for attempts < maxAttempts {
				select {
				case <-consulDone:
					return
				default:
					if err := s.consulClient.Agent().ServiceRegister(s.registration); err != nil {
						slog.Error("failed to register metrics service with Consul", "error", err, "attempt", attempts+1)
						attempts++
						delay := baseDelay * time.Duration(1<<attempts)
						select {
						case <-consulDone:
							return
						case <-time.After(delay):
							continue
						}
					}
					close(registered)
					slog.Info("successfully registered metrics service with Consul")
					return
				}
			}
			if attempts == maxAttempts {
				slog.Error("failed to register metrics service with Consul after max attempts")
			}
		}()

		// deregister with consul
		go func() {
			select {
			case <-registered:
				<-consulDone
				if err := s.consulClient.Agent().ServiceDeregister(s.config.ServiceID); err != nil {
					slog.Error("failed to deregister metrics service", "error", err)
				}
			case <-consulDone:
			}
		}()
	} else {
		slog.Info("Consul client not found, metrics service will not be discoverable")
	}

	for {
		select {
		case err := <-errChan:
			if err != http.ErrServerClosed {
				slog.Error("Metrics server failed", "error", err)
				slog.Info("Attempting to restart metrics server")
				time.Sleep(time.Second)
				listener, err := net.Listen("tcp", fmt.Sprintf(":%d", s.port))
				if err != nil {
					slog.Error("Failed to restart metrics server", "error", err)
					return
				}
				go func() {
					errChan <- s.server.Serve(listener)
				}()
			}
		case <-s.quitch:
			slog.Info("shutting down metrics server")
			s.server.Close()
			return
		case <-s.shutdown:
			slog.Info("shutting down metrics server")
			s.server.Close()
			return
		}
	}
}

func (s *MetricsServer) Stop() {
	select {
	case <-s.shutdown:
	default:
		close(s.shutdown)
	}
	s.wg.Wait()
}

func (s *MetricsServer) Register(collector prometheus.Collector) error {
	return prometheus.Register(collector)
}

func (s *MetricsServer) RegisterAll(collectors ...prometheus.Collector) {
	for _, collector := range collectors {
		if err := s.Register(collector); err != nil {
			slog.Error("failed to register collector", "error", err)
		}
	}
}
