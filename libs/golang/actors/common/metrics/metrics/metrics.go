package metrics

import "github.com/prometheus/client_golang/prometheus"

var (
	ConsumerPublishDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "consumer_publish_duration_us",
			Help: "Time taken to publish messages in microseconds",
			Buckets: prometheus.ExponentialBuckets(1, 2, 15),
		},
		[]string{"exchange", "stream_type", "symbol"},
	)

	ConsumerStreamMessageCount = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "consumer_stream_message_count_total",
			Help: "Total number of messages published to a stream",
		},
		[]string{"exchange", "stream_type", "symbol"},
	)

	ConsumerPublishErrors = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "consumer_publish_errors_total",
			Help: "Total number of message publish errors",
		},
		[]string{"exchange", "stream_type", "symbol", "error_type"},
	)
)

// Processor Metrics
var (
	ProcessorProcessTradeDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "processor_process_trade_duration_us",
			Help: "Time taken to process trades in microseconds",
			// 1us -> 16ms
			Buckets: prometheus.ExponentialBuckets(1, 2, 15),
		},
		[]string{"processor", "exchange"},
	)

	ProcessorProcessOrderbookDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "processor_process_orderbook_duration_us",
			Help: "Time taken to process orderbooks in microseconds",
			// 1us -> 16ms
			Buckets: prometheus.ExponentialBuckets(1, 2, 15),
		},
		[]string{"processor", "exchange"},
	)

	ProcessorProcessStatDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "processor_process_stat_duration_us",
			Help: "Time taken to process stats in microseconds",
			// 1us -> 16ms
			Buckets: prometheus.ExponentialBuckets(1, 2, 15),
		},
		[]string{"processor", "exchange"},
	)

	ProcessorProcessLiquidationDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "processor_process_liquidation_duration_us",
			Help: "Time taken to process liquidations in microseconds",
			// 1us -> 16ms
			Buckets: prometheus.ExponentialBuckets(1, 2, 15),
		},
		[]string{"processor", "exchange"},
	)
)

// Store Metrics
var (
	StoreInsertionDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "store_insertion_duration_ms",
			Help: "Time taken to insert data into the database in milliseconds",
			// 1us -> 32ms
			Buckets: prometheus.ExponentialBuckets(1, 2, 16),
		},
		[]string{"stream"},
	)

	StoreInsertionErrorCount = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "store_insertion_error_count_total",
			Help: "Total number of insertion errors",
		},
		[]string{"stream", "error"},
	)

	StoreInsertionCount = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "store_insertion_count_total",
			Help: "Total number of insertions",
		},
		[]string{"stream", "exchange", "symbol"},
	)
)

// Server Metrics
var (
	ServerAuthRequests = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "server_auth_requests_total",
			Help: "Total number of auth requests",
		},
		[]string{"status"},
	)

	ServerActiveConnections = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "server_active_connections",
			Help: "Number of active connections",
		},
		[]string{"status"},
	)

	ServerNewConnections = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "server_new_connections_total",
			Help: "Total number of new connections",
		},
		[]string{"status"},
	)

	ServerWSConnectionDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "server_ws_connection_duration_seconds",
			Help: "How long each WS session lasted",
			// 1 s -> 131,072 s (~36 h)
			Buckets: prometheus.ExponentialBuckets(1, 2, 18),
		},
		[]string{"status"},
	)

	ServerWSMessagesPerSession = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "server_ws_messages_sent_total",
			Help: "Total WS messages sent per session",
		},
		[]string{"session_id"},
	)

	ServerSubscriptionCount = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "server_router_active_subscriptions",
			Help: "How many clients are subscribed to each stream",
		},
		[]string{"stream_type", "exchange", "symbol"},
	)
)

// nats
var (
	NatsConsumerDecodeDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "nats_consumer_decode_duration_us",
			Help: "Time taken to decode messages in microseconds",
			// 1 µs -> 16ms
			Buckets: prometheus.ExponentialBuckets(1, 2, 15),
		},
		[]string{"stream_type"},
	)

	NatsConsumerDecodeErrorCount = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "nats_consumer_decode_error_count_total",
			Help: "Total number of decode errors",
		},
		[]string{"stream_type"},
	)
)

var ConsumerMetrics = []prometheus.Collector{
	ConsumerPublishDuration,
	ConsumerStreamMessageCount,
	ConsumerPublishErrors,
}

var ProcessorMetrics = []prometheus.Collector{
	NatsConsumerDecodeDuration,
	NatsConsumerDecodeErrorCount,
	ProcessorProcessTradeDuration,
	ProcessorProcessOrderbookDuration,
	ProcessorProcessStatDuration,
	ProcessorProcessLiquidationDuration,
}

var StoreMetrics = []prometheus.Collector{
	StoreInsertionDuration,
	StoreInsertionErrorCount,
	StoreInsertionCount,
	NatsConsumerDecodeDuration,
	NatsConsumerDecodeErrorCount,
}

var ServerMetrics = []prometheus.Collector{
	ServerAuthRequests,
	ServerActiveConnections,
	ServerNewConnections,
	ServerWSConnectionDuration,
	ServerWSMessagesPerSession,
	ServerSubscriptionCount,
	NatsConsumerDecodeDuration,
	NatsConsumerDecodeErrorCount,
}
