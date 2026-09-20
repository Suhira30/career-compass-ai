---
skill: fastapi
category: backend_frameworks
difficulty: intermediate-to-advanced
content_type: technical_knowledge
interview_relevance: high
---

# FastAPI & Modern Python Microservices

## Overview

FastAPI is a modern, high-performance web framework for building REST and GraphQL APIs with Python 3.8+ based on standard Python type hints, Starlette (for async web capabilities), and Pydantic (for data validation).

## Core Architecture & Interview Areas

- Starlette ASGI Foundation (Asynchronous Server Gateway Interface)
- Pydantic v2 Data Validation & Serialization (`BaseModel`, `Field`, `model_validate`, `model_dump`)
- Dependency Injection System (`Depends()`, hierarchical dependencies, yield dependencies for cleanup)
- Route Definitions: `async def` (coroutine on event loop) vs `def` (runs in external threadpool)
- Middleware & CORS configuration
- Background Tasks (`BackgroundTasks` parameter vs Celery/Redis for distributed queues)
- Centralized Exception Handling (`HTTPException`, `@app.exception_handler`)
- OpenAPI & Swagger Documentation Generation (`/docs`, `/redoc`)

## Dependency Injection Mechanism

FastAPI's `Depends()` allows declarative injection of shared business logic:

- Database Session Lifecycle:
  ```python
  def get_db():
      db = SessionLocal()
      try:
          yield db
      finally:
          db.close()
  ```
- Sub-dependencies are resolved once per request and can be mocked easily in unit tests with `app.dependency_overrides`.

## Route Execution: Async vs Sync

- If an endpoint is declared `async def`, FastAPI runs it directly on the main event loop thread. If it contains blocking I/O, it blocks the entire server!
- If an endpoint is declared regular `def`, FastAPI offloads it to a separate threadpool (`anyio.to_thread.run_sync`), preventing event loop blockage.

## Scenario Questions

- How does FastAPI handle 10,000 concurrent requests without blocking?
- What are yield dependencies in FastAPI and why are they vital for database transactions?
- How do you structure a production-grade multi-tier FastAPI application?
- When should you use FastAPI `BackgroundTasks` versus an external broker like Celery with Redis/RabbitMQ?

## Verified Official Learning Links

- FastAPI Official Documentation: https://fastapi.tiangolo.com/
- FastAPI Tutorial — User Guide: https://fastapi.tiangolo.com/tutorial/
- Pydantic v2 Documentation: https://docs.pydantic.dev/latest/
- Starlette ASGI Toolkit: https://starlette.dev/
