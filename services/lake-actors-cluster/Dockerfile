FROM alpine:latest

WORKDIR /app

RUN apk update && apk add curl

ARG SERVICE=server-actor

COPY ${SERVICE}/dist/actor .

CMD ["./actor"]
