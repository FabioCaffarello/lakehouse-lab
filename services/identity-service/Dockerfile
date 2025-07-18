FROM golang:1.24-alpine

WORKDIR /app

RUN apk update && apk add git curl

COPY go.work.docker ./go.work

COPY libs/golang /app/libs/golang
COPY services/identity-service/ /app/services/identity-service/

RUN chmod +x /app/services/identity-service/hack/check-integration.sh

WORKDIR /app/services/identity-service

RUN go mod tidy

ENTRYPOINT ["sh", "./hack/check-integration.sh"]

