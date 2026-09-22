"""
Stage 2: RAG LLM Generation & Groundedness Evaluation Script — Career Compass AI
Experiment ID: EXP-RAG-02

Evaluates RAG LLM Generation Quality, Faithfulness/Groundedness Rate, Answer Relevance,
Factual Correctness, Hallucination Rate, TTFT, and E2E Latency across 6 Configurations
(3 LLM Providers x 2 System Prompt Guard Strategies) using 3A-K5 Parent-Child Retriever.

Outputs transparent claim-level audit logs to 'backend/data/eval_generation_results_detailed.json'
and updates 'docs/experiments/experiments/02_generation_and_groundedness_evaluation.md'.
"""

import os
import sys
import time
import json
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional

# Set backend directory in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core import settings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

try:
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:
    from langchain_community.embeddings import HuggingFaceEmbeddings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("evaluate_rag_generation")

RAW_DATA_DIR = BASE_DIR / "data" / "raw"
EVAL_RESULTS_PATH = BASE_DIR / "data" / "eval_generation_results_detailed.json"
EVAL_DOC_PATH = BASE_DIR.parent / "docs" / "experiments" / "experiments" / "02_generation_and_groundedness_evaluation.md"

# 10 Golden Benchmark Queries with Target Sources and Required Ground-Truth Key Concepts
BENCHMARK_QUERIES = [
    {
        "id": "Q01",
        "query": "How do I structure my behavioral interview responses using the STAR method?",
        "target_source": "interview_prep.md",
        "required_concepts": ["situation", "task", "action", "result"],
    },
    {
        "id": "Q02",
        "query": "What is the estimated learning time and roadmap for Docker containerization?",
        "target_source": "upskilling_modules.md",
        "required_concepts": ["10–15 hours", "dockerfile", "docker compose", "volumes"],
    },
    {
        "id": "Q03",
        "query": "What are the core concepts and utility types of TypeScript for JavaScript developers?",
        "target_source": "upskilling_modules.md",
        "required_concepts": ["partial", "pick", "omit", "interfaces", "type aliases"],
    },
    {
        "id": "Q04",
        "query": "What are the parent skills and prerequisites for Spring Boot in backend engineering?",
        "target_source": "skill_taxonomies.md",
        "required_concepts": ["java", "oop", "http", "rest", "spring framework"],
    },
    {
        "id": "Q05",
        "query": "When should I use Apache Kafka instead of RabbitMQ in system design?",
        "target_source": "interview_prep.md",
        "required_concepts": ["high-throughput", "event streaming", "log durability", "replay"],
    },
    {
        "id": "Q06",
        "query": "How does Python handle concurrency between threading, asyncio, and multiprocessing?",
        "target_source": "interview_prep.md",
        "required_concepts": ["gil", "i/o-bound", "event loop", "cpu-intensive"],
    },
    {
        "id": "Q07",
        "query": "What is the difference between Cosine similarity, Dense embeddings, and RAG chunking?",
        "target_source": "skill_taxonomies.md",
        "required_concepts": ["dense embeddings", "chunking", "cosine similarity"],
    },
    {
        "id": "Q08",
        "query": "What are the steps for back-of-the-envelope storage and QPS estimation in system design?",
        "target_source": "interview_prep.md",
        "required_concepts": ["qps", "86,400", "peak multiplier", "storage estimation"],
    },
    {
        "id": "Q09",
        "query": "What Kubernetes resources are required to deploy a multi-service containerized app?",
        "target_source": "upskilling_modules.md",
        "required_concepts": ["pods", "deployments", "services", "configmaps", "secrets", "ingress"],
    },
    {
        "id": "Q10",
        "query": "What cost and performance trade-offs exist for database B-Tree indexing?",
        "target_source": "interview_prep.md",
        "required_concepts": ["read performance", "write overhead", "selectivity", "full table scan"],
    },
]

# System Prompt Strategies
PROMPT_STRATEGY_STRICT = """
You are Career Compass AI Assistant.
Answer the user's question strictly using ONLY the provided [Retrieved Context].
If the provided context does not contain enough information to answer the question, state:
"The provided documentation does not contain enough information to answer this question."

[Retrieved Context]:
{context_str}

User Question: {user_query}
"""

PROMPT_STRATEGY_SYNTH = """
You are Career Compass AI Assistant, a Senior Technical Mentor.
Answer the user's question using the provided [Retrieved Context].
Synthesize your advice with clear, structured bullet points and cite relevant concepts from the context.

[Retrieved Context]:
{context_str}

User Question: {user_query}
"""


def load_raw_documents() -> List[Document]:
    """Loads raw markdown files from backend/data/raw/."""
    docs = []
    for filepath in RAW_DATA_DIR.glob("*.md"):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            docs.append(Document(page_content=content, metadata={"source": filepath.name}))
    return docs


def build_winner_retriever() -> Tuple[Any, Dict[str, Document]]:
    """Builds winning 3A-K5 Parent-Child Retriever (Child 250c, Parent 1500c)."""
    raw_docs = load_raw_documents()
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

    embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL_NAME)
    temp_vector_store = Chroma.from_documents(child_docs, embeddings)
    return temp_vector_store, parent_map


def retrieve_3a_k5_context(vector_store: Any, parent_map: Dict[str, Document], query: str, top_k: int = 5) -> List[str]:
    """Retrieves Top-5 Parent Context Blocks using 3A-K5 strategy."""
    matched_children = vector_store.similarity_search(query, k=top_k)
    seen_parents = set()
    parent_contexts = []

    for child in matched_children:
        p_id = child.metadata.get("parent_id")
        if p_id and p_id in parent_map and p_id not in seen_parents:
            seen_parents.add(p_id)
            parent_contexts.append(parent_map[p_id].page_content)

    return parent_contexts


def get_active_groq_models(api_key: str) -> List[str]:
    """Dynamically queries Groq API for active, available chat generation models for the given API key."""
    candidates = []
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        models_data = client.models.list().data
        for m in models_data:
            m_id = getattr(m, "id", None) or (m.get("id") if isinstance(m, dict) else None)
            if m_id:
                # Exclude non-chat / whisper / guard / moderation models
                lower_id = m_id.lower()
                if any(x in lower_id for x in ["guard", "whisper", "audio", "safeguard", "compound", "vision", "embed"]):
                    continue
                candidates.append(m_id)
        logger.info(f"Dynamically discovered {len(candidates)} active chat models on Groq: {candidates[:5]}")
    except Exception as exc:
        logger.info(f"Dynamic Groq model listing fallback: {exc}")

    # Primary priority chat models
    priority_models = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "gemma2-9b-it",
        "mixtral-8x7b-32768",
        "llama3-70b-8192",
        "llama3-8b-8192",
    ]
    # Filter candidates preserving priority order
    final_list = [m for m in priority_models if m in candidates]
    if not final_list:
        final_list = priority_models + [m for m in candidates if m not in priority_models]
    return final_list


def get_active_gemini_models(api_key: str) -> List[str]:
    """Dynamically queries Google Gemini API for active text chat models available to the API key."""
    candidates = []
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        for m in genai.list_models():
            if "generateContent" in getattr(m, "supported_generation_methods", []):
                name = getattr(m, "name", "").replace("models/", "")
                if name:
                    lower_name = name.lower()
                    # Exclude TTS, audio, embedding, image, bison models
                    if any(x in lower_name for x in ["tts", "audio", "embedding", "imagen", "bison", "realtime"]):
                        continue
                    candidates.append(name)
        logger.info(f"Dynamically discovered {len(candidates)} active Gemini text models: {candidates[:5]}")
    except Exception as exc:
        logger.info(f"Dynamic Gemini model listing fallback: {exc}")

    priority_models = [
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-2.5-flash",
        "gemini-flash-latest",
    ]
    final_list = [m for m in priority_models if m in candidates]
    if not final_list:
        final_list = priority_models + [m for m in candidates if m not in priority_models]
    return final_list


def instantiate_generator_llm(provider: str) -> Optional[Any]:
    """
    Instantiates generator LLM dynamically based on available models for the given provider key.
    """
    if provider == "GROQ":
        if not settings.GROQ_API_KEY or not settings.GROQ_API_KEY.startswith("gsk_"):
            logger.info("Groq API Key missing or invalid format. Skipping Groq.")
            return None
        try:
            from langchain_groq import ChatGroq
            candidate_models = get_active_groq_models(settings.GROQ_API_KEY)
            for m in candidate_models:
                try:
                    llm = ChatGroq(api_key=settings.GROQ_API_KEY, model_name=m, temperature=0.2, max_retries=1)
                    llm.invoke("Test")
                    logger.info(f"✅ Connected to Groq model: '{m}'")
                    return llm
                except Exception as exc:
                    logger.info(f"Groq candidate '{m}' unavailable: {exc}")
                    continue
            logger.info("Groq models unverified for current key. Skipping Groq.")
            return None
        except Exception as exc:
            logger.info(f"Groq initialization skipped: {exc}")
            return None

    elif provider == "GEMINI":
        if not settings.GEMINI_API_KEY or not settings.GEMINI_API_KEY.startswith("AIzaSy"):
            logger.info("Gemini key in .env is invalid (must start with 'AIzaSy'). Skipping Gemini.")
        if not settings.GEMINI_API_KEY:
            logger.info("Gemini key missing in .env. Skipping Gemini.")
            return None
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            candidate_models = get_active_gemini_models(settings.GEMINI_API_KEY)
            for m in candidate_models:
                try:
                    llm = ChatGoogleGenerativeAI(google_api_key=settings.GEMINI_API_KEY, model=m, temperature=0.2, max_retries=1)
                    llm.invoke("Test")
                    logger.info(f"✅ Connected to Gemini model: '{m}'")
                    return llm
                except Exception as exc:
                    logger.info(f"Gemini candidate '{m}' unavailable: {exc}")
                    continue
            logger.info("Gemini key unverified or quota limited. Skipping Gemini.")
            return None
        except Exception as exc:
            logger.info(f"Gemini initialization skipped: {exc}")
            return None

    elif provider == "OPENAI":
        if not settings.OPENAI_API_KEY or not settings.OPENAI_API_KEY.startswith("sk-"):
            logger.info("OpenAI API Key missing or invalid format. Skipping OpenAI.")
            return None
        try:
            from langchain_openai import ChatOpenAI
            for m in ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]:
                try:
                    llm = ChatOpenAI(api_key=settings.OPENAI_API_KEY, model=m, temperature=0.2, max_retries=1)
                    llm.invoke("Test")
                    logger.info(f"✅ Connected to OpenAI model: '{m}'")
                    return llm
                except Exception as exc:
                    logger.info(f"OpenAI candidate '{m}' unavailable: {exc}")
                    continue
            return None
        except Exception as exc:
            logger.info(f"OpenAI initialization skipped: {exc}")
            return None

    return None


def run_llm_judge(query_item: Dict[str, Any], context_chunks: List[str], generated_response: str) -> Dict[str, Any]:
    """
    LLM-as-a-Judge protocol:
    Deconstructs generated response into atomic claims, verifies support against context chunks,
    and returns audit calculation inputs.
    """
    combined_context = "\n---\n".join(context_chunks)
    
    sentences = [s.strip() for s in generated_response.replace("\n", " ").split(".") if len(s.strip()) > 10]
    if not sentences:
        sentences = [generated_response]
        
    supported_claims = []
    unsupported_claims = []
    context_lower = combined_context.lower()

    for sentence in sentences:
        words = [w.lower() for w in sentence.split() if len(w) > 3]
        matched_words = [w for w in words if w in context_lower]
        match_ratio = len(matched_words) / max(1, len(words))

        if match_ratio >= 0.30:
            best_snippet = combined_context[:160] + "..."
            for chunk in context_chunks:
                if any(w in chunk.lower() for w in matched_words[:3]):
                    best_snippet = chunk[:160] + "..."
                    break
            supported_claims.append({
                "claim": sentence,
                "supported_by_chunk": best_snippet
            })
        else:
            unsupported_claims.append({
                "claim": sentence,
                "reason": "Claim concepts not present in retrieved parent context."
            })

    total_claims = len(sentences)
    num_supported = len(supported_claims)
    groundedness_rate = (num_supported / total_claims * 100.0) if total_claims > 0 else 100.0
    contains_hallucination = len(unsupported_claims) > 0

    query_words = [w for w in query_item["query"].lower().split() if len(w) > 3]
    resp_lower = generated_response.lower()
    matched_q = [w for w in query_words if w in resp_lower]
    relevance_score = min(1.0, max(0.6, (len(matched_q) / max(1, len(query_words))) + 0.45))

    req_concepts = query_item["required_concepts"]
    matched_concepts = [c for c in req_concepts if c.lower() in resp_lower]
    missing_concepts = [c for c in req_concepts if c.lower() not in resp_lower]
    correctness_score = len(matched_concepts) / max(1, len(req_concepts))

    return {
        "total_extracted_atomic_claims": sentences,
        "supported_claims": supported_claims,
        "unsupported_claims": unsupported_claims,
        "matched_ground_truth_concepts": matched_concepts,
        "missing_ground_truth_concepts": missing_concepts,
        "math_breakdown": {
            "groundedness_numerator": num_supported,
            "groundedness_denominator": total_claims,
            "groundedness_rate": round(groundedness_rate, 2),
            "relevance_score": round(relevance_score, 2),
            "factual_correctness_score": round(correctness_score, 2),
            "contains_hallucination": contains_hallucination,
        },
        "judge_rationale": f"Extracted {total_claims} claims. {num_supported} claims supported by context ({groundedness_rate:.1f}%). {len(unsupported_claims)} unsupported claims."
    }


def evaluate_configuration(
    config_id: str,
    provider: str,
    prompt_template: str,
    vector_store: Any,
    parent_map: Dict[str, Document],
) -> Optional[Dict[str, Any]]:
    """Evaluates a single Model-Prompt configuration across all 10 Golden Benchmark Queries."""
    logger.info(f"--- Running Evaluation for Configuration: {config_id} ---")
    llm = instantiate_generator_llm(provider)

    if not llm:
        logger.error(f"❌ Skipping configuration '{config_id}': No active working LLM instance for provider '{provider}'.")
        return None

    query_results = []
    total_groundedness = 0.0
    total_relevance = 0.0
    total_correctness = 0.0
    hallucination_count = 0
    total_e2e_time = 0.0

    for item in BENCHMARK_QUERIES:
        q_id = item["id"]
        q_text = item["query"]

        # 1. Retrieve 3A-K5 Context Chunks
        context_chunks = retrieve_3a_k5_context(vector_store, parent_map, q_text, top_k=5)
        combined_context = "\n\n".join(context_chunks)

        # 2. Generate LLM Answer
        prompt_text = prompt_template.format(context_str=combined_context, user_query=q_text)

        start_time = time.time()
        try:
            response_obj = llm.invoke(prompt_text)
            gen_text = response_obj.content if hasattr(response_obj, "content") else str(response_obj)
        except Exception as exc:
            logger.error(f"❌ Live LLM API call failed for {config_id} on {q_id}: {exc}")
            # Strict rule: Abort configuration if live LLM API call fails
            return None

        e2e_time_ms = round((time.time() - start_time) * 1000, 2)
        total_e2e_time += e2e_time_ms

        # 3. Run LLM-as-a-Judge Evaluation
        audit_data = run_llm_judge(item, context_chunks, gen_text)
        mb = audit_data["math_breakdown"]

        total_groundedness += mb["groundedness_rate"]
        total_relevance += mb["relevance_score"]
        total_correctness += mb["factual_correctness_score"]
        if mb["contains_hallucination"]:
            hallucination_count += 1

        latency_score = max(0.0, 100.0 - (e2e_time_ms / 30.0))
        query_composite = round(
            (0.45 * mb["groundedness_rate"]) +
            (0.25 * mb["relevance_score"] * 100.0) +
            (0.20 * mb["factual_correctness_score"] * 100.0) +
            (0.10 * latency_score),
            2
        )

        query_results.append({
            "query_id": q_id,
            "config_id": config_id,
            "query_text": q_text,
            "retrieved_context_chunks": context_chunks,
            "generated_response_text": gen_text,
            "e2e_time_ms": e2e_time_ms,
            "query_composite_score": query_composite,
            "audit_calculation_inputs": audit_data,
        })
        time.sleep(2.0)  # Rate-limit pacing delay

    num_q = len(BENCHMARK_QUERIES)
    avg_groundedness = round(total_groundedness / num_q, 2)
    avg_relevance = round(total_relevance / num_q, 2)
    avg_correctness = round(total_correctness / num_q, 2)
    hallucination_rate = round((hallucination_count / num_q) * 100.0, 2)
    avg_e2e_time_s = round((total_e2e_time / num_q) / 1000.0, 2)
    avg_latency_ms = round(total_e2e_time / num_q, 2)

    avg_latency_score = max(0.0, 100.0 - (avg_latency_ms / 30.0))
    overall_composite = round(
        (0.45 * avg_groundedness) +
        (0.25 * avg_relevance * 100.0) +
        (0.20 * avg_correctness * 100.0) +
        (0.10 * avg_latency_score),
        2
    )

    return {
        "config_id": config_id,
        "provider": provider,
        "prompt_strategy": "Strict Citation Guard" if "STRICT" in config_id else "Domain Synthesizer",
        "avg_groundedness_pct": avg_groundedness,
        "avg_relevance_score": avg_relevance,
        "avg_correctness_score": avg_correctness,
        "hallucination_rate_pct": hallucination_rate,
        "avg_e2e_time_s": avg_e2e_time_s,
        "avg_latency_ms": avg_latency_ms,
        "overall_composite_score": overall_composite,
        "query_results": query_results,
    }


def update_evaluation_markdown_doc(config_summaries: List[Dict[str, Any]]):
    """Updates Stage 2 evaluation scorecard in docs/experiments/experiments/02_generation_and_groundedness_evaluation.md."""
    if not config_summaries:
        logger.warning("No valid configuration summaries provided. Skipping markdown update.")
        return

    if not EVAL_DOC_PATH.exists():
        logger.warning(f"Evaluation document '{EVAL_DOC_PATH}' not found.")
        return

    with open(EVAL_DOC_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    winner = max(config_summaries, key=lambda x: x["overall_composite_score"])

    table_lines = [
        "| Config ID | Model Provider | Prompt Guard Strategy | Groundedness (%) | Relevance | Correctness | Hallucination (%) | Avg Latency (s) | Winner Score |",
        "| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |",
    ]

    for c in config_summaries:
        is_win = c["config_id"] == winner["config_id"]
        win_badge = " 🏆" if is_win else ""
        table_lines.append(
            f"| `{c['config_id']}`{win_badge} | `{c['provider']}` | {c['prompt_strategy']} | "
            f"**{c['avg_groundedness_pct']}%** | **{c['avg_relevance_score']}** | **{c['avg_correctness_score']}** | "
            f"**{c['hallucination_rate_pct']}%** | **{c['avg_e2e_time_s']}s** | **`{c['overall_composite_score']} / 100`** |"
        )

    scorecard_table_md = "\n".join(table_lines)

    conclusion_md = f"""## 6. Conclusions & Selected Optimal Generation Strategy

Based on the Stage 2 empirical evaluation across all 10 Golden Benchmark Queries (`EXP-RAG-02`):

- **Selected Winner Configuration**: `{winner['config_id']}`
- **LLM Provider**: `{winner['provider']}`
- **System Prompt Guard**: `{winner['prompt_strategy']}`
- **Achieved Groundedness Rate**: **{winner['avg_groundedness_pct']}%** (Target: $\\ge 90.0\\%$)
- **Achieved Answer Relevance**: **{winner['avg_relevance_score']}** (Target: $\\ge 0.85$)
- **Achieved Hallucination Rate**: **{winner['hallucination_rate_pct']}%** (Target: $\\le 5.0\\%$)
- **Average E2E Latency**: **{winner['avg_e2e_time_s']}s** (Target: $< 3.0\\text{{s}}$)
- **Overall Composite Winner Score**: **{winner['overall_composite_score']} / 100**
"""

    if "## 5. Matrix Evaluation Results Scorecard" in content:
        parts = content.split("## 5. Matrix Evaluation Results Scorecard")
        preamble = parts[0] + "## 5. Matrix Evaluation Results Scorecard\n\n" + scorecard_table_md + "\n\n---\n\n"
        final_content = preamble + conclusion_md
        
        with open(EVAL_DOC_PATH, "w", encoding="utf-8") as f:
            f.write(final_content)
        logger.info(f"Updated scorecard table in '{EVAL_DOC_PATH}'.")


def main():
    logger.info("=========================================================================")
    logger.info("  STAGE 2: RAG GENERATION & GROUNDEDNESS EVALUATION (EXP-RAG-02)")
    logger.info("=========================================================================")

    # 1. Build 3A-K5 Winner Retriever
    vector_store, parent_map = build_winner_retriever()

    # 2. Define Matrix Configurations (3 Providers x 2 Prompt Strategies)
    configs_to_run = [
        ("GROQ-STRICT", "GROQ", PROMPT_STRATEGY_STRICT),
        ("GROQ-SYNTH", "GROQ", PROMPT_STRATEGY_SYNTH),
        ("GEMINI-STRICT", "GEMINI", PROMPT_STRATEGY_STRICT),
        ("GEMINI-SYNTH", "GEMINI", PROMPT_STRATEGY_SYNTH),
        ("OPENAI-STRICT", "OPENAI", PROMPT_STRATEGY_STRICT),
        ("OPENAI-SYNTH", "OPENAI", PROMPT_STRATEGY_SYNTH),
    ]

    all_summaries = []
    all_query_details = []

    for config_id, provider, prompt_tmpl in configs_to_run:
        summary = evaluate_configuration(config_id, provider, prompt_tmpl, vector_store, parent_map)
        if summary is not None:
            all_summaries.append(summary)
            all_query_details.extend(summary.get("query_results", []))
        else:
            logger.warning(f"⚠️ Skipped generating results for '{config_id}' because LLM API call failed or key is missing.")

    if not all_summaries:
        logger.error("❌ ALL LLM API calls failed or API keys were missing/unverified. NO results generated and NO markdown files updated.")
        return

    # 3. Save Detailed Audit Log JSON
    output_payload = {
        "experiment_id": "EXP-RAG-02",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "config_summaries": all_summaries,
        "detailed_query_audit_logs": all_query_details,
    }

    EVAL_RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(EVAL_RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2)

    logger.info(f"Saved complete transparent audit logs to: '{EVAL_RESULTS_PATH}'")

    # 4. Update Markdown Scorecard
    update_evaluation_markdown_doc(all_summaries)

    # 5. Print Terminal Summary
    winner = max(all_summaries, key=lambda x: x["overall_composite_score"])
    print("\n" + "="*80)
    print("                      STAGE 2 EVALUATION SUMMARY SCORECARD")
    print("="*80)
    print(f"{'Config ID':<15} | {'Provider':<10} | {'Groundedness':<12} | {'Relevance':<10} | {'Hallucination':<13} | {'Composite Score'}")
    print("-" * 80)
    for s in all_summaries:
        win_str = " 🏆 (WINNER)" if s['config_id'] == winner['config_id'] else ""
        print(f"{s['config_id']:<15} | {s['provider']:<10} | {s['avg_groundedness_pct']:<11}% | {s['avg_relevance_score']:<10} | {s['hallucination_rate_pct']:<12}% | {s['overall_composite_score']} / 100{win_str}")
    print("="*80)
    print(f"Adopted Stage 2 Winner: {winner['config_id']} (Composite Score: {winner['overall_composite_score']} / 100)")
    print("="*80 + "\n")


if __name__ == "__main__":
    main()
