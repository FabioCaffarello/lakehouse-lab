package main

import (
	"flag"
	"log"
	"os"

	input "libs/golang/actors/consumers/input/consumer"
	"libs/golang/actors/common/cmd"
	"libs/golang/actors/common/settings/config"

	"github.com/anthdm/hollywood/actor"
	"github.com/joho/godotenv"
)

func main() {
	consulAddr := os.Getenv("CONSUL_ADDR")
	if len(consulAddr) == 0 {
		log.Fatal("you FORGOT to set the CONSUL_ADDR in the environment")
	}

	natsUrl := os.Getenv("NATS_URL")
	if len(natsUrl) == 0 {
		log.Fatal("you FORGOT tTo set the NATS_URL in the environment")
	}

	scope := flag.String("scope", "input", "scope of the consumer")
	flag.Parse()

	e, err := actor.NewEngine(actor.NewEngineConfig())
	if err != nil {
		log.Fatal(err.Error())
	}

	var pid *actor.PID
	switch *scope{
	case config.Input:
		pid = e.Spawn(input.New(), "consumer", actor.WithID(config.Input))
	default:
		log.Fatalf("invalid or unsupported scope: %s", *scope)
	}

	cmd.WaitTillShutdown(e, pid)
}
