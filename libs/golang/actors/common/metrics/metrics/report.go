package metrics

import "time"

func ReportServerNewConnection(status string) {
	if ServerNewConnections == nil {
		return
	}
	ServerNewConnections.
		WithLabelValues(status).
		Inc()
}

func ReportServerAuthRequest(status string) {
	if ServerAuthRequests == nil {
		return
	}
	ServerAuthRequests.
		WithLabelValues(status).
		Inc()
}

func ReportServerActiveConnectionsCount(server string, count int) {
	if ServerActiveConnections == nil {
		return
	}
	ServerActiveConnections.
		WithLabelValues(server).
		Set(float64(count))
}

func ReportConsumerPublishError(exchange string, stream string, symbol string, err string) {
	if ConsumerPublishErrors == nil {
		return
	}
	ConsumerPublishErrors.
		WithLabelValues(exchange, stream, symbol, err).
		Inc()
}

func ReportConsumerPublish(exchange string, stream string, symbol string, start time.Time) {
	if ConsumerPublishDuration == nil || ConsumerStreamMessageCount == nil {
		return
	}
	ConsumerPublishDuration.WithLabelValues(exchange, stream, symbol).Observe(float64(time.Since(start).Microseconds()))
	ConsumerStreamMessageCount.
		WithLabelValues(exchange, stream, symbol).
		Inc()
}

func ReportProcessTrade(processor string, exchange string, start time.Time) {
	if ProcessorProcessTradeDuration == nil {
		return
	}
	ProcessorProcessTradeDuration.WithLabelValues(processor, exchange).Observe(float64(time.Since(start).Microseconds()))
}

func ReportProcessLiquidation(processor string, exchange string, start time.Time) {
	if ProcessorProcessLiquidationDuration == nil {
		return
	}
	ProcessorProcessLiquidationDuration.
		WithLabelValues(processor, exchange).
		Observe(float64(time.Since(start).Microseconds()))
}

func ReportProcessStat(processor string, exchange string, start time.Time) {
	if ProcessorProcessStatDuration == nil {
		return
	}
	ProcessorProcessStatDuration.
		WithLabelValues(processor, exchange).
		Observe(float64(time.Since(start).Microseconds()))
}

func ReportProcessOrderbook(processor string, exchange string, start time.Time) {
	if ProcessorProcessOrderbookDuration == nil {
		return
	}
	ProcessorProcessOrderbookDuration.
		WithLabelValues(processor, exchange).
		Observe(float64(time.Since(start).Microseconds()))
}

func ReportStoreInsertError(stream string, err string) {
	if StoreInsertionErrorCount == nil {
		return
	}
	StoreInsertionErrorCount.
		WithLabelValues(stream, err).
		Inc()
}

func ReportStoreInsertion(stream string, exchange string, symbol string, start time.Time) {
	if StoreInsertionDuration == nil || StoreInsertionCount == nil {
		return
	}

	StoreInsertionDuration.
		WithLabelValues(stream).
		Observe(float64(time.Since(start).Microseconds()))

	StoreInsertionCount.
		WithLabelValues(stream, exchange, symbol).
		Inc()
}

func ReportServerWSConnectionDuration(start time.Time, status string) {
	if ServerWSConnectionDuration == nil {
		return
	}
	ServerWSConnectionDuration.
		WithLabelValues(status).
		Observe(float64(time.Since(start).Seconds()))
}

func ReportServerWSMessage(sessionID string) {
	if ServerWSMessagesPerSession == nil {
		return
	}
	ServerWSMessagesPerSession.
		WithLabelValues(sessionID).
		Inc()
}

func SetServerSubscriptionCount(streamType string, exchange string, symbol string, count int) {
	if ServerSubscriptionCount == nil {
		return
	}
	ServerSubscriptionCount.
		WithLabelValues(streamType, exchange, symbol).
		Set(float64(count))
}
