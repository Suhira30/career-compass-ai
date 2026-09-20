---
skill: python
category: programming_languages
difficulty: beginner-to-advanced
content_type: interview_question
interview_relevance: high
---

# Python Interview Questions & Senior Model Answers

## Beginner Tier

### Q1 — Mutable Default Arguments Pitfall

**Difficulty:** Beginner  
**Topic:** Functions & Object References

#### Ideal Answer:

- Default arguments in Python are evaluated once when the function is defined, not each time the function is called.
- If a mutable object (like a `list` or `dict`) is used as a default value (`def append_to(item, target=[])`), all subsequent calls without an explicit argument share the exact same list instance in memory.
- **Correct Idiom:** Use `None` as default and assign a fresh list inside:
  ```python
  def append_to(item, target=None):
      if target is None:
          target = []
      target.append(item)
      return target
  ```

#### Follow-Up Questions:

- _"Why does Python evaluate defaults at definition time instead of call time?"_  
  $\rightarrow$ For runtime performance: bound functions avoid recreating default parameter tuples on every invocation.

#### Common Red Flags:

- Assuming a new list is created on every function call.

---

### Q2 — Deep Copy vs. Shallow Copy

**Difficulty:** Beginner  
**Topic:** Memory & References

#### Ideal Answer:

- **Shallow Copy (`copy.copy()` or `list.copy()`):** Constructs a new collection object, but inserts references to the child objects found in the original. If child objects are mutable, modifying them affects both copies.
- **Deep Copy (`copy.deepcopy()`):** Recursively constructs new collection objects and recursively duplicates all nested child objects. Modifications to nested elements never impact the original.

#### Follow-Up Questions:

- _"How does `deepcopy` handle circular references?"_  
  $\rightarrow$ It maintains an internal memo dictionary mapping object IDs to already-copied objects to avoid infinite recursion.

---

## Intermediate Tier

### Q3 — Python Memory Management: Reference Counting & Cyclic GC

**Difficulty:** Intermediate  
**Topic:** CPython Internals & Memory

#### Ideal Answer:

- **Primary Mechanism (Reference Counting):** Every Python object header contains `ob_refcnt`. When assigned or passed into a scope, refcount increments. When out of scope or `del` is called, it decrements. When it hits zero, memory is freed immediately.
- **Secondary Mechanism (Cyclic Garbage Collector):** Reference counting fails on circular references (e.g. `obj_a.b = obj_b; obj_b.a = obj_a`). CPython uses a generational cyclic garbage collector with 3 generations (Gen 0, 1, 2) that periodically identifies and frees unreachable reference cycles.

#### Follow-Up Questions:

- _"How can you optimize Python memory usage for classes with millions of instances?"_  
  $\rightarrow$ Use `__slots__` to suppress the per-instance `__dict__`, reducing memory footprint by ~60%.

#### Common Red Flags:

- Believing that `del variable` immediately deletes memory from the OS (it only decrements refcount; the OS allocator decides when to release pages).

---

### Q4 — Global Interpreter Lock (GIL) and Concurrency Paradigms

**Difficulty:** Intermediate  
**Topic:** Concurrency & Parallelism

#### Ideal Answer:

- **The GIL:** A mutual-exclusion mutex in CPython preventing multiple native OS threads from executing Python bytecodes concurrently.
- **I/O-Bound Workloads:** Python threads or `asyncio` work effectively because the GIL is released during socket, disk, or network I/O operations.
- **CPU-Bound Workloads:** Python threading cannot utilize multiple CPU cores. You must use `multiprocessing` (separate processes, each with its own interpreter and memory space) or native compiled C/Rust extensions (e.g., NumPy, Polars).

#### Follow-Up Questions:

- _"What is PEP 703 (Free-threaded Python in Python 3.13)?"_  
  $\rightarrow$ Makes the GIL optional by introducing per-object lock mechanisms (mimalloc thread-safe allocator).

#### Common Red Flags:

- Claiming Python threads run in parallel on multi-core CPUs for number-crunching algorithms.

---

### Q5 — Generators, Iterators, and the `yield` Keyword

**Difficulty:** Intermediate  
**Topic:** Iteration Protocol & Memory Efficiency

#### Ideal Answer:

- An **Iterator** is an object implementing `__iter__()` and `__next__()` raising `StopIteration` when exhausted.
- A **Generator** is a function containing `yield`. Instead of returning a full list in memory, it pauses execution and yields values lazily on demand.
- **Production Advantage:** Processing a 50GB log file with a generator consumes under 50MB of RAM, whereas reading the full list causes an Out-Of-Memory (OOM) crash.

#### Follow-Up Questions:

- _"What is the difference between `yield` and `yield from`?"_  
  $\rightarrow$ `yield from iterable` delegates iteration to a sub-generator, automatically transparently passing values and exceptions between caller and sub-generator.

---

## Advanced Tier

### Q6 — Custom Decorators and `@functools.wraps`

**Difficulty:** Advanced  
**Topic:** Functional Programming & Metaprogramming

#### Ideal Answer:

- A decorator is a higher-order callable that takes a function and returns a modified wrapper function.
- **Crucial Best Practice:** Always apply `@functools.wraps(fn)` to the inner wrapper. Without `@wraps`, the decorated function loses its identity—`__name__`, `__doc__`, and function signature are replaced by the wrapper's metadata, breaking inspection, logging, and FastAPI route docs.

  ```python
  import functools
  import time

  def timing_decorator(func):
      @functools.wraps(func)
      def wrapper(*args, **kwargs):
          t0 = time.perf_counter()
          res = func(*args, **kwargs)
          print(f"{func.__name__} took {time.perf_counter() - t0:.4f}s")
          return res
      return wrapper
  ```

---

### Q7 — Python AsyncIO Event Loop vs. Multithreading

**Difficulty:** Advanced  
**Topic:** Asynchronous Systems

#### Ideal Answer:

- **Multithreading:** Preemptive multitasking managed by OS scheduler. Context switching has kernel overhead and requires synchronization primitives (Locks, Semaphores) to prevent race conditions.
- **AsyncIO:** Cooperative single-threaded multitasking. Coroutines explicitly yield control back to the event loop via `await`. Context switching is pure user-space logic (extremely fast, handling 100,000+ open websockets/connections).
- **Golden Rule:** Never run synchronous blocking code (e.g. `requests.get()`, `time.sleep()`) directly inside an `async def`. Use `asyncio.to_thread(func)` to offload blocking tasks to an external threadpool.
