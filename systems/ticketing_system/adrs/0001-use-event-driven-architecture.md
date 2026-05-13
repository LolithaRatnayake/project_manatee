# 1. Use Event-Driven Architecture for Ticketing System

**Date:** 2026-05-07  
**Status:** Accepted
**ADR-ID:** 0001

## Context

We are developing a ticketing system for public events. The system must handle high-concurrency traffic spikes (e.g., when tickets for a popular event go on sale) while ensuring high availability and fault tolerance.

Currently, the system is designed as a containerized solution (manageable locally via Docker Compose) with the ultimate objective of being deployed to a multi-regional AWS cloud infrastructure to ensure maximum resilience.

Using traditional synchronous API calls (REST/gRPC) between core domain services (e.g., Inventory, Booking, Payment, and Notification) introduces tight coupling. In a multi-regional setup, synchronous chains create cascading failure risks, increase latency, and severely limit the system's ability to scale elastically during sudden traffic bursts. Furthermore, ticketing requires strict ordering for certain operations (like reserving a specific seat before processing the payment).

## Decision

We will adopt an **Event-Driven Architecture (EDA)** as the foundational communication pattern between our microservices.

Specifically:

1. **Asynchronous Communication:** Services will communicate state changes and commands via asynchronous message brokers rather than direct HTTP calls.
2. **FIFO Queues:** For transactional operations requiring strict ordering and exactly-once processing (e.g., seat reservations and checkout processing), we will implement First-In-First-Out (FIFO) message queues.
3. **Event Broadcasting:** For non-sequential reactions (e.g., sending an email confirmation or updating a read-optimized search cache after a successful booking), we will use a publish-subscribe (Pub/Sub) event bus model.
4. **Local Development:** The `docker-compose.yml` will include containerized versions of the necessary message brokers (e.g., LocalStack for AWS SQS/SNS, or RabbitMQ/Kafka) to mirror the production cloud infrastructure locally.

## Consequences

### Positive

- **Decoupling:** Services can be developed, scaled, and deployed independently.
- **Resilience & Multi-Regional Support:** If a downstream service (like Notifications) goes down or experiences high latency, upstream services (like Booking) can continue accepting requests. Messages will remain in the queue until the service recovers, which is vital for our multi-regional deployment strategy.
- **Scalability:** We can dynamically scale consumer services based on queue depth to handle massive traffic spikes during ticket releases.
- **Strict Ordering:** Leveraging FIFO queues ensures that race conditions in seat reservations are mitigated.

### Negative

- **Eventual Consistency:** The system will no longer be strongly consistent. UI/UX patterns must be updated to handle asynchronous processing (e.g., using polling or WebSockets to notify the user when a ticket is secured).
- **Operational Complexity:** Tracing a single user request across multiple asynchronous services is difficult. We must invest heavily in distributed tracing (e.g., OpenTelemetry) and centralized logging.
- **Infrastructure Overhead:** Maintaining message brokers adds complexity to both local development and cloud infrastructure management.
