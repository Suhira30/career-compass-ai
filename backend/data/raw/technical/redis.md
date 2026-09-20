---
skill: redis
category: databases
difficulty: intermediate
content_type: technical_knowledge
interview_relevance: high
---

# Redis

## Overview

Redis is an in-memory data store commonly used for caching, fast lookups, counters, sessions, and other low-latency use cases.

## Cache-Aside

Typical flow:

`Application → Cache → Database`

On a cache miss, the application reads from the database and populates the cache.

## Write-Through

The application writes through the cache and the cache synchronously updates the database.

## Write-Back

The application writes to the cache and persistence to the database happens asynchronously.

## Important Interview Topics

- Cache-aside
- Cache invalidation
- TTL
- Cache stampede
- Cache penetration
- Stale data
- Distributed locking
- Redis data structures
- Persistence
- High availability

## Trade-offs

Caching can reduce database load and latency, but introduces consistency, invalidation, memory, and operational concerns.

## Scenario Questions

- What happens if Redis goes down?
- How do you prevent cache stampede?
- How do you handle stale cache data?
- When should you not use Redis?

## Verified Official Learning Links

- Redis Official Documentation: https://redis.io/docs/
- Redis Data Structures Guide: https://redis.io/docs/latest/develop/data-types/
- Redis University Free Courses: https://university.redis.com/
- Redis Cache-Aside Pattern Architecture: https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside
