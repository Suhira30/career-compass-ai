# Career Compass AI — Technical & Behavioral Interview Preparation Guide

## 1. How to Approach a Technical Interview

Technical interviews evaluate 4 areas: Fundamental knowledge, Problem-solving/reasoning, System design, and Communication.
Use the 5-step framework:

1. **Definition**: What is it?
2. **How It Works**: Mechanism.
3. **When to Use It**: Appropriate use cases.
4. **Trade-offs**: Limitations and disadvantages.
5. **Example**: Practical real-world example.

---

## 2. System Design Interview Preparation

System design evaluates scalability, reliability, maintainability, and security.

### System Design Step-by-Step Process:

`Requirements → Estimation → API Design → Data Model → High-Level Architecture → Detailed Design → Scalability → Reliability → Security → Trade-offs`

### 2.1 Requirement Clarification

- **Functional Requirements**: Features system must provide (e.g. create short URLs, send messages, search products).
- **Non-Functional Requirements**: System qualities (Scalability, Availability SLA, Latency, Consistency, Durability).

---

## 3. Back-of-the-Envelope Estimation

- **Average QPS** = $\frac{\text{Daily Requests}}{86,400}$.
- **Peak QPS** = Average QPS $\times$ Peak Multiplier (typically $3\times$ to $5\times$).
- **Storage** = Number of Records $\times$ Average Record Size $\times$ Retention Period.
- **Bandwidth** = QPS $\times$ Average Response Size.

---

## 4. High-Level System Architecture & Component Selection

Common scalable pattern:
`Client → CDN → Load Balancer → Application Services → Cache (Redis) → Database (Primary/Replicas)`
Asynchronous decoupling pattern:
`Application → Message Queue (Kafka/RabbitMQ) → Worker -> Database / External Service`

---

## 5. API Design & Idempotency

- **REST Resource Design**: `POST /api/v1/orders`, `GET /api/v1/orders/{orderId}`, `GET /api/v1/orders?page=1&limit=20`.
- **Idempotency**: An operation is idempotent if performing it multiple times produces the exact same result as performing it once (crucial for payment APIs & retry loops).

---

## 6. Database Selection & Indexing

- **Relational (PostgreSQL, MySQL)**: ACID compliance, structured data, transactions, complex joins.
- **NoSQL (MongoDB, DynamoDB)**: High throughput, horizontal partitioning, flexible schema.
- **Database Indexing (B-Tree)**: Improves read performance by avoiding full table scans.
  - _Costs_: Extra storage, slower `INSERT`/`UPDATE`/`DELETE` writes.
  - _When NOT to index_: Small tables, columns with low selectivity, rarely queried columns, high-write tables.

---

## 7. Caching Strategies (Redis)

- **Cache-Aside**: App checks Cache -> If miss, read DB -> Write to Cache -> Return. (Most common).
- **Write-Through**: App writes to Cache -> Cache writes synchronously to DB.
- **Write-Back**: App writes to Cache -> Cache writes asynchronously to DB. (Risk of data loss on crash).
- **Challenges**: Cache invalidation, stale data, cache stampede, cache penetration.

---

## 8. Database & Infrastructure Scaling

- **Vertical Scaling**: Upgrade CPU/RAM on single node.
- **Horizontal Scaling**: Add more application nodes behind Load Balancer (requires stateless apps).
- **Database Scaling**: Read Replicas (handles read-heavy traffic), Partitioning, Sharding (distribute data by Shard Key across database nodes).

---

## 9. Message Brokers: Kafka vs. RabbitMQ

- **Apache Kafka**: High-throughput event streaming, append-only log durability, event replay, multiple consumers, stream processing.
- **RabbitMQ**: Traditional task queuing, complex message routing, request/worker pattern.

---

## 10. Concurrency, Parallelism & Python Specifics

- **Process vs. Thread**: Process has isolated virtual memory space. Threads in same process share memory heap.
- **Concurrency vs. Parallelism**: Concurrency is dealing with multiple things at once; Parallelism is doing multiple things at the same time on multi-core CPUs.
- **Python GIL (Global Interpreter Lock)**:
  - _Threading_: Great for I/O-bound tasks (network requests, database calls).
  - _asyncio_: Event loop for high-concurrency async I/O.
  - _Multiprocessing_: Bypasses GIL for CPU-bound computation across multiple CPU cores.

---

## 11. AI & LLM Engineering Interview Prep

### RAG Architecture

Pipeline: `Documents → Parsing → Chunking → Embeddings → Vector DB → Retrieval → Reranking → Context → LLM → Answer`.

### Key RAG Techniques

- **Chunking**: Fixed-size vs Recursive (`RecursiveCharacterTextSplitter`) vs Semantic chunking.
- **Embeddings**: Converting text to dense numerical vectors (`sentence-transformers`, 384 dims).
- **Vector Databases**: ChromaDB, Pinecone, Qdrant. Storing Vector + Document + Metadata.
- **Hybrid Search**: Combining Dense Vector Similarity Search + Keyword Lexical Search (BM25).
- **Reranking**: Cross-encoder scoring of retrieved candidate chunks against query.
- **Parent-Child Retrieval**: Retrieve small child chunk for precision, pass large parent section to LLM for context completeness.
- **RAG Metrics**:
  - _Retrieval_: Hit@K, Recall@K, Precision@K, MRR (Mean Reciprocal Rank).
  - _Generation_: Faithfulness, Answer Relevance, Groundedness, Citation Accuracy.

---

## 12. Behavioral Interviewing (STAR Method)

Structure all story responses using **STAR**:

- **S - Situation**: Context and background.
- **T - Task**: Your exact responsibility and goal.
- **A - Action**: Specific technical steps, decisions, and tools YOU personally used.
- **R - Result**: Quantifiable outcomes (e.g. "Reduced API latency by 40%", "Increased unit test coverage to 88%").
