FROM alpine:latest

WORKDIR /app

RUN apk update && apk add curl

COPY dist/actor .

CMD ["./actor"]
