//go:build integration
package metrics

import (
	"io"
	"net/http"
	"strconv"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/stretchr/testify/assert"
)

func TestMetricsServer_StartAndExposeMetrics(t *testing.T) {
	quit := make(chan struct{})
	server, err := NewMetricsServer(Config{
		ServiceID: "test-metrics-server",
	}, quit)
	assert.NoError(t, err)

	go func() {
		err := server.Start()
		assert.NoError(t, err)
	}()

	time.Sleep(1 * time.Second)

	server.RegisterAll(ServerMetrics...)

	// Call some reporting functions
	ReportServerNewConnection("ok")
	ReportServerAuthRequest("success")
	ReportServerActiveConnectionsCount("online", 5)

	time.Sleep(500 * time.Millisecond)

	resp, err := http.Get("http://localhost:" +
	                      strconv.Itoa(server.port) + "/metrics")
	assert.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(t, err)

	metricsOutput := string(body)
	assert.Contains(t, metricsOutput, "server_auth_requests_total")
	assert.Contains(t, metricsOutput, "server_new_connections_total")
	assert.Contains(t, metricsOutput, "server_active_connections")

	close(quit)
	server.Stop()
}

func TestReportConsumerPublish(t *testing.T) {
	reg := prometheus.NewRegistry()

	reg.MustRegister(ConsumerPublishDuration)
	reg.MustRegister(ConsumerStreamMessageCount)

	start := time.Now()
	ReportConsumerPublish("binance", "trades", "BTCUSDT", start)

	handler := promhttp.HandlerFor(reg, promhttp.HandlerOpts{})
	req := httptest.NewRequest("GET", "/metrics", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	output := w.Body.String()
	assert.Contains(t, output, "consumer_publish_duration_us")
	assert.Contains(t, output, "consumer_stream_message_count_total")
}
