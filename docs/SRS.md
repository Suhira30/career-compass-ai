# Software Requirements Specification (SRS)

## Project Title

**Career Compass AI** — _AI-Powered Career Navigation, Skill Gap Analysis & Upskilling Platform_

---

## 1. Document Overview & Alignment

This Requirements Specification Document (RSD) defines the functional and non-functional requirements for the **Career Compass AI** platform. It has been cross-checked against the Product Requirement Document (`PRD.md`) to maintain technical consistency across system components, backend APIs, data pipelines, and user interface workflows.

---

## 2. Functional Requirements (FR)

### FR-01: User Profile Management

- **Description**: The system shall allow users to create, view, edit, and persist a career profile.
- **Fields Required**:
  - Full Name
  - Educational Background (Degree, Institution, Graduation Year)
  - Current Role / Title
  - Existing Technical & Soft Skills
  - Work Experience Summary & Timeline
  - Career Interests & Aspirations
  - Target Job Role(s)
- **Acceptance Criteria**:
  - User can manually edit or update any field in their profile at any time.
  - System validates required profile inputs before saving.

---

### FR-02: Resume Upload

- **Description**: The system shall allow users to upload their resume file for parsing and automated profile population.
- **Supported File Formats**:
  - Portable Document Format (`.pdf`)
  - Microsoft Word Document (`.docx`)
- **Acceptance Criteria**:
  - File size limits (e.g., maximum 10 MB per file) are enforced with helpful validation messages.
  - Drag-and-drop as well as standard file browse select options are available.

---

### FR-03: Resume Information Extraction

- **Description**: The system shall automatically parse uploaded resumes and extract key structural entity data using NLP/LLM extraction modules.
- **Extracted Entities**:
  1. Technical Skills
  2. Soft Skills
  3. Education History
  4. Work Experience & Project Descriptions
  5. Projects & Roles
  6. Certifications and verifiable certification links
  7. Web & Social Profiles: GitHub, LinkedIn, Personal Portfolio links
- **Acceptance Criteria**:
  - Extracted entity fields automatically pre-fill or merge into the user profile (`FR-01`).
  - User is prompted to review and confirm extracted values for accuracy.

---

### FR-04: Job Description Input

- **Description**: The system shall allow users to submit target job descriptions for analysis.
- **Input Method**: Direct text paste into a dedicated Job Description input field.
- **Acceptance Criteria**:
  - Supports rich text or plain text inputs up to 15,000 characters.
  - Clear text / Reset button provided for effortless input clearing.

---

### FR-05: Job Requirement Extraction

- **Description**: The system shall analyze the submitted job description text and automatically extract structured job metadata and criteria.
- **Extracted Attributes**:
  - Job Title
  - Required Skills (Must-Have)
  - Preferred Skills (Nice-to-Have)
  - Required Years of Experience
  - Education Requirements
  - Core Responsibilities
  - Work Mode (e.g., Remote, Hybrid, On-site)
  - Office Location / Region
  - Compensation / Salary details (if explicitly present in description text)
- **Acceptance Criteria**:
  - Missing attributes (e.g., salary unlisted in text) are explicitly flagged as "Not Specified" without breaking parser workflow.

---

### FR-06: Skill Gap Analysis (User Profile vs. Job Requirements)

- **Description**: The system shall compare extracted User Profile skills against extracted Job Requirement skills to generate a comparative breakdown.
- **Skill Categorization Engine**:
  - **Matching Skills**: Skills possessed by the user that fully meet job requirements.
  - **Missing Skills**: Critical/preferred skills required by the job that the user lacks.
  - **Partially Available Skills**: Related or adjacent skills possessed by the user requiring incremental domain extension (e.g., user knows JavaScript, job requires TypeScript).
- **Acceptance Criteria**:
  - Visual side-by-side matrix rendering matched, missing, and partial skills.

---

### FR-07: Career Match Assessment

- **Description**: The system shall generate a overall career-readiness assessment comparing user credentials against target job requirements.
- **Assessment Components**:
  - **Strengths**: Highlighting candidate advantages over target role demands.
  - **Skill Gaps**: Itemized overview of missing core competencies.
  - **Potential Weaknesses**: Experience level or qualification disparities.
  - **Recommended Improvements**: High-level strategic advice to improve candidacy.
- **Readiness Classification**:
  - **High Match**: High overlap in required skills and experience.
  - **Moderate Match**: Core skills present, but key technical gaps or experience deficits exist.
  - **Low Match**: Substantial gaps in core skills and foundational qualifications.
- **Acceptance Criteria**:
  - Assessment displays the readiness tier (High/Moderate/Low) along with structured breakdown sections.

---

### FR-08: Personalized Learning Recommendations

- **Description**: The system shall analyze missing and partial skills to generate a prioritized skill acquisition list.
- **Prioritization Structure**:
  - `Priority 1`: Critical blocking skills (e.g., _Priority 1 — Docker_)
  - `Priority 2`: High-value core skills (e.g., _Priority 2 — AWS_)
  - `Priority 3`: Secondary/supplementary skills (e.g., _Priority 3 — CI/CD_)
- **Acceptance Criteria**:
  - Priority ordering clearly reflects impact on target job readiness.

---

### FR-09: Personalized Learning Plan

- **Description**: The system shall generate a structured learning roadmap tailored to user constraints and target outcomes.
- **Plan Inputs & Drivers**:
  - Identified Missing & Partial Skills (`FR-06`)
  - Target Job Role (`FR-05`)
  - User's Available Learning Time (e.g., 5 hrs/week, 10 hrs/week)
  - User's Preferred Learning Duration (e.g., 4 weeks, 8 weeks, 12 weeks)
- **Acceptance Criteria**:
  - Roadmap generates realistic weekly learning milestones fitting user time constraints.

---

### FR-09A: Multi-Target Roadmap Deck & Independent Tracking

- **Description**: The system shall support concurrently tracking multiple target job roles ($1:N$) in a horizontal swipeable/scrollable deck.
- **Card Attributes**:
  - Target Job Title and Company Name
  - ATS Match Score percentage badge with dynamic color thresholding
  - Time Budget indicator (Weekly Hours vs. Daily Target pace)
  - Live task completion progress bar ($X / Y$ tasks completed, percentage)
  - Active curriculum indicator
- **Independent State Isolation**:
  - Checking off a task in Roadmap A shall not alter task completion states in Roadmap B.
  - Progress shall be auto-persisted to client storage (`localStorage`) and cloud database (Supabase).

---

### FR-09B: Gated Roadmap Cancellation with Confirmation Modal

- **Description**: The system shall provide an explicit cancellation mechanism to remove unwanted target roadmaps from the active deck.
- **Safety Safeguard**:
  - Clicking the delete button shall trigger a centered 3D frosted glass modal displaying the target company and role name.
  - The modal shall explicitly warn that all completed task checkboxes and milestone tracking for this role will be cleared.
  - The roadmap shall only be removed if the user explicitly confirms ("Yes, Cancel Roadmap").

---

### FR-10: Career AI Assistant

- **Description**: The system shall provide an interactive conversational AI chatbot for user Q&A regarding their career match assessment, resume optimization, and skill gap strategy.
- **Capabilities**:
  - Answers specific questions on why certain skills were categorized as gaps.
  - Suggests project ideas to build missing skills.
  - Provides advice on resume phrasing and interview prep.
- **Acceptance Criteria**:
  - Chat assistant preserves conversation context within active user session.

---

## 3. Non-Functional Requirements (NFR)

### NFR-01: Performance

- **Response Latency**: Standard AI operations (resume parsing, gap analysis, career assessment) shall complete and return results within 5–10 seconds under normal load.
- **Conversational AI Latency**: Career Assistant chat streaming response first-token delivery shall occur within < 2 seconds.

### NFR-02: Usability

- **Intuitive UI**: Simple, clean, and modern user interface accessible to students, early-career job seekers, and non-technical users.
- **Clear Navigation**: Responsive design with straightforward task flows for resume upload, gap inspection, and chat.

### NFR-03: Security & Privacy

- **Personal Data Protection**: Uploaded resumes contain personally identifiable information (PII). Files shall be encrypted at rest and in transit (TLS 1.3).
- **Privacy Controls**: Uploaded documents shall not be retained in public vector indexes or used to train third-party public models without consent.

### NFR-04: Reliability & Error Handling

- **Robust File Validation**: System gracefully handles invalid file types (e.g., `.exe`, `.png`), corrupted documents, or files exceeding size limits.
- **Service Resiliency**: Graceful fallback handling in event of AI service timeouts or API failures (e.g., retries with friendly error messages).
- **Service Resiliency & Multi-LLM Failover**: Automated primary-to-fallback routing across Groq LPU (Primary), Google Gemini (Fallback 1), and OpenAI (Fallback 2) in the event of API rate limits (HTTP 429), timeouts, or service outages.
- **Missing Data Resilience**: System operates smoothly even when user profile data or job descriptions contain incomplete or omitted information.

### NFR-05: Maintainability & Architecture

- **Modular Architecture**: Strict separation of concerns across application layers:
  - **API Layer**: Route handlers & request validation.
  - **Business Logic Layer**: Skill gap calculation, matching heuristics.
  - **AI Workflow Layer**: Extractor prompts, RAG chains, LLM orchestrators.
  - **Data Storage Layer**: Relational/Document database and Vector store repositories.

### NFR-06: Scalability & Extensibility

- **Provider Agnosticism**: Architecture allows plug-and-play swapping or multi-model routing across different LLM providers (e.g., Gemini, OpenAI, Claude).
- **Extensible Ecosystem**: Designed to accommodate future extensions such as live job board scrapers, RAG vector stores, and automated ATS simulators without rewriting core business logic.

---

## 4. Traceability & PRD Cross-Check

| RSD Requirement                          | Corresponding PRD Section      | Status / Alignment                                   |
| :--------------------------------------- | :----------------------------- | :--------------------------------------------------- |
| **FR-01**: User Profile                  | Section 4.1 (Module 1)         | Fully Aligned                                        |
| **FR-02**: Resume Upload                 | Section 4.1 (Module 1)         | Fully Aligned (PDF / DOCX)                           |
| **FR-03**: Resume Information Extraction | Section 4.1 (Module 1)         | Fully Aligned (Extends link & cert fields)           |
| **FR-04**: Job Description Input         | Section 4.2 (Module 2)         | Fully Aligned (Text paste)                           |
| **FR-05**: Job Requirement Extraction    | Section 4.2 (Module 2)         | Fully Aligned (Extends work mode, salary, location)  |
| **FR-06**: Skill Gap Analysis            | Section 4.2 (Module 2)         | Fully Aligned (Matched, Missing, Partial)            |
| **FR-07**: Career Match Assessment       | Section 4.2 & 4.3 (Module 2/3) | Fully Aligned (High, Moderate, Low tiers)            |
| **FR-08**: Skill Prioritization          | Section 4.4 (Module 4)         | Fully Aligned (Priority 1, 2, 3 scheme)              |
| **FR-09**: Personalized Learning Plan    | Section 4.4 (Module 4)         | Fully Aligned (Incorporate learning time & duration) |
| **FR-10**: Career AI Assistant           | Section 4.3 (Module 3)         | Fully Aligned (RAG chatbot)                          |
| **NFR-01 to NFR-06**                     | System Quality Attributes      | Fully Aligned with architecture design               |
