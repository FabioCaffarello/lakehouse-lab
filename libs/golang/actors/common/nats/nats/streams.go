package nats

import (
	"fmt"
	"strings"
	"time"

	"github.com/nats-io/nats.go/jetstream"
)

type StreamType string

const (
	// from exchange consumers to processors + clients
	StreamTypeTrade       StreamType = "trades"
	StreamTypeBookUpdate  StreamType = "bookupdates"
	StreamTypePreStat     StreamType = "prestats"
	StreamTypeLiquidation StreamType = "liquidations"

	// from exchange processors to clients
	StreamTypeRealTimeCandle    StreamType = "rt_candles"
	StreamTypeRealTimeHeatmap   StreamType = "rt_heatmaps"
	StreamTypeRealTimeStat      StreamType = "rt_stats"
	StreamTypeRealTimeVolume    StreamType = "rt_volumes"
	StreamTypeRealTimeOrderbook StreamType = "rt_orderbooks"

	// from exchange processors to store
	StreamTypeStoreCandle  StreamType = "store_candles"
	StreamTypeStoreHeatmap StreamType = "store_heatmaps"
	StreamTypeStoreStat    StreamType = "store_stats"
	StreamTypeStoreVolume  StreamType = "store_volumes"

	StreamTypeWildcard StreamType = "*"
)

// get the config based on the stream type
func (s StreamType) GetStreamConfig() jetstream.StreamConfig {
	switch s {
	// realtime unfinal data streams
	// we dont need the queue to retain the data
	// as this goes directly to clients and does not need replay
	// so it used memory storage with 128MB max size
	case StreamTypeRealTimeCandle,
		StreamTypeRealTimeHeatmap,
		StreamTypeRealTimeStat,
		StreamTypeRealTimeVolume,
		StreamTypeRealTimeOrderbook:
		return jetstream.StreamConfig{
			MaxBytes: 1024 * 1024 * 128, // 128MB
			Storage:  jetstream.MemoryStorage,
			MaxAge:   time.Minute * 5,
		}

	// store final data streams
	// we need the queue to retain the data so that it can
	// be replayed to the store if it goes down
	// so it used file storage with 4GB max size
	case StreamTypeStoreCandle,
		StreamTypeStoreHeatmap,
		StreamTypeStoreStat,
		StreamTypeStoreVolume:
		return jetstream.StreamConfig{
			MaxBytes: 1024 * 1024 * 1024 * 2, // 2GB
			Storage:  jetstream.FileStorage,
			MaxAge:   time.Hour * 12,
		}

	// exchange consumer streams
	// we need the queue to retain the data
	// so it used file storage with 4GB max size
	case StreamTypeTrade,
		StreamTypeBookUpdate,
		StreamTypePreStat,
		StreamTypeLiquidation:
		return jetstream.StreamConfig{
			MaxBytes: 1024 * 1024 * 1024 * 4, // 4GB
			Storage:  jetstream.FileStorage,
			MaxAge:   time.Hour * 12,
		}
	default:
		return jetstream.StreamConfig{}
	}
}

func (s StreamType) DoesStreamUseTimeframes() bool {
	switch s {
	case StreamTypeRealTimeCandle,
		StreamTypeRealTimeStat,
		StreamTypeRealTimeVolume,
		StreamTypeStoreCandle,
		StreamTypeStoreStat,
		StreamTypeStoreVolume:
		return true
	default:
		return false
	}
}

func (s StreamType) IsValid() bool {
	switch s {
	case StreamTypeTrade,
		StreamTypeBookUpdate,
		StreamTypePreStat,
		StreamTypeLiquidation,
		StreamTypeRealTimeCandle,
		StreamTypeRealTimeHeatmap,
		StreamTypeRealTimeStat,
		StreamTypeRealTimeVolume,
		StreamTypeRealTimeOrderbook,
		StreamTypeStoreCandle,
		StreamTypeStoreHeatmap,
		StreamTypeStoreStat,
		StreamTypeStoreVolume:
		return true
	default:
		return false
	}
}

type Subject struct {
	StreamType StreamType
	Exchange   string
	Symbol     string
	Timeframe  int64
}

// get the subscribe string
// subscribe can have wildcards
func (s Subject) SubString() string {
	if s.StreamType == "" {
		s.StreamType = "*"
	}

	upperExchange := strings.ToUpper(s.Exchange)
	upperSymbol := strings.ToUpper(s.Symbol)

	if s.Timeframe != 0 {
		if upperExchange == "" {
			upperExchange = "*"
		}
		if upperSymbol == "" {
			upperSymbol = "*"
		}
		return fmt.Sprintf("%s.%s.%s.%d", s.StreamType, upperExchange, upperSymbol, s.Timeframe)
	}

	if upperSymbol != "" {
		if upperExchange == "" {
			upperExchange = "*"
		}

		if !s.StreamType.DoesStreamUseTimeframes() {
			return fmt.Sprintf("%s.%s.%s", s.StreamType, upperExchange, upperSymbol)
		}
		return fmt.Sprintf("%s.%s.%s.>", s.StreamType, upperExchange, upperSymbol)
	}
	if upperExchange != "" {
		return fmt.Sprintf("%s.%s.>", s.StreamType, upperExchange)
	}
	return fmt.Sprintf("%s.>", s.StreamType)
}

// get the publish string
// publish strings do not have wildcards
func (s Subject) PubString() string {
	if s.StreamType == "" || s.Exchange == "" || s.Symbol == "" {
		return ""
	}

	upperExchange := strings.ToUpper(s.Exchange)
	upperSymbol := strings.ToUpper(s.Symbol)

	if s.StreamType.DoesStreamUseTimeframes() {
		return fmt.Sprintf("%s.%s.%s.%d", s.StreamType, upperExchange, upperSymbol, s.Timeframe)
	}

	return fmt.Sprintf("%s.%s.%s", s.StreamType, upperExchange, upperSymbol)
}

// Name of the stream
// eg: trades
func (s StreamType) Name() string {
	return string(s)
}

// Durable name of the stream
// eg: trade:BINANCE
func (s StreamType) Durable(name string) string {
	nameUpper := strings.ToUpper(name)
	return fmt.Sprintf("%s:%s", s, nameUpper)
}

// Config of the stream
func (s StreamType) Config() jetstream.StreamConfig {
	config := s.GetStreamConfig()
	return jetstream.StreamConfig{
		Name:       s.Name(),
		Subjects:   []string{Subject{StreamType: s}.SubString()},
		MaxAge:     config.MaxAge,
		MaxBytes:   config.MaxBytes,
		Storage:    config.Storage,
		MaxMsgSize: 1024 * 1024 * 10, // 10MB
	}
}
