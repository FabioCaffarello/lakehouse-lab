#!/bin/bash

timeout=30
interval=2
elapsed=0

echo "⏳ Waiting for RabbitMQ to be healthy..."

while [ $elapsed -lt $timeout ]; do
  status=$(docker inspect --format='{{json .State.Health.Status}}' rabbitmq 2>/dev/null | tr -d '"')
  if [ "$status" == "healthy" ]; then
    echo "✅ RabbitMQ is healthy"
    sleep $interval
    exit 0
  fi
  sleep $interval
  elapsed=$((elapsed + interval))
done

echo "❌ RabbitMQ did not become healthy in time"
exit 1
