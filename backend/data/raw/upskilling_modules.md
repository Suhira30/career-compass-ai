# Career Compass AI — Upskilling Modules Knowledge Base

## Purpose

This document contains structured upskilling modules that Career Compass AI can use to recommend learning paths based on:

- Candidate's current skills
- Target job role
- Required job skills
- Identified skill gaps
- Existing knowledge
- Prerequisites
- Career goals

Each module defines the skills covered, prerequisites, learning objectives, estimated effort, practical project, recommended resources, and recommendation criteria.

---

# Module 01 — TypeScript for JavaScript Developers

## Module Metadata

- **Module ID**: typescript-for-javascript-developers
- **Category**: Web Development / Frontend / Backend JavaScript
- **Skill Level**: Beginner to Intermediate
- **Estimated Learning Time**: 15–20 hours
- **Prerequisite Level**: JavaScript fundamentals
- **Primary Technologies**: TypeScript, JavaScript, React, Node.js
- **Related Roles**: Frontend Developer, Full-Stack Developer, React Developer, Node.js Developer, Software Engineer

## Module Overview

This module helps JavaScript developers transition to TypeScript and use static typing to build more maintainable and reliable applications.
The module focuses on practical TypeScript development rather than learning TypeScript syntax in isolation.

## Prerequisites

The learner should understand:

- JavaScript fundamentals (variables, functions, objects, arrays, ES6+ syntax)
- Async/Await & Promises
- Basic DOM manipulation
- Basic React or Node.js development

## Skills Covered

- **Core Skills**: TypeScript, Static typing, Type-safe JavaScript development, Object typing, Function typing, Generic programming.
- **Related Concepts**: Interfaces, Type aliases, Generics, Enums, Union types, Intersection types, Utility types (`Partial`, `Pick`, `Omit`), Strict mode, Type inference.

## Learning Objectives

After completing this module, the learner should be able to:

1. Explain why TypeScript is used in JavaScript applications.
2. Define types for variables, functions, objects, and arrays.
3. Use interfaces and type aliases appropriately.
4. Create reusable generic functions and types.
5. Apply TypeScript utility types.
6. Configure TypeScript strict mode and reduce use of `any`.
7. Gradually migrate an existing JavaScript project to TypeScript.

## Practical Milestone Project

- **Project**: Migrate an existing React or Node.js JavaScript application to TypeScript.
- **Requirements**: Strict TypeScript configuration, Proper interfaces/types, minimum `any` usage, type-safe Component/API logic.

## Interview Relevance

Candidates may be asked about: TypeScript vs JavaScript, Interfaces vs type aliases, Generics, Union/intersection types, `any` vs `unknown`, Utility types, Strict mode benefits.

## Recommendation Criteria

Recommend when target role requires TypeScript, React with TypeScript, or Node.js with TypeScript, and learner has JavaScript background.

## Recommended Resources

- TypeScript Official Documentation and Handbook
- freeCodeCamp TypeScript tutorials
- Total TypeScript Beginner Course by Matt Pocock

---

# Module 02 — Docker and Containerization for Developers

## Module Metadata

- **Module ID**: docker-containerization
- **Category**: DevOps / Infrastructure
- **Skill Level**: Beginner to Intermediate
- **Estimated Learning Time**: 10–15 hours
- **Prerequisites**: Basic Linux CLI, Web application architecture, Backend development
- **Primary Technologies**: Docker, Docker Compose
- **Related Roles**: Backend Engineer, Full-Stack Developer, Software Engineer, DevOps Engineer, Cloud Engineer

## Module Overview

Teaches developers how to package applications and dependencies into containers and run multiple services consistently across environments.

## Skills Covered

- **Core Skills**: Docker, Containerization, Docker images, Dockerfiles, Docker Compose, Container networking, Persistent storage.
- **Related Concepts**: Containers vs VMs, Image layers, Port mapping, Volumes, Environment variables, Multi-stage builds.

## Learning Objectives

1. Explain difference between containers and VMs.
2. Build Docker images using Dockerfiles and multi-stage builds.
3. Connect multiple containers via Docker Compose & networking.
4. Persist data using Docker volumes.

## Practical Milestone Project

- **Project**: Build a containerized three-tier application: React Frontend → FastAPI Backend → PostgreSQL Database.
- **Requirements**: Frontend & Backend Dockerfiles, Docker Compose config, Persistent Volume, Health checks.

## Recommendation Criteria

Recommend when target job requires Docker, backend/fullstack developer lacks containerization experience, or preparing for DevOps/cloud roles.

## Recommended Resources

- Docker Official Getting Started Guide
- TechWorld with Nana Docker Tutorial for Beginners

---

# Module 03 — RAG and Vector Databases with LangChain

## Module Metadata

- **Module ID**: rag-vector-databases-langchain
- **Category**: Artificial Intelligence / Generative AI
- **Skill Level**: Intermediate
- **Estimated Learning Time**: 20–25 hours
- **Prerequisites**: Python fundamentals, Basic LLM API usage, Embeddings concepts
- **Primary Technologies**: Python, LangChain, ChromaDB, LLM API, FastAPI
- **Related Roles**: AI Engineer, Generative AI Engineer, LLM Engineer, Machine Learning Engineer, Backend Engineer working on AI.

## Module Overview

Teaches developers how to build Retrieval-Augmented Generation applications that retrieve relevant context from external knowledge bases for LLMs.

## Skills Covered

- **Core Skills**: RAG, Embeddings, Vector databases, Semantic search, Chunking, Retrieval pipelines, Hybrid search, Reranking, Grounding & Citations, RAG Evaluation.

## Learning Objectives

1. Load and parse documents.
2. Split documents into semantic chunks (`RecursiveCharacterTextSplitter`).
3. Store embeddings in vector stores (ChromaDB, Pinecone).
4. Perform hybrid search, reranking, and citation grounding.
5. Evaluate RAG retrieval (Hit@K, Recall@K, MRR) and generation (Faithfulness, Groundedness).

## Practical Milestone Project

- **Project**: Build a PDF Question-Answering application using Python, FastAPI, LangChain, and ChromaDB/Pinecone.

## Recommendation Criteria

Recommend when target role requires RAG, Generative AI, LLM Application development, or LangChain/Vector DBs.

## Recommended Resources

- LangChain Official Python Documentation
- DeepLearning.AI — Building Applications with Vector Databases

---

# Module 04 — Kubernetes Application Deployment

## Module Metadata

- **Module ID**: kubernetes-application-deployment
- **Category**: DevOps / Cloud / Infrastructure
- **Skill Level**: Intermediate
- **Estimated Learning Time**: 25–30 hours
- **Prerequisites**: Docker fundamentals, Containerization, Basic networking
- **Primary Technologies**: Kubernetes, Minikube
- **Related Roles**: DevOps Engineer, Cloud Engineer, Platform Engineer, SRE, Backend Engineer

## Skills Covered

- **Core Skills**: Kubernetes, Container orchestration, Application deployment, Service discovery, ConfigMaps, Secrets, Ingress, Persistent Volumes.

## Learning Objectives

1. Understand Pods, Deployments, Services (ClusterIP, NodePort, LoadBalancer).
2. Configure applications using ConfigMaps and Secrets.
3. Deploy multi-service applications to local Minikube cluster with Ingress routing.

## Recommendation Framework & Priorities

Career Compass AI generates personalized roadmaps using:
`Candidate Skills → Target Role → Job Requirements → Skill Gap → Prerequisites → Recommended Module`

Order is dynamically calculated based on required vs preferred skill gaps, prerequisite chains (e.g. Docker before Kubernetes), and target role relevance.
