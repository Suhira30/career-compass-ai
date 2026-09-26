"""
Stage 2A: Multi-Provider LLM Answer Generation for Ragas Evaluation
Career Compass AI — EXP-RAG-02 Phase 2A (Direct Native SDK Implementation)

Uses official native SDKs directly to completely bypass LangChain/Pydantic metaclass conflicts:
- Google Gemini via `google.generativeai`
- Groq via `groq.Groq`
- OpenAI via `openai.OpenAI`

Logs real-time status and saves results to 'backend/data/eval_generated_answers.json'.
"""

import sys
import os
import time
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

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

from app.core import settings

INPUT_FILE = BASE_DIR / "data" / "ragas_evaluation_contexts.json"
OUTPUT_FILE = BASE_DIR / "data" / "eval_generated_answers.json"

# Strict groundedness prompt enforcing citation from retrieved curriculum context
SYSTEM_PROMPT = """You are Career Compass AI Assistant, a Senior Technical Mentor.
Answer the candidate's interview question accurately and thoroughly using ONLY the provided [Retrieved Context].
Do NOT fabricate prerequisites, courses, or unverified claims.

[Retrieved Context]:
{context_str}

Candidate Question: {question}
"""


def get_gemini_client():
    if not settings.GEMINI_API_KEY:
        return None, None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        for model_name in ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.6-flash"]:
            try:
                m = genai.GenerativeModel(model_name)
                return m, model_name
            except Exception:
                continue
    except Exception as e:
        console.print(f"[dim]Gemini init notice: {e}[/dim]")
    return None, None


def get_groq_client():
    if not settings.GROQ_API_KEY:
        return None, None
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        active_models = [m.id for m in client.models.list().data]
        for candidate in ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "allam-2-7b"]:
            if candidate in active_models:
                return client, candidate
        if active_models:
            return client, active_models[0]
    except Exception as e:
        console.print(f"[dim]Groq init notice: {e}[/dim]")
    return None, None


def get_openai_client():
    if not settings.OPENAI_API_KEY:
        return None, None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return client, "gpt-4o-mini"
    except Exception as e:
        console.print(f"[dim]OpenAI init notice: {e}[/dim]")
    return None, None


def call_gemini(model, prompt: str) -> str:
    res = model.generate_content(prompt)
    return res.text.strip()


def call_groq(client, model_id: str, prompt: str) -> str:
    res = client.chat.completions.create(
        model=model_id,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600,
        temperature=0.2,
    )
    return res.choices[0].message.content.strip()


def call_openai(client, model_id: str, prompt: str) -> str:
    res = client.chat.completions.create(
        model=model_id,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600,
        temperature=0.2,
    )
    return res.choices[0].message.content.strip()


def main():
    console.print(Panel.fit(
        "[bold white on blue] CAREER COMPASS AI — MULTI-PROVIDER GENERATION RUNNER [/bold white on blue]\n"
        "[italic]Direct Native SDK Executor (Bypasses LangChain Metaclass Conflict)[/italic]",
        box=box.DOUBLE
    ))

    # Check input file
    if not INPUT_FILE.exists():
        console.print(f"[bold red]Error: Input file {INPUT_FILE} not found.[/bold red]")
        sys.exit(1)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        benchmark_records = json.load(f)

    console.print(f"\n[bold cyan]Loaded {len(benchmark_records)} Benchmark Questions from:[/bold cyan] [dim]{INPUT_FILE}[/dim]")

    # Initialize Clients
    console.print("\n[bold cyan]Connecting to Providers via Native SDKs:[/bold cyan]")
    gemini_model, gemini_id = get_gemini_client()
    groq_client, groq_id = get_groq_client()
    openai_client, openai_id = get_openai_client()

    providers = {}
    if gemini_model:
        providers["Google Gemini"] = {"type": "gemini", "model": gemini_id, "obj": gemini_model}
        console.print(f"  • [green]✓ Google Gemini[/green] [dim]({gemini_id})[/dim]")
    if groq_client:
        providers["Groq LPU"] = {"type": "groq", "model": groq_id, "obj": groq_client}
        console.print(f"  • [green]✓ Groq LPU[/green] [dim]({groq_id})[/dim]")
    if openai_client:
        providers["OpenAI"] = {"type": "openai", "model": openai_id, "obj": openai_client}
        console.print(f"  • [green]✓ OpenAI[/green] [dim]({openai_id})[/dim]")

    if not providers:
        console.print("[bold red]No active AI providers available.[/bold red]")
        sys.exit(1)

    output_records = []
    summary_stats = {p: {"total_time": 0.0, "success_count": 0} for p in providers}

    console.print("\n" + "=" * 78)
    console.print("[bold yellow]STARTING GENERATION PIPELINE[/bold yellow]")
    console.print("=" * 78)

    for idx, item in enumerate(benchmark_records, 1):
        q_id = item["id"]
        q_text = item["question"]
        gt_text = item["ground_truth"]
        contexts = item["contexts"]
        context_str = "\n\n---\n\n".join(contexts)

        console.print(f"\n[bold magenta]══════════════════════════════════════════════════════════════════════════════[/bold magenta]")
        console.print(f"[bold magenta][QUESTION {idx}/10 - {q_id}][/bold magenta] [bold white]{q_text}[/bold white]")
        console.print(f"[dim]Available Context: {len(contexts)} Parent Chunks ({sum(len(c) for c in contexts)} total characters)[/dim]")
        console.print("──────────────────────────────────────────────────────────────────────────────")

        prompt_input = SYSTEM_PROMPT.format(context_str=context_str, question=q_text)
        item_answers = {}

        for p_name, p_info in providers.items():
            console.print(f"  [yellow]► Calling {p_name}[/yellow] [dim]({p_info['model']})...[/dim]", end=" ")
            start_t = time.time()

            try:
                if p_info["type"] == "gemini":
                    ans_text = call_gemini(p_info["obj"], prompt_input)
                elif p_info["type"] == "groq":
                    ans_text = call_groq(p_info["obj"], p_info["model"], prompt_input)
                elif p_info["type"] == "openai":
                    ans_text = call_openai(p_info["obj"], p_info["model"], prompt_input)

                elapsed = time.time() - start_t
                summary_stats[p_name]["total_time"] += elapsed
                summary_stats[p_name]["success_count"] += 1

                console.print(f"[bold green]✓ Done ({elapsed:.2f}s)[/bold green]")
                preview = ans_text.replace("\n", " ").strip()[:140]
                console.print(f"    [italic white]\"{preview}...\"[/italic white]\n")

                item_answers[p_name] = {
                    "model": p_info["model"],
                    "answer": ans_text,
                    "latency_seconds": round(elapsed, 3),
                    "status": "success"
                }

            except Exception as exc:
                elapsed = time.time() - start_t
                err_msg = str(exc)
                if "insufficient_quota" in err_msg or "credit_balance_exhausted" in err_msg:
                    err_msg = "Account quota/credits exhausted"
                console.print(f"[bold red]✗ Failed ({elapsed:.2f}s)[/bold red]: [dim]{err_msg}[/dim]\n")
                item_answers[p_name] = {
                    "model": p_info["model"],
                    "answer": "",
                    "latency_seconds": round(elapsed, 3),
                    "status": "error",
                    "error_message": err_msg
                }

        output_records.append({
            "id": q_id,
            "question": q_text,
            "ground_truth": gt_text,
            "contexts": contexts,
            "generated_answers": item_answers,
        })

    # Save output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_records, f, indent=2, ensure_ascii=False)

    # Print summary performance scorecard
    console.print("\n" + "=" * 78)
    console.print("[bold green]GENERATION COMPLETE — SUMMARY TABLE[/bold green]")
    console.print("=" * 78)

    table = Table(box=box.ROUNDED, show_header=True, header_style="bold cyan")
    table.add_column("Provider", style="bold white")
    table.add_column("Model ID", style="dim")
    table.add_column("Completed Answers", justify="center")
    table.add_column("Avg Latency (s)", justify="center", style="bold green")

    for p_name, p_info in providers.items():
        stats = summary_stats[p_name]
        count = stats["success_count"]
        avg_time = (stats["total_time"] / count) if count > 0 else 0.0
        table.add_row(p_name, p_info["model"], f"{count}/10", f"{avg_time:.2f}s" if count > 0 else "N/A")

    console.print(table)

    console.print(Panel.fit(
        f"[bold green]SUCCESS: Answers generated and serialized![/bold green]\n"
        f"Saved to: [bold white]{OUTPUT_FILE}[/bold white]",
        box=box.ROUNDED
    ))


if __name__ == "__main__":
    main()
