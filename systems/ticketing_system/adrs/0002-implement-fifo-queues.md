# 2. Implement FIFO Queues for Transactional Ordering

**Date:** 2026-05-07  
**Status:** Accepted

## Context

Following the decision to adopt an Event-Driven Architecture (ADR 0001), we must address the specific requirements of the ticketing domain's transactional workflows.

Standard message queues and publish-subscribe (Pub/Sub) mechanisms guarantee at-least-once delivery, but they do not guarantee strict message ordering or exactly-once processing. In a high-concurrency ticketing system, out-of-order messages can lead to catastrophic business failures. For example:

1. A "Reserve Seat" command is fired.
2. A "Process Payment" command is fired.
   If the payment is processed before the seat is successfully locked in the inventory (due to network latency or retries), or if a "Cancel Reservation" message arrives before the "Reserve Seat" message, the system enters an invalid state resulting in double-bookings or unfulfilled payments.

Furthermore, standard queues may deliver the same message more than once during network partitions, which could result in a customer being charged twice for the same ticket.

## Decision

We will use **First-In-First-Out (FIFO) Queues** with exact-once processing capabilities for all critical transactional workflows (specifically: Inventory Locking, Booking State Transitions, and Payment Processing).

Specifically:

1. **Strict Ordering:** We will enforce strict ordering using FIFO queues.
2. **Message Grouping:** To maintain high throughput while ensuring order, we will utilize `Message Group IDs`. Ordering will be strictly enforced _within_ a specific group (e.g., all messages pertaining to a specific `User_ID` or `Transaction_ID` will be processed in order), allowing messages from different groups to be processed in parallel.
3. **Deduplication:** We will enforce exactly-once processing by utilizing a `Message Deduplication ID`. The broker will automatically discard duplicate messages sent within a 5-minute window, protecting against producer retry anomalies.
4. **Local Implementation:** Our `docker-compose.yml` will simulate this behavior. If we are targeting AWS SQS FIFO for production, we will use LocalStack in our compose file to provide a local SQS API. Alternatively, if using RabbitMQ, we will configure queues with `x-single-active-consumer` and deduplication plugins to mimic FIFO behavior.

## Consequences

### Positive

- **Data Integrity:** Eliminates race conditions in seat inventory management and payment processing.
- **Idempotency:** Native deduplication reduces the burden on consumer services to build complex custom logic to handle duplicate delivery of payment or reservation commands.
- **Reliability:** Ensures that state machines in the Booking Service transition correctly (e.g., Pending -> Reserved -> Paid -> Issued).

### Negative

- **Throughput Limitations:** FIFO queues inherently have lower transactions-per-second (TPS) limits compared to standard queues because the broker must pause processing for a specific Message Group until the current message is acknowledged.
- **Increased Cost:** Cloud providers typically charge a premium for FIFO queue API requests compared to standard queues.
- **Development Friction:** Developers must carefully design their payloads to include accurate `Message Group IDs` and `Deduplication IDs`. Incorrect grouping can create artificial bottlenecks (e.g., putting all events into a single group would reduce the entire system to processing one message at a time).
