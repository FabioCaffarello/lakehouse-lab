package events


import (
	"libs/golang/actors/common/metrics/metrics"
	"libs/golang/actors/common/nats/nats"
	"time"

	"github.com/fxamacker/cbor/v2"
	"github.com/nats-io/nats.go/jetstream"
)

type Registry struct {
	Stream nats.StreamType
	Fn     func(msg []byte, meta *jetstream.MsgMetadata) error
}

func CreateStreamHandler[T any](fn func(*T, *jetstream.MsgMetadata) error) func(msg []byte, meta *jetstream.MsgMetadata) error {
	return func(msg []byte, meta *jetstream.MsgMetadata) error {
		st := time.Now()
		v := new(T)
		if err := cbor.Unmarshal(msg, v); err != nil {
			reportDecode(st, string(meta.Stream), err)
			return err
		}
		reportDecode(st, string(meta.Stream), nil)
		return fn(v, meta)
	}
}

func reportDecode(st time.Time, stream string, err error) {
	if stream == "" {
		stream = "unknown"
	}
	if metrics.NatsConsumerDecodeErrorCount == nil || metrics.NatsConsumerDecodeDuration == nil {
		return
	}
	if err != nil {
		metrics.NatsConsumerDecodeErrorCount.WithLabelValues(stream).Inc()
		return
	}
	metrics.NatsConsumerDecodeDuration.WithLabelValues(stream).Observe(float64(time.Since(st).Microseconds()))
}
