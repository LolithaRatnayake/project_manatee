# 3. Containerize Local Development Environment

**Date:** 2026-05-07  
**Status:** Accepted
**ADR-ID:** 0003

## Context

Our ticketing system is designed to be highly resilient and multi-regional. However, for a Solution Architect or Developer to verify changes, test event-driven flows, or detect architecture drift, they need a consistent environment that mirrors production without the cost or latency of cloud resources.

Historically, "it works on my machine" issues arise when developers have different versions of runtimes (Python/Node), databases, or message brokers installed locally. Furthermore, our decision to use Event-Driven Architecture (ADR 0001) and FIFO Queues (ADR 0002) requires specific infrastructure components (like SQS/SNS or RabbitMQ) that are difficult to manage manually across different operating systems.

## Decision

We will use **Docker and Docker Compose** as the primary vehicle for local development and architectural validation.

Specifically:

1. **Service Isolation:** Every microservice (Booking, Inventory, Payment, etc.) will have its own `Dockerfile` using a slim, production-parity base image.
2. **Infrastructure Mocking:** We will use containerized versions of our cloud-native services. For example, using `localstack/localstack` to provide local SQS (FIFO), SNS, and S3 APIs.
3. **Environment Parity:** The `docker-compose.yml` file will be the "source of truth" for the local system architecture. It must define networks, volumes, and environment variables consistent with our ADRs.
4. **Agent Integration:** The Architecture Drift Agent (`project_manatee`) will use this `docker-compose.yml` as the definition of the "Actual State" to compare against the "Intended State" (ADRs).

## Consequences

### Positive

- **Deterministic Environments:** New developers can run the entire ticketing stack with a single command (`docker-compose up`), ensuring everyone works on the same version of the infrastructure.
- **Architecture Visibility:** The `docker-compose.yml` file serves as a live diagram of the system's runtime architecture.
- **Simplified Drift Detection:** By containerizing, we provide a structured YAML file that our LLM-based agent can easily parse to find service discrepancies or network violations.
- **Early Testing:** We can test multi-service event flows (like FIFO queue ordering) locally before deploying to AWS.

### Negative

- **Resource Consumption:** Running a full stack (multiple microservices + LocalStack + Databases) can be heavy on system memory (RAM) and CPU.
- **Docker Overhead:** Developers must have Docker Desktop or a similar engine installed and managed.
- **Configuration Sync:** There is a risk that the `docker-compose.yml` and the actual production CloudFormation/Terraform templates might diverge, requiring the Drift Agent to be run frequently to catch these gaps.
