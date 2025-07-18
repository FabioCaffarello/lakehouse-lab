
FROM python:3.12-slim-bullseye as builder


RUN apt-get update && apt-get upgrade -y && apt-get install -y git

COPY dist/*.tar.gz .
RUN pip install *.tar.gz
RUN rm -rf *.tar.gz

COPY rmq_queue/ /app/rmq_queue/
COPY tests/ /app/tests/
RUN mkdir /app/tests/debug
COPY hack/ /app/hack/

RUN chmod +x /app/hack/check-integration.sh

WORKDIR /app

ENV PYTHONPATH /app
ENV PYTHONDONTWRITEBYTECODE 1


