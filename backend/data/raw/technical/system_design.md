---
skill: system_design
category: distributed_systems
difficulty: intermediate-to-advanced
content_type: technical_knowledge
interview_relevance: high
---

# System Design

## Interview Framework

`Requirements → Estimation → API Design → Data Model → High-Level Architecture → Detailed Design → Scalability → Reliability → Security → Trade-offs`

## Requirement Clarification

### Functional Requirements

Features the system must provide.

### Non-Functional Requirements

System qualities such as:

- scalability
- availability
- latency
- consistency
- durability

## Back-of-the-Envelope Estimation

Average QPS = Daily Requests / 86,400

Peak QPS = Average QPS × Peak Multiplier

Storage = Number of Records × Average Record Size × Retention Period

Bandwidth = QPS × Average Response Size

## Common Architecture

`Client → CDN → Load Balancer → Application Services → Cache → Database`

## Asynchronous Architecture

`Application → Message Queue → Worker → Database / External Service`

## Scaling

### Vertical Scaling

Increase resources of a single machine.

### Horizontal Scaling

Add more application instances behind a load balancer.

## Database Scaling

- Read replicas
- Partitioning
- Sharding

## Interview Focus

Always explain why you selected a component and discuss its trade-offs.

## Verified Official Learning Links

- System Design Primer (Interactive Architecture Guide): https://github.com/donnemartin/system-design-primer
- Martin Fowler Software Architecture Guide: https://martinfowler.com/architecture/
- AWS Well-Architected Framework: https://aws.amazon.com/architecture/well-architected/
- High Scalability Real-World Case Studies: http://highscalability.com/
