package main

import (
	"log"
	"log/slog"
	"os"

	"github.com/anthdm/hollywood/actor"
	"libs/golang/actors/server/server"
	"libs/golang/actors/common/cmd"
)

func main() {
	slog.SetLogLoggerLevel(slog.LevelDebug)

	consulAddr := os.Getenv("CONSUL_ADDR")
	if len(consulAddr) == 0 {
		log.Fatal("you FORGOT to set the CONSUL_ADDR in the environment")
	}

	httpServerAddr := os.Getenv("HTTP_SERVER_ADDR")
	if len(httpServerAddr) == 0 {
		log.Fatal("you FORGOT to set the HTTP_SERVER_ADDR in the environment")
	}

	e, err := actor.NewEngine(actor.NewEngineConfig())
	if err != nil {
		log.Fatal(err)
	}

	pid := e.Spawn(server.New(httpServerAddr), "server")

	cmd.WaitTillShutdown(e, pid)
}
