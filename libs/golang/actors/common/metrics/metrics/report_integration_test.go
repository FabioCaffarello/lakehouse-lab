//go:build integration
package metrics

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/stretchr/testify/assert"
)

func setupTestRegistry(collectors ...prometheus.Collector) *prometheus.Registry {
	reg := prometheus.NewRegistry()
	for _, c := range collectors {
		reg.MustRegister(c)
	}
	return reg
}

func TestReportConsumerPublishAndError(t *testing.T) {
	reg := setupTestRegistry(ConsumerPublishDuration, ConsumerStreamMessageCount, ConsumerPublishErrors)

	start := time.Now()
	ReportConsumerPublish("binance", "trades", "BTCUSDT", start)
	ReportConsumerPublishError("binance", "trades", "BTCUSDT", "timeout")

	req := httptest.NewRequest("GET", "/metrics", nil)
	rec := httptest.NewRecorder()

	handler := promhttp.HandlerFor(reg, promhttp.HandlerOpts{})
	handler.ServeHTTP(rec, req)

	output := rec.Body.String()

	assert.Contains(t, output, "consumer_publish_duration_us")
	assert.Contains(t, output, "consumer_stream_message_count_total")
	assert.Contains(t, output, "consumer_publish_errors_total")
}

func TestReportStoreMetrics(t *testing.T) {
	reg := setupTestRegistry(StoreInsertionDuration, StoreInsertionCount, StoreInsertionErrorCount)

	start := time.Now()
	ReportStoreInsertion("trades", "binance", "BTCUSDT", start)
	ReportStoreInsertError("trades", "db_write_failed")

	req := httptest.NewRequest("GET", "/metrics", nil)
	rec := httptest.NewRecorder()
	handler := promhttp.HandlerFor(reg, promhttp.HandlerOpts{})
	handler.ServeHTTP(rec, req)

	output := rec.Body.String()
	assert.Contains(t, output, "store_insertion_duration_ms")
	assert.Contains(t, output, "store_insertion_count_total")
	assert.Contains(t, output, "store_insertion_error_count_total")
}
