# Producers

The Producers Library provides a unified interface for producing messages to external systems, with a focus on Kafka messaging. This library includes a base producer abstraction and a concrete Kafka producer implementation. It is designed to be extensible, allowing future support for additional messaging systems while maintaining a consistent API.

## Features

- **Unified Producer Interface:**
  Defines a standard interface (`BaseProducer`) for message production across different platforms.
- **Kafka Producer Implementation:**
  Provides a robust implementation (`KafkaProducerStrategy`) using Confluent Kafka for producing messages to Kafka topics.

- **Configurable and Secure:**
  Supports both plaintext and SASL_SSL configurations for secure message production.

- **Callback and Delivery Reporting:**
  Includes a delivery report mechanism that logs successful and failed message deliveries.

## Installation

To add the Producers library to your monorepo, run:

```bash
npx nx run <project>:add --name ddd-infra-producers --local
```

Ensure your environment includes all required dependencies, such as `confluent_kafka` and your logger library.

## Usage

### Instantiating the Kafka Producer

Import and create an instance of the `KafkaProducerStrategy` with the necessary configuration:

```python
from producers.infra.producers.kafka.producer import KafkaProducerStrategy

# Initialize the Kafka producer with bootstrap servers and, optionally, SASL credentials.
kafka_producer = KafkaProducerStrategy(
    bootstrap_servers="localhost:9092",
    kafka_username="your_username",  # Optional
    kafka_password="your_password"   # Optional
)
```

### Producing Messages

To produce a message to a Kafka topic, use the `produce` method. The message value should be a dictionary that will be JSON-encoded before sending:

```python
topic = "my_topic"
key = "unique_key"
value = {"event": "user_signup", "user_id": 12345}

# Produce a message to the specified topic.
kafka_producer.produce(topic, key, value)
```

The producer immediately polls for delivery events and logs the outcome using the configured callback.

### Flushing the Producer

When you need to ensure that all queued messages have been sent, call the `flush` method:

```python
# Flush any remaining messages with a timeout (in seconds).
kafka_producer.flush(timeout=30)
```

### Delivery Reporting

The producer's delivery report callback logs whether messages are successfully delivered or if they encountered errors. You can customize this behavior by extending or overriding the default callback.

## Configuration Details

- **Producer Configuration:**
  The Kafka producer is configured with options for batching, compression, and buffering. By default, it uses gzip compression and a client ID of "emulator-producer".

  - If SASL credentials are provided, the producer is configured to use SASL_SSL.
  - Otherwise, the producer uses PLAINTEXT.

- **Callback Function:**
  The `delivery_report` method is used as a callback for reporting message delivery status. Successful deliveries and errors are both logged for troubleshooting and auditing.

## Testing

Unit tests are provided to ensure that all functionality works as expected. To run the tests, navigate to the library’s directory and execute:

```bash
npx nx test ddd-infra-producers
```
