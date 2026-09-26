"""
Stage 1: Retrieval & Benchmark Context Preparation for Ragas Evaluation
Career Compass AI — EXP-RAG-02 Phase 1 (Verbose Step-by-Step Terminal Inspector)

Shows every granular step:
1. Document loading & chunking statistics
2. Embedding model initialization (BAAI/bge-small-en-v1.5)
3. For each question:
   - Query embedding call
   - Retrieved parent context chunks (with text snippets and source files)
   - Verified ground-truth answer
4. JSON export confirmation
"""

import sys
import os
import json
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple

# Force UTF-8 on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

console = Console()

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

try:
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:
    from langchain_community.embeddings import HuggingFaceEmbeddings

logging.basicConfig(level=logging.ERROR)  # Suppress internal noisy logs for clean terminal view

RAW_DATA_DIR = BASE_DIR / "data" / "raw"
OUTPUT_FILE = BASE_DIR / "data" / "ragas_evaluation_contexts.json"

# 10 Golden Benchmark Queries with Authoritative Ground Truth Reference Answers
BENCHMARK_DATASET = [
    {
        "id": "Q01",
        "question": "How do I structure my behavioral interview responses using the STAR method?",
        "target_source": "interview_prep.md",
        "ground_truth": (
            "The STAR method structures behavioral interview answers into four parts: "
            "Situation (set the context and background), Task (describe your responsibility or challenge), "
            "Action (explain the specific technical steps and decisions you personally took), and "
            "Result (share quantifiable outcomes, such as reduced API latency or increased test coverage)."
        ),
        "required_concepts": ["situation", "task", "action", "result"],
    },
    {
        "id": "Q02",
        "question": "What is the estimated learning time and roadmap for Docker containerization?",
        "target_source": "upskilling_modules.md",
        "ground_truth": (
            "The estimated learning time for Docker containerization is 10–15 hours. "
            "The roadmap covers container fundamentals versus VMs, building images with Dockerfiles "
            "and multi-stage builds, orchestrating multi-container environments using Docker Compose, "
            "container networking, and persisting data with Docker volumes."
        ),
        "required_concepts": ["10–15 hours", "dockerfile", "docker compose", "volumes"],
    },
    {
        "id": "Q03",
        "question": "What are the core concepts and utility types of TypeScript for JavaScript developers?",
        "target_source": "upskilling_modules.md",
        "ground_truth": (
            "TypeScript core concepts include static typing, interfaces, type aliases, generics, union types, "
            "intersection types, and strict mode. Key utility types for JavaScript developers include "
            "Partial (makes all properties optional), Pick (selects a set of properties), and "
            "Omit (constructs a type by picking all properties and then removing Keys)."
        ),
        "required_concepts": ["partial", "pick", "omit", "interfaces", "type aliases"],
    },
    {
        "id": "Q04",
        "question": "What are the parent skills and prerequisites for Spring Boot in backend engineering?",
        "target_source": "skill_taxonomies.md",
        "ground_truth": (
            "Prerequisites for Spring Boot include strong foundations in Java programming, "
            "Object-Oriented Programming (OOP) principles, HTTP protocol basics, RESTful API architecture, "
            "and core Spring Framework concepts such as Dependency Injection (DI) and Inversion of Control (IoC)."
        ),
        "required_concepts": ["java", "oop", "http", "rest", "spring framework"],
    },
    {
        "id": "Q05",
        "question": "When should I use Apache Kafka instead of RabbitMQ in system design?",
        "target_source": "interview_prep.md",
        "ground_truth": (
            "Use Apache Kafka for high-throughput event streaming, distributed log durability, "
            "message replayability, stream processing, and multiple independent consumer groups. "
            "Use RabbitMQ for traditional task queuing, complex AMQP message routing, granular message "
            "acknowledgments, and standard request/worker patterns."
        ),
        "required_concepts": ["high-throughput", "event streaming", "log durability", "replay"],
    },
    {
        "id": "Q06",
        "question": "How does Python handle concurrency between threading, asyncio, and multiprocessing?",
        "target_source": "interview_prep.md",
        "ground_truth": (
            "Python concurrency differs based on the Global Interpreter Lock (GIL): "
            "Threading is suitable for I/O-bound tasks where threads share memory heap; "
            "asyncio uses an asynchronous event loop for single-threaded high-concurrency non-blocking I/O; "
            "Multiprocessing bypasses the GIL by creating separate OS processes with isolated memory to achieve true parallelism for CPU-bound computations."
        ),
        "required_concepts": ["gil", "i/o-bound", "event loop", "cpu-intensive"],
    },
    {
        "id": "Q07",
        "question": "What is the difference between Cosine similarity, Dense embeddings, and RAG chunking?",
        "target_source": "skill_taxonomies.md",
        "ground_truth": (
            "Dense embeddings convert textual data into high-dimensional numerical vectors capturing semantic meaning. "
            "RAG chunking splits large documents into smaller semantic units (e.g. fixed-size, recursive, or parent-child chunks) for indexing. "
            "Cosine similarity measures the angle between query and document embedding vectors to determine semantic closeness."
        ),
        "required_concepts": ["dense embeddings", "chunking", "cosine similarity"],
    },
    {
        "id": "Q08",
        "question": "What are the steps for back-of-the-envelope storage and QPS estimation in system design?",
        "target_source": "interview_prep.md",
        "ground_truth": (
            "Back-of-the-envelope estimation in system design calculates Average QPS as daily requests divided by 86,400 seconds, "
            "Peak QPS by multiplying average QPS by a peak factor (typically 3x to 5x), storage as number of records times average record size times retention period, "
            "and bandwidth as QPS times average response payload size."
        ),
        "required_concepts": ["qps", "86,400", "peak multiplier", "storage estimation"],
    },
    {
        "id": "Q09",
        "question": "What Kubernetes resources are required to deploy a multi-service containerized app?",
        "target_source": "upskilling_modules.md",
        "ground_truth": (
            "Deploying a multi-service containerized application on Kubernetes requires Pods (atomic container instances), "
            "Deployments (declarative updates and replica scaling), Services (stable internal networking and load balancing), "
            "ConfigMaps and Secrets (configuration and credentials), and Ingress (external HTTP/HTTPS traffic routing)."
        ),
        "required_concepts": ["pods", "deployments", "services", "configmaps", "secrets", "ingress"],
    },
    {
        "id": "Q10",
        "question": "What cost and performance trade-offs exist for database B-Tree indexing?",
        "target_source": "interview_prep.md",
        "ground_truth": (
            "Database B-Tree indexes improve read performance by enabling logarithmic lookups and avoiding full table scans. "
            "The trade-offs include additional disk storage overhead and slower write performance during INSERT, UPDATE, and DELETE operations. "
            "Indexes should not be used on small tables, columns with low selectivity, or high-write tables."
        ),
        "required_concepts": ["read performance", "write overhead", "selectivity", "full table scan"],
    },
]


def load_raw_documents() -> List[Document]:
    """Loads all markdown curriculum documents from backend/data/raw/."""
    docs = []
    for filepath in RAW_DATA_DIR.glob("*.md"):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            docs.append(Document(page_content=content, metadata={"source": filepath.name}))
    return docs


def build_parent_child_index():
    """Builds winning 3A-K5 Parent-Child Retriever (Child 250c, Parent 1500c)."""
    console.print("\n[bold cyan]STEP 1: Document Loading & Parent-Child Splitting[/bold cyan]")
    raw_docs = load_raw_documents()
    console.print(f"  • Loaded [green]{len(raw_docs)}[/green] markdown documents from [dim]{RAW_DATA_DIR}[/dim]")

    parent_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=150)
    child_splitter = RecursiveCharacterTextSplitter(chunk_size=250, chunk_overlap=35)

    child_docs = []
    parent_map = {}

    parents = parent_splitter.split_documents(raw_docs)
    for p in parents:
        p_id = str(uuid.uuid4())
        p.metadata["parent_id"] = p_id
        parent_map[p_id] = p

        children = child_splitter.split_documents([p])
        for c in children:
            c.metadata["parent_id"] = p_id
            c.metadata["source"] = p.metadata.get("source", "unknown")
            child_docs.append(c)

    console.print(f"  • Created [bold yellow]{len(parents)}[/bold yellow] Parent chunks (1500 chars each)")
    console.print(f"  • Created [bold yellow]{len(child_docs)}[/bold yellow] Child chunks (250 chars each)")

    console.print("\n[bold cyan]STEP 2: Initializing Dense Embedding Model & Chroma Vector Store[/bold cyan]")
    console.print("  • Embedding Model: [bold green]BAAI/bge-small-en-v1.5[/bold green] (384 dimensions)")
    embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    console.print("  • Indexing child chunks into ChromaDB...")
    temp_vector_store = Chroma.from_documents(child_docs, embeddings)
    console.print("  • [bold green]✓ Vector Indexing Complete![/bold green]")

    return temp_vector_store, parent_map


def retrieve_chunks_verbose(vector_store, parent_map, query: str, top_k: int = 5):
    """Retrieves top chunks and returns detailed information."""
    matched_children = vector_store.similarity_search(query, k=top_k)
    seen_parents = set()
    parent_records = []

    for idx, child in enumerate(matched_children, 1):
        p_id = child.metadata.get("parent_id")
        source = child.metadata.get("source", "unknown")
        if p_id and p_id in parent_map and p_id not in seen_parents:
            seen_parents.add(p_id)
            parent_doc = parent_map[p_id]
            parent_records.append({
                "rank": len(parent_records) + 1,
                "child_rank": idx,
                "source": source,
                "parent_id": p_id[:8],
                "char_length": len(parent_doc.page_content),
                "text": parent_doc.page_content,
            })

    return parent_records


def main():
    console.print(Panel.fit(
        "[bold white on blue] CAREER COMPASS AI — VERBOSE RAG RETRIEVAL INSPECTOR [/bold white on blue]\n"
        "[italic]Demonstrating live Vector Search, Parent-Child Chunking, and Context Extraction[/italic]",
        box=box.DOUBLE
    ))

    vector_store, parent_map = build_parent_child_index()

    console.print("\n[bold cyan]STEP 3: Querying Vector DB for Each Benchmark Question[/bold cyan]")

    dataset_records = []

    for item in BENCHMARK_DATASET:
        q_id = item["id"]
        q_text = item["question"]
        gt_text = item["ground_truth"]
        source = item["target_source"]

        console.print("\n" + "─" * 78)
        console.print(f"[bold magenta][{q_id}] QUESTION:[/bold magenta] [bold white]{q_text}[/bold white]")
        console.print(f"[cyan]Target Curriculum Source:[/cyan] [dim]{source}[/dim]")
        console.print(f"[yellow]Action:[/yellow] Calling [bold]BAAI/bge-small-en-v1.5[/bold] embedding → Searching ChromaDB...")

        retrieved_details = retrieve_chunks_verbose(vector_store, parent_map, q_text, top_k=5)
        raw_chunks = [r["text"] for r in retrieved_details]

        console.print(f"[bold green]✓ Vector DB returned {len(retrieved_details)} parent context chunks:[/bold green]")

        # Print each chunk detail
        for r in retrieved_details:
            preview = r["text"].replace("\n", " ")[:140]
            console.print(
                f"   [bold yellow]Chunk #{r['rank']}[/bold yellow] "
                f"[dim](Source: {r['source']} | Length: {r['char_length']} chars | Parent ID: {r['parent_id']}):[/dim]\n"
                f"   [white]\"{preview}...\"[/white]"
            )

        console.print(f"[bold blue]Ground Truth Reference Answer:[/bold blue]\n   [italic green]\"{gt_text[:160]}...\"[/italic green]")

        record = {
            "id": q_id,
            "question": q_text,
            "target_source": source,
            "ground_truth": gt_text,
            "contexts": raw_chunks,
            "num_contexts_retrieved": len(raw_chunks),
        }
        dataset_records.append(record)

    # Save to file
    console.print("\n[bold cyan]STEP 4: Serializing Dataset for Ragas[/bold cyan]")
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset_records, f, indent=2, ensure_ascii=False)

    console.print(Panel.fit(
        f"[bold green]SUCCESS: All 10 Benchmark Questions processed![/bold green]\n"
        f"Saved contexts and ground truth to: [bold white]{OUTPUT_FILE}[/bold white]",
        box=box.ROUNDED
    ))


if __name__ == "__main__":
    main()
