package events

import (
	"encoding/binary"
	"fmt"
	"libs/golang/actors/common/nats/nats"
	"math"

	"github.com/anthdm/hollywood/actor"
	"github.com/cespare/xxhash/v2"
	"github.com/google/uuid"
)

type StreamData interface {
	GetTimeframe() int64
	GetPair() *Pair
}

type Pair struct {
	Exchange string `cbor:"0" json:"exchange,omitempty"`
	Symbol   string `cbor:"1" json:"symbol,omitempty"`
}

func NewPair(e string, s string) *Pair {
	return &Pair{
		Exchange: e,
		Symbol:   s,
	}
}

type Trade struct {
	ID    string  `cbor:"0" json:"id,omitempty"`
	Pair  *Pair   `cbor:"1" json:"pair,omitempty"`
	Unix  int64   `cbor:"2" json:"unix,omitempty"`
	Price float64 `cbor:"3" json:"price,omitempty"`
	Qty   float64 `cbor:"4" json:"qty,omitempty"`
	IsBuy bool    `cbor:"5" json:"isBuy,omitempty"`
}

type BookEntry struct {
	Price float64 `cbor:"0" json:"price,omitempty"`
	Size  float64 `cbor:"1" json:"size,omitempty"`
}

type BookUpdate struct {
	Unix     int64        `cbor:"0" json:"unix,omitempty"`
	Pair     *Pair        `cbor:"1" json:"pair,omitempty"`
	Asks     []*BookEntry `cbor:"2" json:"asks,omitempty"`
	Bids     []*BookEntry `cbor:"3" json:"bids,omitempty"`
	Snapshot bool         `cbor:"4" json:"snapshot,omitempty"`
}

type Stat struct {
	Pair      *Pair   `cbor:"0" json:"pair,omitempty"`
	Unix      int64   `cbor:"1" json:"unix,omitempty"`
	LiqVsell  float64 `cbor:"2" json:"liqVsell,omitempty"`
	LiqVbuy   float64 `cbor:"3" json:"liqVbuy,omitempty"`
	MarkPrice float64 `cbor:"4" json:"markPrice,omitempty"`
	Funding   float64 `cbor:"5" json:"funding,omitempty"`
	Tbuy      int64   `cbor:"6" json:"tbuy,omitempty"`
	Tsell     int64   `cbor:"7" json:"tsell,omitempty"`
	Final     bool    `cbor:"8" json:"final,omitempty"`
}

type Stats struct {
	Pair      *Pair   `cbor:"0" json:"pair,omitempty"`
	Timeframe int64   `cbor:"1" json:"timeframe,omitempty"`
	Values    []*Stat `cbor:"2" json:"values,omitempty"`
}

type LiquidationUpdate struct {
	Pair  *Pair   `cbor:"0" json:"pair,omitempty"`
	Unix  int64   `cbor:"1" json:"unix,omitempty"`
	Price float64 `cbor:"2" json:"price,omitempty"`
	Size  float64 `cbor:"3" json:"size,omitempty"`
	IsBuy bool    `cbor:"4" json:"isBuy,omitempty"`
}

type Heatmap struct {
	Pair       *Pair     `cbor:"0" json:"pair,omitempty"`
	PriceGroup float64   `cbor:"1" json:"priceGroup,omitempty"`
	MinPrice   float64   `cbor:"2" json:"minPrice,omitempty"`
	MaxPrice   float64   `cbor:"3" json:"maxPrice,omitempty"`
	MinSize    float64   `cbor:"4" json:"minSize,omitempty"`
	MaxSize    float64   `cbor:"5" json:"maxSize,omitempty"`
	Prices     []float64 `cbor:"6" json:"prices,omitempty"`
	Sizes      []float64 `cbor:"7" json:"sizes,omitempty"`
	Unix       int64     `cbor:"8" json:"unix,omitempty"`
}

type Heatmaps struct {
	Pair   *Pair      `cbor:"0" json:"pair,omitempty"`
	Values []*Heatmap `cbor:"1" json:"values,omitempty"`
}

type Volume struct {
	Pair       *Pair     `cbor:"0" json:"pair,omitempty"`
	Unix       int64     `cbor:"1" json:"unix,omitempty"`
	Timeframe  int64     `cbor:"2" json:"timeframe,omitempty"`
	Prices     []float64 `cbor:"3" json:"prices,omitempty"`
	Buys       []float64 `cbor:"4" json:"buys,omitempty"`
	Sells      []float64 `cbor:"5" json:"sells,omitempty"`
	PriceGroup float64   `cbor:"6" json:"priceGroup,omitempty"`
	Final      bool      `cbor:"7" json:"final,omitempty"`
}

type Volumes struct {
	Pair      *Pair     `cbor:"0" json:"pair,omitempty"`
	Timeframe int64     `cbor:"1" json:"timeframe,omitempty"`
	Values    []*Volume `cbor:"2" json:"values,omitempty"`
}

type Orderbook struct {
	Unix      int64     `cbor:"0" json:"unix,omitempty"`
	Pair      *Pair     `cbor:"1" json:"pair,omitempty"`
	AskPrices []float64 `cbor:"2" json:"askPrices,omitempty"`
	AskSizes  []float64 `cbor:"3" json:"askSizes,omitempty"`
	BidPrices []float64 `cbor:"4" json:"bidPrices,omitempty"`
	BidSizes  []float64 `cbor:"5" json:"bidSizes,omitempty"`
	LastPrice float64   `cbor:"6" json:"lastPrice,omitempty"`
}

type Candle struct {
	Unix  int64   `cbor:"0" json:"unix,omitempty"`
	Open  float64 `cbor:"1" json:"open,omitempty"`
	Close float64 `cbor:"2" json:"close,omitempty"`
	High  float64 `cbor:"3" json:"high,omitempty"`
	Low   float64 `cbor:"4" json:"low,omitempty"`
	Vbuy  float64 `cbor:"5" json:"vbuy,omitempty"`
	Vsell float64 `cbor:"6" json:"vsell,omitempty"`
	Tbuy  float64 `cbor:"7" json:"tbuy,omitempty"`
	Tsell float64 `cbor:"8" json:"tsell,omitempty"`
	Final bool    `cbor:"9" json:"final,omitempty"`
}

type Candles struct {
	Pair      *Pair     `cbor:"0" json:"pair,omitempty"`
	Timeframe int64     `cbor:"1" json:"timeframe,omitempty"`
	Values    []*Candle `cbor:"2" json:"values,omitempty"`
}

// Timeframe 0 means that its a continuous streams of data
// Heatmaps, orderbook and trades not really belong to a timeframe cause
// the are just a snapshot of that tick (unix).
func (t *Trade) GetTimeframe() int64             { return 0 }
func (o *Orderbook) GetTimeframe() int64         { return 0 }
func (h *Heatmap) GetTimeframe() int64           { return 0 }
func (h *Heatmaps) GetTimeframe() int64          { return 0 }
func (l *LiquidationUpdate) GetTimeframe() int64 { return 0 }
func (s *Stats) GetTimeframe() int64             { return s.Timeframe }
func (v *Volumes) GetTimeframe() int64           { return v.Timeframe }
func (c *Candles) GetTimeframe() int64           { return c.Timeframe }

func (t *Trade) GetPair() *Pair             { return t.Pair }
func (o *Orderbook) GetPair() *Pair         { return o.Pair }
func (h *Heatmap) GetPair() *Pair           { return h.Pair }
func (h *Heatmaps) GetPair() *Pair          { return h.Pair }
func (l *LiquidationUpdate) GetPair() *Pair { return l.Pair }
func (s *Stats) GetPair() *Pair             { return s.Pair }
func (v *Volumes) GetPair() *Pair           { return v.Pair }
func (c *Candles) GetPair() *Pair           { return c.Pair }

func (t *Trade) Key() string {
	return fmt.Sprintf("trade:%s:%s:%s", t.Pair.Exchange, t.Pair.Symbol, t.ID)
}

func (b *BookUpdate) Key() string {
	h := xxhash.New()
	buf := make([]byte, 8)

	for _, e := range b.Asks {
		binary.LittleEndian.PutUint64(buf, math.Float64bits(e.Price))
		h.Write(buf)
		binary.LittleEndian.PutUint64(buf, math.Float64bits(e.Size))
		h.Write(buf)
	}

	for _, e := range b.Bids {
		binary.LittleEndian.PutUint64(buf, math.Float64bits(e.Price))
		h.Write(buf)
		binary.LittleEndian.PutUint64(buf, math.Float64bits(e.Size))
		h.Write(buf)
	}
	sum := h.Sum64()
	return fmt.Sprintf("orderbook:%s:%s:%d:%x", b.Pair.Exchange, b.Pair.Symbol, b.Unix, sum)
}

func (s *Stat) Key() string {
	return fmt.Sprintf("stat:%s:%s:%d", s.Pair.Exchange, s.Pair.Symbol, s.Unix)
}

func (l *LiquidationUpdate) Key() string {
	return fmt.Sprintf("liquidation:%s:%s:%d", l.Pair.Exchange, l.Pair.Symbol, l.Unix)
}

func (h *Heatmap) Key() string {
	return fmt.Sprintf("heatmap:%s:%s:%d", h.Pair.Exchange, h.Pair.Symbol, h.Unix)
}

func (v *Volume) Key() string {
	return fmt.Sprintf("volume:%s:%s:%d", v.Pair.Exchange, v.Pair.Symbol, v.Unix)
}

func (o *Orderbook) Key() string {
	return fmt.Sprintf("orderbook:%s:%s:%d", o.Pair.Exchange, o.Pair.Symbol, o.Unix)
}

func (c *Candles) Key() string {
	if len(c.Values) == 0 {
		return uuid.New().String()
	}
	unix := c.Values[len(c.Values)-1].Unix
	return fmt.Sprintf("candle:%s:%s:%d:%d", c.Pair.Exchange, c.Pair.Symbol, c.Timeframe, unix)
}

func (v *Volumes) Key() string {
	if len(v.Values) == 0 {
		return uuid.New().String()
	}
	unix := v.Values[len(v.Values)-1].Unix
	return fmt.Sprintf("volume:%s:%s:%d:%d", v.Pair.Exchange, v.Pair.Symbol, v.Timeframe, unix)
}

func (s *Stats) Key() string {
	if len(s.Values) == 0 {
		return uuid.New().String()
	}
	unix := s.Values[len(s.Values)-1].Unix
	return fmt.Sprintf("stats:%s:%s:%d:%d", s.Pair.Exchange, s.Pair.Symbol, s.Timeframe, unix)
}

type GetRange struct {
	Stream    uint32 `cbor:"0" json:"stream,omitempty"`
	Pair      *Pair  `cbor:"1" json:"pair,omitempty"`
	Timeframe int64  `cbor:"2" json:"timeframe,omitempty"`
	From      int64  `cbor:"3" json:"from,omitempty"`
	To        int64  `cbor:"4" json:"to,omitempty"`
	Pid       string `cbor:"5" json:"pid,omitempty"`
}

type Subscribe struct {
	Subject nats.Subject
	PID     *actor.PID
}

type Unsubscribe struct {
	Subject nats.Subject
	PID     *actor.PID
}

type Stream uint32

const (
	StreamTrades Stream = iota
	StreamOrderbook
	StreamHeatmaps
	StreamHeatmap
	StreamCandles
	StreamVolumes
	StreamStats
	StreamLiquidations
	StreamConfig
)

func (s Stream) String() string {
	switch s {
	case StreamTrades:
		return "trades"
	case StreamOrderbook:
		return "orderbooks"
	case StreamCandles:
		return "candles"
	case StreamHeatmaps:
		return "heatmaps"
	case StreamHeatmap:
		return "heatmap"
	case StreamLiquidations:
		return "liquidations"
	case StreamVolumes:
		return "volumes"
	case StreamStats:
		return "stats"
	case StreamConfig:
		return "config"
	default:
		return "UNKOWN STREAM FIX THIS"
	}
}

func (s Stream) IsValid() bool {
	return s >= StreamTrades && s <= StreamConfig
}

func ClientStreamToNatsStream(s Stream) nats.StreamType {
	switch s {
	case StreamTrades:
		return nats.StreamTypeTrade
	case StreamOrderbook:
		return nats.StreamTypeRealTimeOrderbook
	case StreamHeatmaps:
		return nats.StreamTypeRealTimeHeatmap
	case StreamHeatmap:
		return nats.StreamTypeRealTimeHeatmap
	case StreamCandles:
		return nats.StreamTypeRealTimeCandle
	case StreamVolumes:
		return nats.StreamTypeRealTimeVolume
	case StreamStats:
		return nats.StreamTypeRealTimeStat
	case StreamLiquidations:
		return nats.StreamTypeLiquidation
	}
	return nats.StreamTypeWildcard
}

var _ StreamData = &Trade{}
var _ StreamData = &Heatmaps{}
var _ StreamData = &Volumes{}
var _ StreamData = &LiquidationUpdate{}
var _ StreamData = &Stats{}
var _ StreamData = &Orderbook{}
var _ StreamData = &Candles{}
