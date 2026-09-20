---
skill: fastapi
category: backend_frameworks
difficulty: beginner-to-advanced
content_type: interview_question
interview_relevance: high
---

# FastAPI Interview Questions & Senior Model Answers

## Beginner Tier

### Q1 — What makes FastAPI faster than Flask or Django?

**Difficulty:** Beginner  
**Topic:** ASGI Architecture & Performance

#### Ideal Answer:

- **ASGI Foundation:** Built on **Starlette**, an asynchronous server gateway interface capable of non-blocking I/O, websockets, and event-driven concurrency. Flask and traditional Django use synchronous WSGI.
- **Pydantic v2 Integration:** Data parsing and validation is compiled in Rust (pydantic-core), achieving speeds $5\times$ to $10\times$ faster than standard Python serializers.
- **Native Async:** First-class support for `async` and `await`, allowing thousands of concurrent client connections per process without worker exhaustion.

#### Follow-Up Questions:

- _"Does using async def always make your endpoint faster?"_  
  $\rightarrow$ No! If the endpoint contains CPU-heavy computation or synchronous I/O, `async def` will block the main event loop, degrading performance across all requests.

---

### Q2 — Pydantic v2 `BaseModel` Validation & Serialization

**Difficulty:** Beginner  
**Topic:** Schema Validation

#### Ideal Answer:

- **Request Validation:** When an incoming JSON payload hits a route, FastAPI uses the Pydantic model to coerce and validate types (e.g., parsing ISO strings into `datetime`, checking integers within boundaries `Field(ge=1)`). If invalid, it automatically returns HTTP 422 with precise field error paths.
- **Response Filtering:** Using `response_model=OutputSchema`, FastAPI filters out internal database fields (like password hashes or private tokens) and only serializes permitted attributes.

---

## Intermediate Tier

### Q3 — `async def` vs. Normal `def` in Route Handlers

**Difficulty:** Intermediate  
**Topic:** Event Loop & Threading Mechanics

#### Ideal Answer:

- **`async def` Routes:** FastAPI executes the function directly on the main event loop thread. If the code calls an async library (e.g., `httpx.AsyncClient()`, `asyncpg`), it yields during I/O, achieving maximum throughput.
  - _Danger:_ Calling blocking synchronous code (`time.sleep()`, synchronous SQLAlchemy) inside `async def` freezes the entire event loop for all users.
- **Normal `def` Routes:** FastAPI automatically detects that the function is synchronous and offloads it to a dedicated worker threadpool (`anyio.to_thread.run_sync`). The event loop continues processing other requests uninterrupted.

#### Interviewer Follow-Up:

- _"How should you write database endpoints if your DB driver is synchronous (like standard psycopg2)?"_  
  $\rightarrow$ Declare the endpoint as `def endpoint(...)`, NOT `async def`!

---

### Q4 — Dependency Injection Lifecycle and Yield Dependencies

**Difficulty:** Intermediate  
**Topic:** Architecture & Resource Management

#### Ideal Answer:

- FastAPI’s `Depends()` decouples business logic, authentication, database sessions, and permissions from route handlers.
- **Yield Dependencies (Resource Cleanup):** When managing database transactions or connections, using `yield` guarantees that code before `yield` runs before the route handler, and code after `yield` executes reliably after the response is sent (even if an exception was raised):
  ```python
  def get_db():
      db = SessionLocal()
      try:
          yield db
          db.commit()
      except Exception:
          db.rollback()
          raise
      finally:
          db.close()
  ```

#### Follow-Up Questions:

- _"How do you override a dependency during automated testing?"_  
  $\rightarrow$ Use `app.dependency_overrides[get_db] = get_test_db` in Pytest fixtures.

---

## Advanced Tier

### Q5 — FastAPI `BackgroundTasks` vs. External Distributed Workers (Celery / ARQ)

**Difficulty:** Advanced  
**Topic:** Distributed Systems & Asynchronous Processing

#### Ideal Answer:

- **FastAPI `BackgroundTasks`:** Runs within the same Python process in an in-memory thread or task after the HTTP response has been sent to the client.
  - _Best For:_ Lightweight operations that don't need durability (e.g. sending a confirmation email, writing an access log).
  - _Risk:_ If the server crashes, reboots, or is killed by an OOM killer, pending in-memory background tasks are permanently lost.
- **Distributed Task Queues (Celery / ARQ with Redis/RabbitMQ):**
  - _Best For:_ Long-running, compute-intensive, or mission-critical tasks (e.g., video encoding, heavy PDF/OCR parsing, training embeddings).
  - _Advantages:_ Message persistence, retries with exponential backoff, rate limiting, and dedicated worker scaling independent of the web server.

---

### Q6 — Lifespan Events in Modern FastAPI (`lifespan` context manager)

**Difficulty:** Advanced  
**Topic:** Application Lifecycle & Connection Pooling

#### Ideal Answer:

- The legacy `@app.on_event("startup")` and `@app.on_event("shutdown")` handlers are deprecated in favor of the unified ASGI **`lifespan` context manager**.
- It provides a single, structured place to initialize global singletons (like database connection pools, ML models, vector store clients) and safely tear them down:

  ```python
  from contextlib import asynccontextmanager
  from fastapi import FastAPI

  @asynccontextmanager
  async def lifespan(app: FastAPI):
      # Startup logic
      app.state.db_pool = await create_db_pool()
      app.state.embedding_model = load_embedding_model()
      yield
      # Graceful shutdown logic
      await app.state.db_pool.close()

  app = FastAPI(lifespan=lifespan)
  ```
