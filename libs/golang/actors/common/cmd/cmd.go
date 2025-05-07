package cmd

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/anthdm/hollywood/actor"
)

func WaitTillShutdown(e *actor.Engine, pids ...*actor.PID) {
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	<-interrupt

	var wg sync.WaitGroup

	for _, pid := range pids {
		wg.Add(1)
		go func(pid *actor.PID) {
			ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
			defer cancel()
			defer wg.Done()
			<-e.PoisonCtx(ctx, pid).Done()
		}(pid)
	}
	wg.Wait()
	slog.Info("shutdown complete")
}
