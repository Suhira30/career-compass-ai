"""
Stage 1: Vector Search Retriever Evaluation Script — Career Compass AI
Experiment ID: EXP-RAG-01

Evaluates 3 Chunking Strategies across 3 Chunk Sizes (Small, Medium, Large)
and Top-K values (K=1, 3, 5) using BAAI/bge-small-en-v1.5 (512 max tokens capacity).

Calculates Precision@3, Recall@3, F1-Score@3, MRR@5, Per-Query Composite Score, and Overall Composite Winner Score.
Zero LLM calls required.
"""

import os
import sys
import time
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple

# Set backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from langchain_core.documents import Document
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    MarkdownHeaderTextSplitter,
)
from langchain_community.vectorstores import Chroma
try:
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:
    from langchain_community.embeddings import HuggingFaceEmbeddings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("evaluate_retriever")

RAW_DATA_DIR = BASE_DIR / "data" / "raw"
EVAL_DOC_PATH = BASE_DIR.parent / "docs" / "experiments" / "experiments" / "01_retrieval_evaluation.md"

# 10 Golden Benchmark Queries with Target Sources and Expected Factual Keywords
BENCHMARK_QUERIES = [
    {
        "id": "Q01",
        "query": "How do I structure my behavioral interview responses using the STAR method?",
        "target_source": "interview_prep.md",
        "keywords": ["situation", "task", "action", "result"],
    },
    {
        "id": "Q02",
        "query": "What is the estimated learning time and roadmap for Docker containerization?",
        "target_source": "upskilling_modules.md",
        "keywords": ["10–15 hours", "dockerfile", "docker compose", "volumes"],
    },
    {
        "id": "Q03",
        "query": "What are the core concepts and utility types of TypeScript for JavaScript developers?",
        "target_source": "upskilling_modules.md",
        "keywords": ["partial", "pick", "omit", "interfaces", "type aliases"],
    },
    {
        "id": "Q04",
        "query": "What are the parent skills and prerequisites for Spring Boot in backend engineering?",
        "target_source": "skill_taxonomies.md",
        "keywords": ["java", "oop", "http", "rest", "spring framework"],
    },
    {
        "id": "Q05",
        "query": "When should I use Apache Kafka instead of RabbitMQ in system design?",
        "target_source": "interview_prep.md",
        "keywords": ["high-throughput", "event streaming", "log durability", "replay"],
    },
    {
        "id": "Q06",
        "query": "How does Python handle concurrency between threading, asyncio, and multiprocessing?",
        "target_source": "interview_prep.md",
        "keywords": ["gil", "i/o-bound", "event loop", "cpu-intensive"],
    },
    {
        "id": "Q07",
        "query": "What is the difference between Cosine similarity, Dense embeddings, and RAG chunking?",
        "target_source": "skill_taxonomies.md",
        "keywords": ["dense embeddings", "chunking", "cosine similarity"],
    },
    {
        "id": "Q08",
        "query": "What are the steps for back-of-the-envelope storage and QPS estimation in system design?",
        "target_source": "interview_prep.md",
        "keywords": ["qps", "86,400", "peak multiplier", "storage estimation"],
    },
    {
        "id": "Q09",
        "query": "What Kubernetes resources are required to deploy a multi-service containerized app?",
        "target_source": "upskilling_modules.md",
        "keywords": ["pods", "deployments", "services", "configmaps", "secrets", "ingress"],
    },
    {
        "id": "Q10",
        "query": "What cost and performance trade-offs exist for database B-Tree indexing?",
        "target_source": "interview_prep.md",
        "keywords": ["read performance", "write overhead", "selectivity", "full table scan"],
    },
]


def load_raw_documents() -> List[Document]:
    """Loads raw markdown files from backend/data/raw/."""
    docs = []
    for filepath in RAW_DATA_DIR.glob("*.md"):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            docs.append(Document(page_content=content, metadata={"source": filepath.name}))
    return docs


def build_chunks_option_1(docs: List[Document], chunk_size: int, chunk_overlap: int) -> List[Document]:
    """Strategy Option 1: Two-Stage Hybrid Splitter (RecursiveCharacterTextSplitter)."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n## ", "\n### ", "\n- ", "\n\n", "\n", " ", ""],
    )
    return splitter.split_documents(docs)


def build_chunks_option_2(docs: List[Document], chunk_size: int, chunk_overlap: int) -> List[Document]:
    """Strategy Option 2: Markdown Header Splitter."""
    headers_to_split = [("#", "Header_1"), ("##", "Header_2"), ("###", "Header_3")]
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split)
    
    header_docs = []
    for doc in docs:
        split_docs = markdown_splitter.split_text(doc.page_content)
        for d in split_docs:
            d.metadata["source"] = doc.metadata.get("source", "unknown")
            header_docs.append(d)
            
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return text_splitter.split_documents(header_docs)


def build_chunks_option_3(docs: List[Document], child_chunk_size: int = 250, parent_chunk_size: int = 1200) -> Tuple[List[Document], Dict[str, Document]]:
    """Strategy Option 3: Parent-Child Splitter."""
    import uuid
    parent_splitter = RecursiveCharacterTextSplitter(chunk_size=parent_chunk_size, chunk_overlap=150)
    child_splitter = RecursiveCharacterTextSplitter(chunk_size=child_chunk_size, chunk_overlap=30)
    
    child_docs = []
    parent_map = {}
    
    parents = parent_splitter.split_documents(docs)
    for p in parents:
        p_id = str(uuid.uuid4())
        p.metadata["parent_id"] = p_id
        parent_map[p_id] = p
        
        children = child_splitter.split_documents([p])
        for c in children:
            c.metadata["parent_id"] = p_id
            c.metadata["source"] = p.metadata.get("source", "unknown")
            child_docs.append(c)
            
    return child_docs, parent_map


def evaluate_retriever_configuration(
    config_id: str,
    chunks: List[Document],
    embeddings_model: Any,
    top_k: int = 3,
    parent_map: Dict[str, Document] = None,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Runs Golden Benchmark queries against a vector store configuration and returns metrics + per-query composite scores."""
    temp_dir = BASE_DIR / "data" / "eval_temp" / config_id
    if temp_dir.exists():
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    vs = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings_model,
        persist_directory=str(temp_dir),
    )
    
    hit_1_count = 0
    hit_3_count = 0
    hit_5_count = 0
    reciprocal_ranks = []
    recall_scores = []
    precision_scores = []
    f1_scores = []
    latencies = []
    detailed_query_logs = []
    
    for item in BENCHMARK_QUERIES:
        q_id = item["id"]
        query = item["query"]
        target_src = item["target_source"].lower()
        keywords = [kw.lower() for kw in item["keywords"]]
        
        t0 = time.perf_counter()
        results = vs.similarity_search_with_score(query, k=5)
        t1 = time.perf_counter()
        latency_ms = (t1 - t0) * 1000.0
        latencies.append(latency_ms)
        
        first_match_rank = None
        relevant_chunks_in_top_k = 0
        matched_keywords_count = 0
        retrieved_source_name = "None"
        
        top_k_results = results[:top_k]
        for idx, (doc, score) in enumerate(top_k_results, 1):
            eval_doc = doc
            if parent_map and "parent_id" in doc.metadata:
                p_id = doc.metadata["parent_id"]
                eval_doc = parent_map.get(p_id, doc)
                
            content = eval_doc.page_content.lower()
            src = eval_doc.metadata.get("source", "").lower()
            
            has_keyword = any(kw in content for kw in keywords)
            has_source = target_src in src or target_src == ""
            
            if has_source and has_keyword:
                relevant_chunks_in_top_k += 1
                if first_match_rank is None:
                    first_match_rank = idx
                    retrieved_source_name = doc.metadata.get("source", "unknown")
                
                for kw in keywords:
                    if kw in content:
                        matched_keywords_count += 1
                        
        is_hit_3 = False
        if first_match_rank == 1:
            hit_1_count += 1
        if first_match_rank and first_match_rank <= 3:
            hit_3_count += 1
            is_hit_3 = True
        if first_match_rank and first_match_rank <= 5:
            hit_5_count += 1
            
        mrr_val = (1.0 / first_match_rank) if first_match_rank else 0.0
        reciprocal_ranks.append(mrr_val)
            
        prec = relevant_chunks_in_top_k / float(top_k)
        rec = min(1.0, matched_keywords_count / len(keywords)) if keywords else 0.0
        
        if prec + rec > 0:
            f1 = 2.0 * (prec * rec) / (prec + rec)
        else:
            f1 = 0.0
            
        precision_scores.append(prec)
        recall_scores.append(rec)
        f1_scores.append(f1)

        # Per-Query Composite Score Formula:
        # Score_q = (0.70 * F1_q * 100) + (0.20 * MRR_q * 100) + (0.10 * LatencyScore_q)
        q_lat_score = max(0.0, 100.0 - latency_ms)
        q_composite_score = (0.70 * f1 * 100.0) + (0.20 * mrr_val * 100.0) + (0.10 * q_lat_score)

        query_log = {
            "config_id": config_id,
            "query_id": q_id,
            "query_text": query,
            "hit_3_pass": is_hit_3,
            "rank": first_match_rank if first_match_rank else "FAIL",
            "source": retrieved_source_name,
            "precision_3": round(prec, 2),
            "recall_3": round(rec, 2),
            "f1_score_3": round(f1, 2),
            "mrr_val": round(mrr_val, 2),
            "query_composite_score": round(q_composite_score, 2),
            "latency_ms": round(latency_ms, 1),
        }
        detailed_query_logs.append(query_log)
        
        status_str = f"PASS (Rank #{first_match_rank})" if is_hit_3 else "FAIL"
        logger.info(f"  [{config_id} | {q_id}] -> {status_str:<18} | Score: {q_composite_score:5.1f}/100 | F1@3: {f1:.2f} | Latency: {latency_ms:.1f}ms")

    try:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
    except Exception:
        pass

    num_queries = len(BENCHMARK_QUERIES)
    avg_f1 = sum(f1_scores) / num_queries
    avg_mrr = sum(reciprocal_ranks) / num_queries
    avg_lat = sum(latencies) / num_queries
    
    lat_score = max(0.0, 100.0 - avg_lat)
    overall_composite_score = (0.70 * avg_f1 * 100.0) + (0.20 * avg_mrr * 100.0) + (0.10 * lat_score)

    summary_metrics = {
        "config_id": config_id,
        "hit_1_pct": (hit_1_count / num_queries) * 100.0,
        "hit_3_pct": (hit_3_count / num_queries) * 100.0,
        "hit_5_pct": (hit_5_count / num_queries) * 100.0,
        "precision_3": sum(precision_scores) / num_queries,
        "recall_3": sum(recall_scores) / num_queries,
        "f1_score_3": avg_f1,
        "mrr_5": avg_mrr,
        "composite_score": overall_composite_score,
        "avg_latency_ms": avg_lat,
    }
    
    return summary_metrics, detailed_query_logs


def update_evaluation_markdown_document(scorecard: List[Dict[str, Any]], all_logs: List[Dict[str, Any]]):
    """Automatically populates docs/experiments/experiments/01_retrieval_evaluation.md with live scores and per-query composite scores."""
    if not EVAL_DOC_PATH.exists():
        logger.warning(f"Evaluation document path '{EVAL_DOC_PATH}' not found. Skipping markdown update.")
        return

    best_config = max(scorecard, key=lambda x: x["composite_score"])

    scorecard_lines = [
        "| Config ID | Strategy Option | Chunk Size | Constant Embedding Model | Evaluated Top-$K$ | Hit@3 (%) | Precision@3 | Recall@3 | F1-Score@3 | MRR@5 | Composite Score | Avg Latency (ms) |",
        "| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |",
    ]
    
    strategy_names = {
        "1A": ("Option 1: Two-Stage Hybrid", "Small (128 tok)"),
        "1B": ("Option 1: Two-Stage Hybrid", "Medium (256 tok)"),
        "1C": ("Option 1: Two-Stage Hybrid", "Large (512 tok)"),
        "2A": ("Option 2: Markdown Header", "Small (128 tok)"),
        "2B": ("Option 2: Markdown Header", "Medium (256 tok)"),
        "2C": ("Option 2: Markdown Header", "Large (512 tok)"),
        "3A": ("Option 3: Parent-Child", "Small (128 tok)"),
        "3B": ("Option 3: Parent-Child", "Medium (256 tok)"),
        "3C": ("Option 3: Parent-Child", "Large (512 tok)"),
    }

    for r in scorecard:
        cfg_prefix = r["config_id"].split("-")[0]
        opt_name, c_size = strategy_names.get(cfg_prefix, ("Custom Strategy", "Custom Size"))
        k_str = f"$K={r['config_id'].split('-K')[1]}$" if "-K" in r["config_id"] else "$K=3$"
        scorecard_lines.append(
            f"| `{r['config_id']}` | {opt_name} | {c_size} | `bge-small-en-v1.5` | {k_str} | **{r['hit_3_pct']:.1f}%** | **{r['precision_3']:.2f}** | **{r['recall_3']:.2f}** | **{r['f1_score_3']:.2f}** | **{r['mrr_5']:.2f}** | **{r['composite_score']:.2f} / 100** | **{r['avg_latency_ms']:.1f}ms** |"
        )

    scorecard_md_table = "\n".join(scorecard_lines)

    detailed_lines = [
        "| Query ID | Configuration ID | Hit@3 Status | Rank | Precision@3 | Recall@3 | F1-Score@3 | Per-Query Composite Score | Retrieved Source | Latency (ms) |",
        "| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |",
    ]
    for log in all_logs:
        status_icon = "✅ PASS" if log["hit_3_pass"] else "❌ FAIL"
        rank_str = f"#{log['rank']}" if log['rank'] != "FAIL" else "FAIL"
        detailed_lines.append(
            f"| `{log['query_id']}` | `{log['config_id']}` | {status_icon} | `{rank_str}` | `{log['precision_3']}` | `{log['recall_3']}` | `{log['f1_score_3']}` | **`{log['query_composite_score']} / 100`** | `{log['source']}` | `{log['latency_ms']}ms` |"
        )
    detailed_md_table = "\n".join(detailed_lines)

    conclusion_text = (
        f"Based on the empirical benchmark run across all 10 Golden Queries:\n"
        f"- **Selected Winner Configuration**: `{best_config['config_id']}`\n"
        f"- **Achieved F1-Score@3**: **{best_config['f1_score_3']:.2f}** (Target: $\\ge 0.80$)\n"
        f"- **Achieved Hit@3 Rate**: **{best_config['hit_3_pct']:.1f}%** (Target: $\\ge 90\\%$)\n"
        f"- **Achieved MRR@5 Score**: **{best_config['mrr_5']:.2f}** (Target: $\\ge 0.80$)\n"
        f"- **Overall Composite Winner Score**: **{best_config['composite_score']:.2f} / 100**\n"
        f"- **Average Retrieval Latency**: **{best_config['avg_latency_ms']:.1f}ms** (Target: $< 50\\text{{ms}}$)\n"
    )

    try:
        with open(EVAL_DOC_PATH, "r", encoding="utf-8") as f:
            content = f.read()

        if "## 7. Matrix Experiment Results Scorecard" in content:
            parts = content.split("## 7. Matrix Experiment Results Scorecard")
            header_part = parts[0] + "## 7. Matrix Experiment Results Scorecard (Single Model Constant: `bge-small-en-v1.5`)\n\n"
            
            new_content = (
                header_part
                + scorecard_md_table
                + "\n\n---\n\n## 8. Detailed Query-by-Query Retrieval Log (All 100 Search Tests)\n\n"
                + detailed_md_table
                + "\n\n---\n\n## 9. Conclusions & Selected Optimal Configuration\n\n"
                + conclusion_text
            )
            with open(EVAL_DOC_PATH, "w", encoding="utf-8") as f:
                f.write(new_content)
            logger.info(f"Successfully auto-updated markdown evaluation log at '{EVAL_DOC_PATH}'!")
    except Exception as exc:
        logger.error(f"Failed to auto-update markdown document: {exc}")


def main():
    logger.info("==========================================================================")
    logger.info("   CAREER COMPASS AI — STAGE 1 RAG RETRIEVER EVALUATION BENCHMARK        ")
    logger.info("==========================================================================")
    
    raw_docs = load_raw_documents()
    logger.info(f"Loaded {len(raw_docs)} raw knowledge base files from data/raw/.")
    
    logger.info("Loading constant control embedding model: 'BAAI/bge-small-en-v1.5'...")
    embeddings_model = HuggingFaceEmbeddings(
        model_name="BAAI/bge-small-en-v1.5",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )
    
    scorecard = []
    all_100_query_logs = []
    
    configs = [
        # Option 1: Two-Stage Hybrid
        ("1A-K3", 1, 450, 65, 3),   # Small (128 tok), K=3
        ("1A-K5", 1, 450, 65, 5),   # Small (128 tok), K=5
        ("1B-K3", 1, 900, 135, 3),  # Medium (256 tok), K=3
        ("1C-K3", 1, 1800, 270, 3), # Large (512 tok), K=3
        
        # Option 2: Markdown Header
        ("2A-K3", 2, 450, 65, 3),   # Small (128 tok), K=3
        ("2A-K5", 2, 450, 65, 5),   # Small (128 tok), K=5
        ("2B-K3", 2, 900, 135, 3),  # Medium (256 tok), K=3
        ("2C-K3", 2, 1800, 270, 3), # Large (512 tok), K=3
        
        # Option 3: Parent-Child
        ("3A-K3", 3, 250, 30, 3),   # Small (Child 250 chars), K=3
        ("3A-K5", 3, 250, 30, 5),   # Small (Child 250 chars), K=5
    ]
    
    for cfg in configs:
        cfg_id, opt_type, c_size, c_overlap, k_val = cfg
        logger.info(f"\n>>> Running Evaluation for Config {cfg_id} (Option {opt_type} | Chunk {c_size} chars | K={k_val}) <<<")
        
        if opt_type == 1:
            chunks = build_chunks_option_1(raw_docs, chunk_size=c_size, chunk_overlap=c_overlap)
            res_summary, logs = evaluate_retriever_configuration(cfg_id, chunks, embeddings_model, top_k=k_val)
        elif opt_type == 2:
            chunks = build_chunks_option_2(raw_docs, chunk_size=c_size, chunk_overlap=c_overlap)
            res_summary, logs = evaluate_retriever_configuration(cfg_id, chunks, embeddings_model, top_k=k_val)
        elif opt_type == 3:
            child_chunks, parent_map = build_chunks_option_3(raw_docs, child_chunk_size=c_size, parent_chunk_size=1500)
            res_summary, logs = evaluate_retriever_configuration(cfg_id, child_chunks, embeddings_model, top_k=k_val, parent_map=parent_map)
            
        scorecard.append(res_summary)
        all_100_query_logs.extend(logs)

    # Save detailed JSON log
    out_json = BASE_DIR / "data" / "eval_results_detailed.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(all_100_query_logs, f, indent=2)
    logger.info(f"\nSaved detailed 100-query evaluation results to '{out_json}'.")

    # Update Markdown Document automatically
    update_evaluation_markdown_document(scorecard, all_100_query_logs)

    # Print Final Scorecard Table
    print("\n" + "=" * 105)
    print(f"{'Config ID':<10} | {'Hit@3 (%)':<10} | {'Precision@3':<12} | {'Recall@3':<10} | {'F1-Score@3':<11} | {'MRR@5':<8} | {'Composite Score':<16} | {'Avg Latency':<12}")
    print("=" * 105)
    for r in scorecard:
        print(f"{r['config_id']:<10} | {r['hit_3_pct']:<10.1f} | {r['precision_3']:<12.2f} | {r['recall_3']:<10.2f} | {r['f1_score_3']:<11.2f} | {r['mrr_5']:<8.2f} | {r['composite_score']:<16.2f} | {r['avg_latency_ms']:<8.1f} ms")
    print("=" * 105)


if __name__ == "__main__":
    main()
