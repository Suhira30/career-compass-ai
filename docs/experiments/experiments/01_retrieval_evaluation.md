# RAG Evaluation Experiment 01 — Stage 1: Vector Search Retriever Evaluation

## 1. Experiment Overview

| Attribute                    | Details                                                                  |
| :--------------------------- | :----------------------------------------------------------------------- |
| **Experiment ID**            | `EXP-RAG-01`                                                             |
| **Evaluation Stage**         | **Stage 1: Vector Search Retriever Evaluation** (Zero LLM Calls)         |
| **Target Service**           | `backend/app/services/rag/vector_store.py`                               |
| **Primary Vector DB**        | Pinecone Cloud Serverless (`career-compass-index`)                       |
| **Fallback Vector DB**       | Local ChromaDB (`backend/data/vector_store`)                             |
| **Embedding Model**          | `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors) |
| **Chunking Strategy**        | `RecursiveCharacterTextSplitter` (`chunk_size=500`, `chunk_overlap=50`)  |
| **Retrieval Parameter**      | Top-$K = 3$                                                              |
| **Evaluated Knowledge Base** | `skill_taxonomies.md`, `upskilling_modules.md`, `interview_prep.md`      |

---

## 2. Evaluation Objectives

The goal of this experiment is to evaluate the **vector search engine retrieval accuracy** independently before calling LLMs:

1. Determine if candidate queries retrieve the exact target knowledge chunks from our 3 raw markdown files.
2. Quantify retrieval accuracy using industry-standard Information Retrieval (IR) metrics.
3. Measure vector search query latency in milliseconds.

---

## 3. Evaluation Metrics & Target Thresholds

| Metric                         | Definition / Mathematical Formula                                                        | Target SLA Threshold |
| :----------------------------- | :--------------------------------------------------------------------------------------- | :------------------- | --------------- | --- | ------------------------------------------------------------------- | -------------- |
| **Hit Rate (Hit@3)**           | Percentage of test queries where at least 1 correct chunk appeared in the top 3 results. | **$\ge 90.0\%$**     |
| **Recall@3**                   | Fraction of relevant ground-truth context retrieved in top 3 chunks.                     | **$\ge 85.0\%$**     |
| **Mean Reciprocal Rank (MRR)** | $\text{MRR} = \frac{1}{                                                                  | Q                    | } \sum\_{i=1}^{ | Q   | } \frac{1}{\text{Rank}\_i}$ (Position of the first relevant chunk). | **$\ge 0.80$** |
| **Retrieval Latency (ms)**     | Average time in milliseconds to embed query and complete vector search.                  | **$< 50\text{ms}$**  |

---

## 4. Golden Test Dataset (10 Benchmark Candidate Queries)

| Query ID | Candidate Query Text                                                                     | Expected Target Source  | Expected Factual Keywords                                      |
| :------- | :--------------------------------------------------------------------------------------- | :---------------------- | :------------------------------------------------------------- |
| `Q01`    | How do I structure my behavioral interview responses using the STAR method?              | `interview_prep.md`     | Situation, Task, Action, Result                                |
| `Q02`    | What is the estimated learning time and roadmap for Docker containerization?             | `upskilling_modules.md` | 10–15 hours, Dockerfile, Docker Compose, volumes               |
| `Q03`    | What are the core concepts and utility types of TypeScript for JavaScript developers?    | `upskilling_modules.md` | Partial, Pick, Omit, interfaces, type aliases                  |
| `Q04`    | What are the parent skills and prerequisites for Spring Boot in backend engineering?     | `skill_taxonomies.md`   | Java, OOP, HTTP, REST, Spring Framework                        |
| `Q05`    | When should I use Apache Kafka instead of RabbitMQ in system design?                     | `interview_prep.md`     | high-throughput, event streaming, log durability, replay       |
| `Q06`    | How does Python handle concurrency between threading, asyncio, and multiprocessing?      | `interview_prep.md`     | GIL, I/O-bound, event loop, CPU-intensive                      |
| `Q07`    | What is the difference between Cosine similarity, Dense embeddings, and RAG chunking?    | `skill_taxonomies.md`   | dense embeddings, chunking, cosine similarity                  |
| `Q08`    | What are the steps for back-of-the-envelope storage and QPS estimation in system design? | `interview_prep.md`     | QPS, 86,400, peak multiplier, storage estimation               |
| `Q09`    | What Kubernetes resources are required to deploy a multi-service containerized app?      | `upskilling_modules.md` | Pods, Deployments, Services, ConfigMaps, Secrets, Ingress      |
| `Q10`    | What cost and performance trade-offs exist for database B-Tree indexing?                 | `interview_prep.md`     | read performance, write overhead, selectivity, full table scan |

---

## 5. Empirical Results Scorecard

_To be populated by executing `backend/scripts/evaluate_retriever.py`._

| Metric                         | Measured Value      | SLA Target      | Pass / Fail Status |
| :----------------------------- | :------------------ | :-------------- | :----------------- |
| **Total Test Queries**         | `10`                | `10`            | —                  |
| **Hit Rate (Hit@3)**           | _Pending Execution_ | $\ge 90.0\%$    | ⏳ Pending         |
| **Recall@3 Score**             | _Pending Execution_ | $\ge 85.0\%$    | ⏳ Pending         |
| **Mean Reciprocal Rank (MRR)** | _Pending Execution_ | $\ge 0.80$      | ⏳ Pending         |
| **Avg Query Latency (ms)**     | _Pending Execution_ | $< 50\text{ms}$ | ⏳ Pending         |

---

## 6. Query-by-Query Detailed Retrieval Log

| Query ID | Hit@3 (Y/N) | Rank of First Match | Retrieved Source | Measured Latency (ms) |
| :------- | :---------: | :-----------------: | :--------------- | :-------------------: |
| `Q01`    |     ⏳      |         ⏳          | ⏳               |          ⏳           |
| `Q02`    |     ⏳      |         ⏳          | ⏳               |          ⏳           |
| `Q03`    |     ⏳      |         ⏳          | ⏳               |          ⏳           |
| `Q04`    |     ⏳      |         ⏳          | ⏳               |          ⏳           |
| `Q05`    |     ⏳      |         ⏳          | ⏳               |          ⏳           |
| `Q06`    |     ⏳      |         ⏳          | ⏳               |          ⏳           |
| `Q07`    |     ⏳      |         ⏳          | ⏳               |          ⏳           |
| `Q08`    |     ⏳      |         ⏳          | ⏳               |          ⏳           |
| `Q09`    |     ⏳      |         ⏳          | ⏳               |          ⏳           |
| `Q10`    |     ⏳      |         ⏳          | ⏳               |          ⏳           |

---

## 7. Conclusions & Next Recommendations

- **Retriever Health**: Pending evaluation run.
- **Next Step**: Execute `backend/scripts/evaluate_retriever.py` to record empirical scores into this log.
