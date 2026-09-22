# Career Compass AI — Master Implementation Plan

## Project Title

**Career Compass AI** — _AI-Powered Career Navigation, Skill Gap Analysis & Upskilling Platform_

---

## 1. Plan Overview

This Implementation Plan translates the product vision (**`PRD.md`**), functional/non-functional requirements (**`SRS.md`**), and system architecture (**`SAD.md`**) into actionable, trackable developer tasks and subtasks. Each task features checkboxes (`- [ ]`) to track execution progress.

---

## Phase 1: Project Setup, Environment & Foundation

### Task 1.1: Backend Foundation & Environment Setup

- [x] **Task 1.1.1**: Initialize Python 3.11+ environment and virtual environment (`.venv`).
- [x] **Task 1.1.2**: Setup `backend/pyproject.toml` or `requirements.txt` with dependencies (`fastapi`, `uvicorn`, `pydantic`, `langchain`, `pypdf`, `python-docx`, `chromadb`, `sqlalchemy`).
- [ ] **Task 1.1.3**: Configure core application modular architecture in `backend/app/`:
  - [x] `main.py`: FastAPI application entry point, CORS middleware, and route mounting.
  - [x] `core/`: Application settings & environment configuration (`config.py`).
  - [ ] `api/`: REST API route controllers (`api/v1/`):
    - [x] `POST /api/v1/profile` & `GET /api/v1/profile/{id}` (User Profile Management - FR-01)
    - [x] `POST /api/v1/resume/upload` (Resume Extraction - FR-02, FR-03)
    - [x] `POST /api/v1/jobs/extract` (Job Description Parser - FR-04, FR-05)
    - [x] `POST /api/v1/analysis/gap` (Skill Gap Analysis & Match Score - FR-06, FR-07)
    - [x] `POST /api/v1/roadmap/generate` (Personalized Learning Plan - FR-08, FR-09)
    - [x] `POST /api/v1/chat/message` (Streaming RAG AI Career Assistant - FR-10)
  - [ ] `models/`: Data definitions (Pydantic validation schemas & SQLAlchemy database models).
  - [ ] `services/`: AI & business logic modules (`services/extractors/`, `services/gap_analysis/`, `services/rag/`).
  - [ ] `utils/`: Text sanitization, file validators, and helper utilities.
- [ ] **Task 1.1.4**: Setup `backend/app/core/config.py` for environment variables (`GROQ_API_KEY`, `VECTOR_DB_DIR`, `DATABASE_URL`, `CORS_ORIGINS`).

### Task 1.2: Frontend Foundation & Component Architecture

- [x] **Task 1.2.1**: Initialize React 18+ TypeScript application with Vite in `frontend/`.
- [x] **Task 1.2.2**: Configure Tailwind CSS, Lucide icons, and component styling framework.
- [x] **Task 1.2.3**: Setup API client service (`frontend/src/services/api.ts`) with Axios/Fetch interceptors for base URL and error handling.
- [x] **Task 1.2.4**: Create global user context / state store for managing active Profile, Job Description, and Analysis Results.

### Task 1.3: Database Schemas & Vector Store Initialization

- [x] **Task 1.3.1**: Create SQLAlchemy ORM models and Pydantic schemas in `backend/app/models/` for `UserProfile`, `WorkExperience`, `Certification`, `JobDescription`, and `AnalysisResult`.
- [x] **Task 1.3.2**: Setup SQLite/PostgreSQL database initialization script (`backend/app/db/init_db.py`).
- [x] **Task 1.3.3**: Initialize Vector Store Engine in `backend/app/services/rag/vector_store.py` using Pinecone Cloud Serverless (`langchain-pinecone`) with local ChromaDB fallback.
- [x] **Task 1.3.4**: Build initial document ingestion script for populating the career knowledge base (Skill Taxonomies, Learning Modules).

---

## Phase 2: Core AI Services & Business Logic (Backend)

### Task 2.1: User Profile Management Module (FR-01)

- [x] **Task 2.1.1**: Build `UserProfileSchema` Pydantic model enforcing required fields (Name, Education, Current Role, Skills, Target Role).
- [x] **Task 2.1.2**: Implement Profile CRUD service in `backend/app/services/profile_service.py`.
- [x] **Task 2.1.3**: Expose `/api/v1/profile` endpoints (`GET`, `POST`, `PUT`, `DELETE`).

### Task 2.2: Resume Upload & Extraction Engine (FR-02, FR-03)

- [x] **Task 2.2.1**: Implement file parser utility (`backend/app/services/extractors/file_parser.py`) supporting `.pdf` (`pypdf`) and `.docx` (`python-docx`).
- [x] **Task 2.2.2**: Define Pydantic schema `ExtractedResumeSchema` (Technical Skills, Soft Skills, Education, Work Experience, Projects, Certifications with links, GitHub/LinkedIn/Portfolio links).
- [x] **Task 2.2.3**: Implement LLM structured extractor (`backend/app/services/extractors/resume_extractor.py`) using JSON schema enforcement.
- [x] **Task 2.2.4**: Expose `/api/v1/resume/upload` endpoint returning structured profile JSON for user verification.

### Task 2.3: Job Description Ingestion & Parsing Engine (FR-04, FR-05)

- [x] **Task 2.3.1**: Define `ExtractedJobSchema` Pydantic model (Job Title, Required Skills, Preferred Skills, Required Experience, Education, Responsibilities, Work Mode, Location, Salary).
- [x] **Task 2.3.2**: Implement Job Description LLM parser (`backend/app/services/extractors/jd_extractor.py`).
- [x] **Task 2.3.3**: Add fallback logic for unlisted optional fields (e.g., default Salary to "Not Specified").
- [x] **Task 2.3.4**: Expose `/api/v1/jobs/extract` endpoint accepting raw pasted text.

### Task 2.4: Skill Gap Analysis & Suitability Scorer (FR-06, FR-07)

- [x] **Task 2.4.1**: Build Skill Categorization Engine in `backend/app/services/gap_analysis/skill_matcher.py` (Matching, Missing, Partially Available Skills).
- [x] **Task 2.4.2**: Implement Readiness Assessment Heuristics (Strengths, Skill Gaps, Weaknesses, Recommended Improvements).
- [x] **Task 2.4.3**: Implement Readiness Classification Logic mapping overlap percentages to match categories (`High Match`, `Moderate Match`, `Low Match`).
- [x] **Task 2.4.4**: Expose `/api/v1/analysis/gap` endpoint.

### Task 2.5: Personalized Learning & Prioritization Engine (FR-08, FR-09)

- [x] **Task 2.5.1**: Build Skill Prioritization Logic (`backend/app/services/gap_analysis/prioritizer.py`) sorting missing skills into `Priority 1`, `Priority 2`, `Priority 3`.
- [x] **Task 2.5.2**: Implement Learning Roadmap Generator considering user's available weekly learning hours and preferred duration.
- [x] **Task 2.5.3**: Query ChromaDB vector store to fetch relevant learning resources/modules for prioritized missing skills.
- [x] **Task 2.5.4**: Expose `/api/v1/roadmap/generate` endpoint.

### Task 2.6: RAG-Powered AI Career Assistant (FR-10)

- [x] **Task 2.6.1**: Setup RAG retrieval chain (`backend/app/services/rag/chat_chain.py`) combining user profile context + analysis results + vector knowledge base.
- [x] **Task 2.6.2**: Implement prompt template answering specific career, resume, and upskilling questions.
- [x] **Task 2.6.3**: Enable response streaming via FastAPI `StreamingResponse`.
- [x] **Task 2.6.4**: Expose `/api/v1/chat/message` endpoint.

### Task 2.7: Knowledge Base Ingestion & Production RAG Guardrails (ADR-07, EXP-RAG-01)

- [ ] **Task 2.7.1**: Run ingestion pipeline (`backend/app/services/rag/ingest.py`) to chunk, embed, and index all curated `.md` documents (`technical/`, `interview_questions/`, `behavioral/`, `learning/`) into Pinecone Serverless using adopted Parent-Child `3A-K5` configuration.
- [ ] **Task 2.7.2**: Implement Conversational Query Condenser (Rewriter) in `chat_chain.py` that translates pronoun-heavy follow-up questions into standalone vector search queries prior to Pinecone retrieval.
- [ ] **Task 2.7.3**: Implement Cosine Similarity Threshold Gate ($< 0.70$) in `vector_store.py` to filter out low-confidence chunks and prevent out-of-domain hallucinations.

---

## Phase 3: Frontend User Interface & Flow Integration

### Task 3.1: Profile Management & Resume Upload UI

- [x] **Task 3.1.1**: Build `ResumeUploader` component with drag-and-drop, format validation, and interactive spotlight cursor physics.
- [x] **Task 3.1.2**: Build `ExtractedProfileReview` badge cloud allowing users to edit auto-extracted skills, add custom pills, and verify match status.
- [x] **Task 3.1.3**: Build symmetrical dual-pane workspace layout with unified interactive analyze CTA.

### Task 3.2: Job Description Input & Analysis Matrix UI

- [x] **Task 3.2.1**: Build `JobDescriptionInput` text area component with syntax highlight styling, sample JD loader, and balanced height.
- [x] **Task 3.2.2**: Build `MatchScoreCard` component visually displaying readiness category (`High`, `Moderate`, `Low Match`) and match metrics.
- [x] **Task 3.2.3**: Build `SkillGapMatrix` component rendering distinct columns for Matched, Missing, and Partial skills.

### Task 3.3: Personalized Learning Roadmap UI

- [x] **Task 3.3.1**: Build `RoadmapControlsBar` with Study Hours Slider (2–25h/wk), Duration Timeline Pills (2, 4, 8, 12 Wks), and Day/Week pacing switcher.
- [x] **Task 3.3.2**: Build `PriorityBadgesOverview` component highlighting `Priority 1`, `Priority 2`, `Priority 3` skill badges.
- [x] **Task 3.3.3**: Build `WeeklyTimelineStepper` widget displaying milestone tasks with interactive checkboxes, live strike-through styling, and verified documentation links.

### Task 3.5: Multi-Roadmap Carousel Deck & Role Portfolio (FR-09A, FR-09B)

- [x] **Task 3.5.1**: Build `RoadmapCarouselHeader` component: horizontal swipeable snap deck tracking multiple concurrent target roles ($1:N$).
- [x] **Task 3.5.2**: Display individual ATS match score badges, schedule commitments, and live task completion progress on each role card.
- [x] **Task 3.5.3**: Build `CancelRoadmapModal`: frosted glass confirmation dialog protecting against accidental deletion of study milestones.
- [x] **Task 3.5.4**: Implement isolated task persistence per roadmap in `localStorage` (`career_compass_saved_roadmaps`).
- [x] **Task 3.5.5**: Add terminal `+ Track Another Role` card routing to Gap Analysis for new JD ingestion.

### Task 3.6: Supabase Authentication & PostgreSQL Cloud Persistence

- [x] **Task 3.6.1**: Setup Authentication Context & Auth Modal (`frontend/src/context/AuthContext.tsx`, `AuthModal.tsx`).
- [x] **Task 3.6.2**: Design and provision PostgreSQL relational tables in Supabase (`user_profiles`, `job_descriptions`, `analysis_results`, `roadmaps`, `roadmap_tasks`).
- [x] **Task 3.6.3**: Implement FastAPI persistence routes (`GET /roadmap/user/{user_id}`, `POST /roadmap/save`, `POST /roadmap/{id}/task`, `DELETE /roadmap/{id}`) with SQLAlchemy ORM models (`RoadmapDB`, `RoadmapTaskDB`).
- [x] **Task 3.6.4**: Implement two-tier migration: seamlessly sync offline `localStorage` roadmaps to Supabase upon sign-in with background optimistic updates.

### Task 3.4: Streaming AI Assistant Chat UI (Career Copilot)

- [ ] **Task 3.4.1**: Build `CareerChatWidget` drawer & floating trigger button with 3D Quantum Glass styling, pulse animations, and minimize/dock controls.
- [ ] **Task 3.4.2**: Implement Adaptive Context Synchronizer detecting User Types (2.1 Cold Start, 2.2 Profile Loaded, 2.3 Gap Analysis Complete, 2.4 Active Roadmap & Checklist) and injecting active IDs (`analysis_id`, `roadmap_id`) into chat requests.
- [ ] **Task 3.4.3**: Build Real-Time Token Streaming Engine connecting to `/api/v1/chat/message` with auto-scroll management, user scroll-lock, and Markdown rendering (code syntax highlighting, bullet lists, bold text).
- [ ] **Task 3.4.4**: Implement Conversational Sliding Window (4–6 turns) & Supabase History Cloud Persistence (`chat_sessions`, `chat_messages`) for session switching and refresh durability.
- [ ] **Task 3.4.5**: Add Dynamic Contextual Suggestion Chips customized to the user's active journey (e.g. "Explain Week 1 Roadmap", "Quiz me on Redis", "How to close my Docker gap").
- [ ] **Task 3.4.6**: Implement Robust Error Boundaries & Fallback Handlers for API rate limits (429), token exhaustion, and offline network reconnects.

---

## Phase 4: Non-Functional Requirements & Security Hardening

### Task 4.1: Security & PII Protection (NFR-03)

- [ ] **Task 4.1.1**: Ensure uploaded resume files are processed in ephemeral memory buffers and purged post-parsing.
- [ ] **Task 4.1.2**: Add HTML/Script tag sanitization on all raw text inputs.
- [ ] **Task 4.1.3**: Configure CORS origins and header policies in FastAPI.
- [ ] **Task 4.1.4**: Ensure LLM API keys are strictly stored in server environment variables.

### Task 4.2: Reliability, Error Handling & Fallbacks (NFR-04)

- [ ] **Task 4.2.1**: Implement file validation guards for unsupported file extensions and corrupted files.
- [ ] **Task 4.2.2**: Add `tenacity` retry handlers for LLM API 429/500 rate limit errors.
- [ ] **Task 4.2.3**: Add fallback handlers when unlisted optional fields (e.g. salary) are absent in JD text.

### Task 4.3: Performance & Latency Tuning (NFR-01)

- [ ] **Task 4.3.1**: Benchmark resume parsing and gap analysis endpoints ($< 10\text{ s}$ execution target).
- [ ] **Task 4.3.2**: Benchmark chat assistant first-token streaming latency ($< 2\text{ s}$ target).
- [ ] **Task 4.3.3**: Implement in-memory caching for repeated static skill taxonomy lookups.

---

## Phase 5: Verification, Testing & Deployment

### Task 5.1: Automated Testing & Verification

- [ ] **Task 5.1.1**: Write pytest unit tests for extractor services (`tests/test_resume_extractor.py`, `tests/test_jd_extractor.py`).
- [ ] **Task 5.1.2**: Write pytest unit tests for gap matcher heuristics (`tests/test_skill_matcher.py`).
- [ ] **Task 5.1.3**: Write API endpoint integration tests (`tests/test_api_endpoints.py`).

### Task 5.2: End-to-End User Verification

- [ ] **Task 5.2.1**: Verify full workflow: Upload Resume -> Parse Profile -> Paste JD -> Generate Gap Matrix -> View Roadmap -> Chat with Assistant.
- [ ] **Task 5.2.2**: Verify edge cases: Empty profile fields, very short JD text, unreadable PDF files.

### Task 5.3: Containerization & Deployment

- [ ] **Task 5.3.1**: Create backend `Dockerfile` and frontend multi-stage `Dockerfile`.
- [ ] **Task 5.3.2**: Create `docker-compose.yml` orchestrating API container, frontend static server, and vector DB persistence.
- [ ] **Task 5.3.3**: Validate single-command startup (`docker-compose up --build`).

---

## Phase 6: PLG User Lifecycle, Ephemeral Guest Privacy & Smart CV Persistence

### Task 6.1: Storage Adapter & Guest Ephemeral Privacy (NFR-03)

- [ ] **Task 6.1.1**: Build `storageAdapter.ts` abstracting storage between `sessionStorage` (for anonymous guests) and `localStorage` / cloud sync (for authenticated users).
- [ ] **Task 6.1.2**: Implement automatic guest session wiping on browser tab exit and landing page arrival to guarantee clean slate for returning visitors.
- [ ] **Task 6.1.3**: Add explicit "Start New Analysis / Clear Slate" action in `GapAnalysisWorkspace.tsx`.

### Task 6.2: Roadmap Conversion Value Gate & State Stashing (FR-09C)

- [ ] **Task 6.2.1**: Intercept "Generate Roadmap" and "Track Milestones" actions when `user === null`.
- [ ] **Task 6.2.2**: Implement in-flight state stashing (`analysis_id`, `analysis_data`, `job_title`, hours, weeks) during `<AuthModal />` display.
- [ ] **Task 6.2.3**: On authentication success, automatically pop stashed state, bind to newly authenticated `user_id`, generate roadmap, and persist to Supabase without re-upload.

### Task 6.3: Returning Authenticated User CV Reusability (FR-01A)

- [ ] **Task 6.3.1**: Fetch and display "Active Resume on File" in `GapAnalysisWorkspace.tsx` for logged-in users.
- [ ] **Task 6.3.2**: Enable instant 1-click gap analysis against new target job descriptions using the existing stored CV.
- [ ] **Task 6.3.3**: Provide "Upload Updated Resume" option allowing user to replace or update their resume on file in cloud storage.

### Task 6.4: Guest Career Copilot Ephemeral Chat (FR-10A)

- [ ] **Task 6.4.1**: Permit guest chatting with Career Copilot based on active in-flight gap analysis.
- [ ] **Task 6.4.2**: Isolate guest chat history to `sessionStorage` with optional migration to user account upon login.
