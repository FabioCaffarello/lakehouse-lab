FROM golang:1.24-alpine

WORKDIR /app

RUN apk update && apk add git curl

COPY go.work.docker ./go.work

COPY libs/golang /app/libs/golang
COPY services/api-gateway/ /app/services/api-gateway/

RUN chmod +x /app/services/api-gateway/hack/check-integration.sh

WORKDIR /app/services/api-gateway

RUN go mod tidy

ENTRYPOINT ["sh", "./hack/check-integration.sh"]

