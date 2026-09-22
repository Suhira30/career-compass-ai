# Career Compass AI

_AI-Powered Career Navigation, Skill Gap Analysis & Upskilling Platform_

<div align="center">

<img src="https://img.shields.io/badge/Career_Compass_AI-v1.0.0-09090B?style=for-the-badge&logo=compass&logoColor=white" alt="Version">
<img src="https://img.shields.io/badge/Build-Passing-09090B?style=for-the-badge&logo=githubactions&logoColor=22c55e" alt="Build Status">
<img src="https://img.shields.io/badge/Python-3.11+-09090B?style=for-the-badge&logo=python&logoColor=38bdf8" alt="Python">
<img src="https://img.shields.io/badge/React-18+-09090B?style=for-the-badge&logo=react&logoColor=61dafb" alt="React">
<img src="https://img.shields.io/badge/License-MIT-09090B?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="License">

</div>

---

## 1. Project Title

**Career Compass AI** — _Intelligent Career Copilot for Resume Parsing, Skill Gap Analysis, Personalized Learning Roadmaps, and Contextual Career Guidance._

---

## 2. Project Overview

**Career Compass AI** is an end-to-end, data-driven career development platform designed to bridge the gap between job seekers' existing skill sets and rapidly evolving industry demands.

By integrating Natural Language Processing (NLP), structured Pydantic extraction, and Retrieval-Augmented Generation (RAG), Career Compass AI allows users to upload resumes, analyze target job descriptions, discover granular skill gaps, receive prioritized learning plans, and interact with a streaming AI Career Assistant.

---

## 3. Problem Statement

1. **Skill Mismatch & Industry Evolution**: Tech requirements evolve faster than educational curricula, leaving candidates with uncalibrated skill gaps.
2. **Generic Career Advice**: Traditional counseling lacks precise, data-driven evaluation of a candidate's actual qualifications against specific job descriptions.
3. **Black-Box ATS Filtering**: Applicants frequently suffer rejection without understanding why their resume failed Automated Tracking System (ATS) screens.
4. **Information Overload**: An overwhelming abundance of online courses makes it difficult to prioritize high-impact learning paths.

---

## 4. Key Features

- 📄 **Resume Parser & Extractor**: Parses `.pdf` and `.docx` files to extract technical/soft skills, work history, projects, certifications (with links), and web profiles (GitHub, LinkedIn, Portfolio).
- 🎯 **Job Description Parser**: Extracts structured criteria from pasted text (Title, Required vs. Preferred Skills, Experience, Education, Responsibilities, Work Mode, Location, and Salary).
- 📊 **3-Way Skill Gap Analysis**: Categorizes skills into **Matched**, **Missing**, and **Partially Available** skills.
- 🏆 **Career Match Assessment**: Evaluates candidacy into **High Match**, **Moderate Match**, or **Low Match** tiers, accompanied by Strengths, Skill Gaps, Weaknesses, and Strategic Improvements.
- 🚀 **Skill Prioritization**: Ranks missing skills into actionable badges (`Priority 1 — Core Blocking`, `Priority 2 — High Value`, `Priority 3 — Secondary`).
- 🗺️ **Personalized Learning Plan**: Generates milestone-based roadmaps tailored to user-specified weekly learning hours and preferred study duration.
- 🗂️ **Multi-Roadmap Carousel & 1:N Role Tracker**: Swipeable horizontal deck allowing candidates to concurrently track multiple target job applications ($1:N$) with individual ATS match score badges, daily/weekly pacing toggles, and isolated task completion lists.
- 🗑️ **Safe Roadmap Cancellation**: Gated 3D frosted glass modal requiring explicit confirmation before removing an unwanted target role and its study milestones.
- 🔐 **Privacy-First PLG User Lifecycle & Two-Tier Storage**:
  - **Frictionless Anonymous Exploration**: Guest visitors can freely upload resumes, analyze target JDs, view ATS match scores, and interact with the Career Copilot without prior signup.
  - **Ephemeral Guest Privacy**: All unauthenticated resume inputs and analysis data reside in temporary browser session memory (`sessionStorage`) and automatically vanish when the user leaves or closes the tab, guaranteeing a clean slate for returning visitors.
  - **Roadmap Value Gate & State Stashing**: When a guest chooses to generate or track an upskilling roadmap, a seamless authentication modal saves their in-flight analysis ("state stashing"), links it to their new account, and persists the roadmap to the Supabase cloud without requiring re-upload.
  - **Returning User CV Reusability**: Authenticated users have their active parsed CV stored securely in the cloud. Upon returning, their active resume is pre-loaded, enabling instant 1-click analysis against new job descriptions or the option to upload a revised CV.
- 💬 **RAG-Powered AI Career Assistant**: Contextual streaming chatbot providing interactive guidance on resume tailoring, interview prep, and skill acquisition powered by empirically verified **Parent-Child hierarchical retrieval** (EXP-RAG-01: 100% Hit Rate, 0.92 F1, 93.68 Winner Score).

---

## 5. System Architecture

Career Compass AI uses a **Layered Monolith Architecture** engineered for high modularity and microservice readiness.

```mermaid
graph TD
    subgraph Presentation ["Presentation Layer"]
        UI["React / TypeScript SPA + Tailwind UI (Multi-Roadmap Carousel)"]
    end

    subgraph APILayer ["Application API Layer"]
        API["FastAPI Routes (Profile, Resume, Gap, RAG, Roadmap)"]
    end

    subgraph BusinessLogic ["Business Logic Layer"]
        PM["Profile Manager"]
        GA["Gap Analysis Engine"]
        RM["Roadmap Generator"]
    end

    subgraph AIEngine ["AI & RAG Processing Layer"]
        RE["Resume Extractor"]
        JDP["JD Parser"]
        VR["Vector Retriever"]
        CHAT["AI Assistant"]
    end

    subgraph Persistence ["Persistence Layer"]
        LOC[("Client Offline Store (localStorage)")]
        RDB[("Supabase PostgreSQL (Profiles / Jobs / Roadmaps)")]
        VDB[("Vector DB: Chroma / Qdrant")]
    end

    UI -->|"HTTPS / REST API"| API
    API --> PM
    API --> GA
    API --> RM
    PM --> RE
    GA --> JDP
    RM --> VR
    API --> CHAT
    RE --> RDB
    JDP --> RDB
    VR --> VDB
    CHAT --> VDB
```

### 5.1 Database Schema & Entity-Relationship Architecture (Supabase PostgreSQL)

The system manages a $1:N$ multi-target portfolio where a candidate can evaluate multiple job opportunities and track separate upskilling roadmaps concurrently against their verified profile.

```mermaid
erDiagram
    USER_PROFILES ||--o{ WORK_EXPERIENCES : has
    USER_PROFILES ||--o{ CERTIFICATIONS : holds
    USER_PROFILES ||--o{ ANALYSIS_RESULTS : analyzed_with
    JOB_DESCRIPTIONS ||--o{ ANALYSIS_RESULTS : evaluated_against
    ANALYSIS_RESULTS ||--o{ ROADMAPS : generates
    ROADMAPS ||--o{ ROADMAP_TASKS : tracks

    USER_PROFILES {
        string id PK "usr_xxxxxxxx"
        string user_id "auth.users UUID (optional)"
        string full_name
        string current_role
        string target_role
        string education_degree
        string institution
        int graduation_year
        json skills "Array of technical skills"
        json soft_skills "Array of soft skills"
        json career_interests "Target specializations"
        string status "active / archived"
        string created_at "ISO-8601 Timestamp"
    }

    WORK_EXPERIENCES {
        int id PK "Auto-increment"
        string profile_id FK "References user_profiles.id"
        string company
        string role
        string duration
        json highlights "Bullet achievements"
    }

    CERTIFICATIONS {
        int id PK "Auto-increment"
        string profile_id FK "References user_profiles.id"
        string name
        string issuer
        int issue_year
    }

    JOB_DESCRIPTIONS {
        string id PK "job_xxxxxxxx"
        string user_id "auth.users UUID (optional)"
        string company_name
        string job_title
        text raw_job_description
        json required_skills "Mandatory criteria"
        json preferred_skills "Bonus qualifications"
        json responsibilities "Extracted duties"
        string required_experience
        string education_requirements
        string work_mode "Remote / Hybrid / Onsite"
        string location
        string salary_range
        string created_at "ISO-8601 Timestamp"
    }

    ANALYSIS_RESULTS {
        string id PK "anl_xxxxxxxx"
        string profile_id FK "References user_profiles.id"
        string job_id FK "References job_descriptions.id"
        string readiness_category "High / Moderate / Low Match"
        float match_score_percentage "0.0% - 100.0%"
        json matched_skills "Common competencies"
        json missing_skills "Identified gap skills"
        json partially_available_skills "Transferable skills"
        json assessment "LLM Qualitative Analysis"
        string created_at "ISO-8601 Timestamp"
    }

    ROADMAPS {
        string id PK "rdm_xxxxxxxx"
        string user_id "auth.users UUID (optional)"
        string analysis_id FK "References analysis_results.id"
        string company_name
        string job_title
        int ats_score_percentage
        int weekly_hours "Study commitment (1-40h/wk)"
        int duration_weeks "Pacing (1-52 wks)"
        json prioritization_badges "Priority 1, 2, 3 Badges"
        json weekly_milestones "Weekly curriculum & resources"
        string created_at "ISO-8601 Timestamp"
    }

    ROADMAP_TASKS {
        int id PK "Auto-increment"
        string roadmap_id FK "References roadmaps.id"
        string user_id "auth.users UUID (optional)"
        string task_key "w1_t0, w2_t1, etc."
        boolean is_completed "Live checkbox state"
    }
```

### 5.2 User Lifecycle & Conversion Flow (Product-Led Growth & Ephemeral Privacy)

The platform implements an anonymous-first Product-Led Growth (PLG) architecture that strictly safeguards visitor privacy while providing seamless cloud sync upon authentication:

```mermaid
flowchart TD
    Guest["👤 Anonymous Guest"] -->|"Upload CV + Paste JD"| InstantAnalysis["⚡ Instant Gap Analysis & ATS Score"]
    InstantAnalysis --> CopilotChat["💬 Career Copilot Interaction (Ephemeral Session)"]
    CopilotChat --> Leave["🚪 Closes Browser Tab ➔ Session Wiped (Clean Slate on Return)"]

    InstantAnalysis -->|"Clicks 'Generate Roadmap'"| ValueGate{"🔐 Account Exists?"}
    ValueGate -->|"No"| AuthModal["Modal: Save Progress & Unlock Roadmap\n(In-flight state stashed)"]
    AuthModal -->|"Sign Up / Login"| AutoLink["Auto-Link Analysis & Sync Roadmap to Supabase"]
    ValueGate -->|"Yes"| AutoLink

    AutoLink --> Dashboard["🗺️ Interactive Multi-Roadmap Workspace & Tracking"]
    Dashboard --> Return["🔄 Returns Later (Logged In)"]
    Return --> ReusableCV["📄 Pre-loaded Active CV on File"]
    ReusableCV -->|"Option A"| FastAnalyze["⚡ 1-Click Gap Analysis on New Target JD"]
    ReusableCV -->|"Option B"| UpdateCV["📤 Upload Updated CV to Cloud Profile"]
```

---

## 6. Tech Stack

### Shieldcn Badges Matrix

#### **Frontend**

![React](https://img.shields.io/badge/React-09090B?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-09090B?style=for-the-badge&logo=typescript&logoColor=3178C6)
![Vite](https://img.shields.io/badge/Vite-09090B?style=for-the-badge&logo=vite&logoColor=646CFF)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-09090B?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4)

#### **Backend**

![Python](https://img.shields.io/badge/Python-09090B?style=for-the-badge&logo=python&logoColor=3776AB)
![FastAPI](https://img.shields.io/badge/FastAPI-09090B?style=for-the-badge&logo=fastapi&logoColor=009688)
![Pydantic](https://img.shields.io/badge/Pydantic-09090B?style=for-the-badge&logo=pydantic&logoColor=E92063)
![Uvicorn](https://img.shields.io/badge/Uvicorn-09090B?style=for-the-badge&logo=python&logoColor=4053D6)

#### **AI & Data Persistence**

![Groq Cloud](https://img.shields.io/badge/Groq_Cloud-09090B?style=for-the-badge&logo=sparkfun&logoColor=F05A28)
![Supabase](https://img.shields.io/badge/Supabase-09090B?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![Pinecone](https://img.shields.io/badge/Pinecone-09090B?style=for-the-badge&logo=treehouse&logoColor=22C55E)
![LangChain](https://img.shields.io/badge/LangChain-09090B?style=for-the-badge&logo=chainlink&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-09090B?style=for-the-badge&logo=sqlite&logoColor=FF6F61)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-09090B?style=for-the-badge&logo=postgresql&logoColor=4169E1)

#### **DevOps & Quality Assurance**

![Docker](https://img.shields.io/badge/Docker-09090B?style=for-the-badge&logo=docker&logoColor=2496ED)
![Pytest](https://img.shields.io/badge/Pytest-09090B?style=for-the-badge&logo=pytest&logoColor=0A9EDC)

| Layer                | Technologies Used                                                                                                                                                           |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons                                                                                                                      |
| **Backend**          | Python 3.11+, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy                                                                                                                     |
| **AI & RAG**         | LangChain (`langchain-groq`, `langchain-pinecone`), **Groq LPU Inference API** (Llama 3.3 70B), **Parent-Child RAG Retrieval** (`BAAI/bge-small-en-v1.5`, 384-dim, Top-K=5) |
| **Databases**        | **Supabase PostgreSQL** (Relational SQL) & **Pinecone Cloud** (Vector DB, ChromaDB fallback)                                                                                |
| **Testing & DevOps** | Pytest, HTTPX, Docker, Docker Compose                                                                                                                                       |

---

## 7. Project Structure

```
career-compass-ai/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Route Controllers (profile, resume, gap, chat)
│   │   ├── core/            # Configuration, Security, Environment settings
│   │   ├── db/              # Database initialization & session management
│   │   ├── models/          # Pydantic Schemas & SQLAlchemy ORM Models
│   │   ├── services/
│   │   │   ├── extractors/  # Resume & Job Description LLM Parsers (Groq / Gemini)
│   │   │   ├── gap_analysis/# Skill Matching & Readiness Heuristics
│   │   │   └── rag/         # Vector Store Retriever & Streaming Chat Chains
│   │   └── utils/           # Text Sanitization & File Helpers
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # ResumeUploader, SkillGapMatrix, RoadmapView, ChatWidget
│   │   ├── pages/           # Dashboard, Analysis, Settings
│   │   ├── services/        # API Axios Client & Interceptors
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/                    # PRD.md, SRS.md, SAD.md, IMPLEMENTATION_PLAN.md
├── tests/                   # Pytest Unit & Integration Suite
├── docker-compose.yml
└── README.md
```

---

## 8. How It Works

```mermaid
sequenceDiagram
    autonumber
    actor User as Job Seeker
    participant UI as Frontend (React)
    participant API as Backend (FastAPI)
    participant AI as Extractor & Groq LLM API
    participant RAG as Vector DB & AI Assistant

    User->>UI: Upload Resume (PDF/DOCX)
    UI->>API: POST /api/v1/resume/upload
    API->>AI: Extract Structured Profile (Pydantic Schema via Groq)
    AI-->>API: Return Profile JSON
    API-->>UI: Pre-fill Profile Form

    User->>UI: Paste Target Job Description
    UI->>API: POST /api/v1/analysis/gap
    API->>API: Compute Deterministic Skill Overlap & ATS Match Score (Zero Hallucination)
    API->>AI: Generate Qualitative Assessment via LangChain LCEL Chain (Groq Llama 3)
    AI-->>API: Return Candidate Strengths, Gaps & Recommendations
    API-->>UI: Render Skill Gap Matrix, ATS Gauge & Assessment

    User->>UI: Request Learning Plan (Specify Hours & Weeks)
    UI->>API: POST /api/v1/roadmap/generate
    API->>RAG: Fetch Curated Modules for Missing Skills
    RAG-->>API: Return Roadmap Milestones
    API-->>UI: Display Interactive Prioritized Roadmap

    User->>UI: Ask Career Assistant Question
    UI->>API: POST /api/v1/chat/message
    API->>RAG: Retrieve Vector Context + Stream Groq Response
    RAG-->>UI: Real-Time Streaming Chat Response
```

---

## 9. Setup & Installation

### Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: 18.0 or higher
- **Groq API Key**: Obtain a free API key from [Groq Console](https://console.groq.com/keys)
- **Docker** _(Optional)_: Desktop v20+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   ```
3. Install dependencies (includes `langchain-groq`):
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 10. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server & Application Settings
ENVIRONMENT=development
PORT=8000
DEBUG=True
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# Primary AI Provider — Groq LPU Inference API
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_api_key_from_console_groq_com
GROQ_MODEL=llama-3.3-70b-versatile

# Vector Database — Pinecone Cloud Serverless (or "chroma" for local)
VECTOR_DB_PROVIDER=pinecone
PINECONE_API_KEY=your_pinecone_api_key_from_app_pinecone_io
PINECONE_INDEX_NAME=career-compass-index

# Relational Database — Supabase PostgreSQL (or "sqlite" URI for local)
DATABASE_URL=postgresql://postgres.hvptbsolhdycbnaizjlf:YOUR_SUPABASE_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

---

## 11. Running the Application

### Option A: Local Development Mode

1. **Start the Backend API Server**:

   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

   _Backend API docs available at: `http://localhost:8000/docs`_

2. **Start the Frontend Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   _Frontend application available at: `http://localhost:5173`_

### Option B: Docker Compose

Start the full stack with containerized services:

```bash
docker-compose up --build
```

---

## 12. API Documentation

| Endpoint                   | Method                 | Description                                                 |
| :------------------------- | :--------------------- | :---------------------------------------------------------- |
| `/api/v1/profile`          | `GET` / `POST` / `PUT` | Manage user profile attributes                              |
| `/api/v1/resume/upload`    | `POST`                 | Upload and parse `.pdf`/`.docx` resume file                 |
| `/api/v1/jobs/extract`     | `POST`                 | Parse raw pasted Job Description text                       |
| `/api/v1/analysis/gap`     | `POST`                 | Perform 3-way skill gap & career readiness match assessment |
| `/api/v1/roadmap/generate` | `POST`                 | Generate milestone-based learning plan                      |
| `/api/v1/chat/message`     | `POST`                 | Send question to streaming RAG AI Career Assistant          |

---

## 13. AI / LangChain Architecture

The core data processing pipeline leverages LangChain and Pydantic structured output models:

```mermaid
graph TD
    subgraph Inputs ["Inputs"]
        I1["Resume / Current Skills"]
        I2["Job Description"]
        I3["Learning Materials PDFs/Links"]
    end

    I1 --> L1["LangChain PyPDF/Docx Loader"]
    I2 --> L2["LangChain Text Loader"]
    I3 --> L3["Text Splitter & Embeddings"]

    subgraph DataProcessing ["Data Processing"]
        DP1["Extractor: Structured Candidate Profile"]
        DP2["Extractor: Structured Job Requirements"]
        DP3[(Vector DB: Chroma / FAISS)]
    end

    L1 --> DP1
    L2 --> DP2
    L3 --> DP3

    subgraph CoreEngine ["Core Engine"]
        CE1["Gap Analysis & Suitability Scorer"]
        CE2["Personalized Learning Plan Generator"]
    end

    DP1 --> CE1
    DP2 --> CE1
    CE1 -->|"Missing Skills Query"| DP3
    DP3 -->|"Retrieved Learning Modules"| CE2

    subgraph Output ["Output"]
        O1["Final Report: Suitability % + Gap Analysis + Custom Study Plan"]
    end

    CE1 --> O1
    CE2 --> O1
```

---

## 14. Testing

Run the backend automated test suite using `pytest`:

```bash
cd backend
pytest tests/ -v
```

---

## 15. Evaluation & Performance Metrics

- **Matching Precision**: $> 85\%$ accuracy in extracting skills and categorizing gaps.
- **API Response Latency**: $< 10\text{ s}$ for full resume parsing and gap analysis workflows.
- **Streaming Chat Latency**: $< 2\text{ s}$ first-token delivery for the AI Career Assistant.

---

## 16. Screenshots / Demo

- **Resume Uploader & Profile Extractor UI**: Drag-and-drop resume parser with instant entity pre-filling.
- **Skill Gap Matrix**: 3-column comparative view (Matched vs. Missing vs. Partial Skills).
- **Personalized Roadmap**: Prioritized skill milestones ($P1, P2, P3$) with interactive task checkboxes.
- **Streaming AI Assistant**: Conversational chat interface answering targeted career prep questions.

---

## 17. Limitations

- **Image-Only Resumes**: Scanned image PDFs without text layers require OCR pre-processing.
- **Third-Party API Rate Limits**: High-frequency LLM extraction calls depend on external provider quotas.
- **Manual Job Input**: MVP relies on pasted Job Description text (automated web scraping planned for future release).

---

## 18. Future Improvements

- 🔄 **LinkedIn Data Import**: One-click profile sync via OAuth integration.
- 🤖 **Multi-Agent Orchestration**: LangGraph multi-agent teams for deep career coaching.
- 🌐 **Live Job Board Indexing**: Direct integration with job APIs to auto-fetch live job descriptions.
- 🎙️ **Mock Interview Simulator**: Real-time AI voice/video interview practice.
