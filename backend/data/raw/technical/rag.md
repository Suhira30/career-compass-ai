---
skill: rag
category: artificial_intelligence
difficulty: intermediate
content_type: technical_knowledge
interview_relevance: high
---

# Retrieval-Augmented Generation

## RAG Architecture

`Documents → Parsing → Chunking → Embeddings → Vector DB → Retrieval → Reranking → Context → LLM → Answer`

## Chunking

Common strategies:

- fixed-size
- recursive
- structure-aware
- semantic
- parent-child

## Embeddings

Embeddings convert text into dense numerical vectors representing semantic information.

## Vector Databases

Examples include:

- ChromaDB
- Pinecone
- Qdrant

A vector database stores vectors together with document content and metadata.

## Retrieval

Common retrieval metrics:

- Hit@K
- Recall@K
- Precision@K
- MRR

## Generation Evaluation

Important dimensions:

- Faithfulness
- Answer relevance
- Groundedness
- Citation accuracy
- Hallucination rate

## Advanced Retrieval

- Hybrid search
- Reranking
- Query rewriting
- Multi-query retrieval
- Metadata filtering
- Parent-child retrieval

## Interview Framework

For every RAG technique explain:

1. What it is
2. Why it exists
3. How it works
4. When to use it
5. Trade-offs and production failure modes

## Verified Official Learning Links

- Pinecone RAG Learning Center: https://www.pinecone.io/learn/retrieval-augmented-generation/
- LangChain RAG Architecture Guide: https://python.langchain.com/docs/tutorials/rag/
- ChromaDB Official Documentation: https://docs.trychroma.com/
- RAG Triad & Evaluation (TruLens): https://www.trulens.org/getting_started/core_concepts/rag_triad/
