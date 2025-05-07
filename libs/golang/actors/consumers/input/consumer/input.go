package input

import (
	"context"
	"fmt"
	"log/slog"
	base "libs/golang/actors/consumers/base/consumer"
	"libs/golang/actors/common/settings/config"
	"libs/golang/actors/common/nats/nats"
	"marketmonkey/actor/consumer/ws"
	event "libs/golang/actors/common/events"
	"strconv"
	"strings"
	"time"

	"github.com/anthdm/hollywood/actor"
	"github.com/valyala/fastjson"
)

const wsEndpoint = "wss://stream.binance.com/stream?streams="

var streams = []nats.StreamType{
	nats.StreamTypeTrade,
	nats.StreamTypeBookUpdate,
}

type Input struct {
	base    *base.BaseConsumer
	tickers []string
	manager *actor.PID
	quitch  chan struct{}
}

func (b *Input) Receive(c *actor.Context) {
	switch msg := c.Message().(type) {
	case actor.Started:
		base, err := base.NewBaseConsumer(config.Input, b.quitch, streams)
		if err != nil {
			panic(err)
		}
		b.base = base
		b.start(c)
	case *ws.WsMessage:
		b.process(msg)
	case actor.Stopped:
		slog.Warn("consumer actor stopped", "consumer", config.Input)
		if b.base != nil {
			b.base.Close()
		}
		close(b.quitch)
	}
}

func New() actor.Producer {
	return func() actor.Receiver {
		return &Input{
			tickers: make([]string, 0),
			quitch:  make(chan struct{}),
		}
	}
}

func (b *Input) start(c *actor.Context) {
	market, ok := config.GetMarket(config.Input)
	if !ok {
		panic("failed to start binance market: invalid configuration")
	}
	for _, sym := range market.Symbols {
		b.tickers = append(b.tickers, sym.Ticker)
	}

	b.manager = c.SpawnChild(
		ws.NewManager(
			ws.ManagerConfig{
				SendTo:                 c.PID(),
				Exchange:               "binance",
				Tickers:                b.tickers,
				StreamsPerTicker:       2,
				MaxStreamsPerWebsocket: 1000,
				RespawnOverlap:         5 * time.Second,
				FillStrategy:           ws.FillStrategyFirst,
				MaxWebsockets:          5,
				MaxWebsocketLifetime:   2 * time.Hour,
				EndpointBuilder:        endpointBuilder,
			},
		),
		"binance-manager",
	)
}

func (b *Input) process(msg *ws.WsMessage) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	parser := fastjson.Parser{}
	v, err := parser.ParseBytes(msg.Data)
	if err != nil {
		slog.Error("failed to parse ws message", "err", err.Error())
		return
	}

	data := v.Get("data")
	stream := string(v.GetStringBytes("stream"))
	switch {
	case strings.HasSuffix(stream, "aggTrade"):
		b.handleAggTrade(ctx, data)
	case strings.HasSuffix(stream, "depth"):
		b.handleDepth(ctx, data)
	}
}

func (b *Input) handleAggTrade(ctx context.Context, data *fastjson.Value) {
	price, _ := strconv.ParseFloat(string(data.GetStringBytes("p")), 64)
	qty, _ := strconv.ParseFloat(string(data.GetStringBytes("q")), 64)
	symbol := strings.ToLower(string(data.GetStringBytes("s")))
	trade := &event.Trade{
		ID:    strconv.FormatInt(data.GetInt64("a"), 10),
		Price: price,
		Qty:   qty,
		IsBuy: !data.GetBool("m"),
		Unix:  data.GetInt64("T"),
		Pair: &event.Pair{
			Exchange: config.Binance,
			Symbol:   symbol,
		},
	}

	msg := base.PublishMessageParams{
		Stream: nats.StreamTypeTrade,
		Symbol: symbol,
		Msg:    trade,
		Key:    trade.Key(),
	}
	err := b.base.PublishMessage(ctx, msg)
	if err != nil {
		slog.Error("failed to publish trade", "err", err)
	}
}

func (b *Input) handleDepth(ctx context.Context, data *fastjson.Value) {
	var (
		asks   = data.GetArray("a")
		bids   = data.GetArray("b")
		symbol = strings.ToLower(string(data.GetStringBytes("s")))
		book   = &event.BookUpdate{
			Unix: data.GetInt64("E"),
			Pair: &event.Pair{
				Exchange: config.Binance,
				Symbol:   symbol,
			},
			Bids: make([]*event.BookEntry, 0, len(bids)),
			Asks: make([]*event.BookEntry, 0, len(asks)),
		}
	)
	for _, item := range asks {
		price, _ := strconv.ParseFloat(string(item.GetStringBytes("0")), 64)
		size, _ := strconv.ParseFloat(string(item.GetStringBytes("1")), 64)
		book.Asks = append(book.Asks, &event.BookEntry{
			Price: price,
			Size:  size,
		})
	}
	for _, item := range bids {
		price, _ := strconv.ParseFloat(string(item.GetStringBytes("0")), 64)
		size, _ := strconv.ParseFloat(string(item.GetStringBytes("1")), 64)
		book.Bids = append(book.Bids, &event.BookEntry{
			Price: price,
			Size:  size,
		})
	}

	msg := base.PublishMessageParams{
		Stream: nats.StreamTypeBookUpdate,
		Symbol: symbol,
		Msg:    book,
		Key:    book.Key(),
	}
	err := b.base.PublishMessage(ctx, msg)
	if err != nil {
		slog.Error("failed to publish book update", "err", err)
	}
}

func endpointBuilder(tickers []string) string {

	results := []string{}
	for _, ticker := range tickers {
		results = append(results, fmt.Sprintf("%s@aggTrade", strings.ToLower(ticker)))
		results = append(results, fmt.Sprintf("%s@depth", strings.ToLower(ticker)))
	}
	return fmt.Sprintf("%s%s", wsEndpoint, strings.Join(results, "/"))
}
