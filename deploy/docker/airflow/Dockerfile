FROM apache/airflow:slim-latest-python3.12

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    curl \
    ca-certificates \
    libpq-dev \
    openjdk-17-jdk && \
    apt-get clean

ENV JAVA_HOME /usr/lib/jvm/java-17-openjdk-amd64


USER airflow

COPY requirements.txt ./
RUN pip install -r requirements.txt
