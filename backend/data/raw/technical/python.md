---
skill: python
category: programming_languages
difficulty: beginner-to-advanced
content_type: technical_knowledge
interview_relevance: high
---

# Python for Backend & AI Engineering

## Overview

Python is a dynamically typed, interpreted, high-level language renowned for developer velocity, rich standard library, and dominance in backend microservices, data engineering, and artificial intelligence.

## Core Interview Areas

- Memory Management & Garbage Collection (Reference Counting + Cyclic Garbage Collector)
- Global Interpreter Lock (GIL) and its implications on CPU-bound vs I/O-bound concurrency
- Python 3.10+ Type Hinting & Generics (`typing`, `Protocol`, `TypeVar`, `Annotated`)
- Generators & Iterators (`yield`, memory efficiency for large datasets)
- Decorators and Metaclasses (Function wrappers, `@wraps`, class decorators)
- Object-Oriented Design (Dunder methods: `__init__`, `__repr__`, `__enter__`, `__exit__`)
- Concurrency Paradigms: Multithreading vs Multiprocessing vs `asyncio` Event Loop
- Context Managers (`with` statement, custom resource management)

## Memory Management & The GIL

- **Reference Counting**: Every Python object tracks its active references. When count reaches zero, memory is deallocated immediately.
- **Cycle Detector**: Periodically cleans circular references that reference counting alone cannot resolve.
- **Global Interpreter Lock (GIL)**: A mutex that prevents multiple native OS threads from executing Python bytecodes simultaneously.
  - _I/O-Bound Workloads_: `asyncio` or threading work well because the GIL is released during socket/disk waiting.
  - _CPU-Bound Workloads_: Use `multiprocessing` or native C/Rust extensions (`numpy`, `polars`) to utilize multi-core parallelism.

## Concurrency Framework: AsyncIO

- **Event Loop**: Single-threaded cooperative multitasking managing coroutines via non-blocking sockets.
- **Key Rules**:
  - Never call blocking functions (e.g. `time.sleep()`, synchronous database drivers) inside `async def` without `run_in_executor()`.
  - Use `asyncio.gather()` for concurrent independent tasks.
  - Use `asyncio.create_task()` to schedule background tasks.

## Scenario Questions

- How do you profile and eliminate a memory leak in a production Python service?
- When would you choose `multiprocessing` over `asyncio`?
- How does Python's `asyncio` event loop differ from Node.js event loop?
- Explain how `@lru_cache` works and what happens with unhashable arguments.

## Verified Official Learning Links

- Python Official Documentation: https://docs.python.org/3/
- Python AsyncIO High-Level APIs: https://docs.python.org/3/library/asyncio.html
- Python Memory Management Guide (Real Python): https://realpython.com/python-memory-management/
- PEP 8 — Style Guide for Python Code: https://peps.python.org/pep-0008/
