#!/bin/sh

SERVICE="${1:-}"
GO_WORK_ORIGINAL="go.work"
GO_WORK_DOCKER="go.work.docker"

if [ -z "$SERVICE" ]; then
  echo "You must provide a service name. Usage: $0 <service-name>"
  exit 1
fi

echo "Generating $GO_WORK_DOCKER from $GO_WORK_ORIGINAL, keeping only $SERVICE and libs..."

cp "$GO_WORK_ORIGINAL" "$GO_WORK_DOCKER"

awk -v service="$SERVICE" '
  BEGIN { in_use = 0 }
  /^use[[:space:]]*\(/ { in_use = 1; print; next }
  /^\)[[:space:]]*$/ { in_use = 0; print; next }
  in_use {
    if ($0 ~ /\/libs\// || $0 ~ service) print
    next
  }
  { print }
' "$GO_WORK_ORIGINAL" > "$GO_WORK_DOCKER"

echo "Successfully generated $GO_WORK_DOCKER for service $SERVICE."
# echo "$GO_WORK_DOCKER generated:"
# cat "$GO_WORK_DOCKER"
