package nats

// error types are used in the metrics to identify the kind of error
type ErrorType string

const (
	ErrCreateStream     ErrorType = "create_stream"
	ErrCreateConsumer   ErrorType = "create_consumer"
	ErrStreamNotFound   ErrorType = "stream_404"
	ErrConsumerNotFound ErrorType = "consumer_404"
	ErrMsgNotFound      ErrorType = "msg_404"
	ErrConsumeHandler   ErrorType = "consume_handler"
	ErrStartConsumer    ErrorType = "start_consumer"
	ErrDecode           ErrorType = "decode_error"
)

func reportError(err error, et ErrorType, h func(error, string)) {
	if err == nil {
		return
	}

	if h == nil {
		return
	}

	go h(err, string(et))
}
