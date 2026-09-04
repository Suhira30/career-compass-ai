# Career Compass AI — API Documentation Specification

## Project Title
**Career Compass AI** — *AI-Powered Career Navigation, Skill Gap Analysis & Upskilling Platform*

---

## 1. Overview & General Conventions
This document specifies the RESTful API endpoints for the **Career Compass AI** backend service.

* **Base URL**: `http://localhost:8000/api/v1`
* **Protocol**: `HTTP / HTTPS`
* **Data Format**: `JSON` (`application/json`) except file uploads (`multipart/form-data`)
* **Interactive API Explorer**: `http://localhost:8000/docs` (Swagger UI) / `http://localhost:8000/redoc` (ReDoc)

---

## 2. API Endpoints Specification

### 2.1 User Profile Management (`/api/v1/profile`)

#### **Endpoint**: `POST /api/v1/profile`
* **Description**: Creates or updates a user's career profile. Can be populated manually or auto-filled via resume extraction.
* **HTTP Method**: `POST`
* **Content-Type**: `application/json`
* **Target Requirement**: `FR-01`

**Request Payload Schema**:
```json
{
  "full_name": "Jane Doe",
  "education_degree": "Bachelor of Science in Computer Science",
  "institution": "State University",
  "graduation_year": 2024,
  "current_role": "Junior Software Engineer",
  "target_role": "Senior Full-Stack AI Engineer",
  "skills": ["Python", "JavaScript", "React", "SQL"],
  "soft_skills": ["Problem Solving", "Teamwork"],
  "career_interests": ["Artificial Intelligence", "Cloud Architecture"]
}
```

**Response Payload Schema (201 Created / 200 OK)**:
```json
{
  "profile_id": "usr_987654321",
  "full_name": "Jane Doe",
  "target_role": "Senior Full-Stack AI Engineer",
  "created_at": "2026-09-04T13:58:00Z",
  "status": "active"
}
```

---

#### **Endpoint**: `GET /api/v1/profile/{profile_id}`
* **Description**: Fetches existing user profile details by ID.
* **HTTP Method**: `GET`
* **Response Payload Schema (200 OK)**: Returns full profile JSON object.

---

### 2.2 Resume Upload & Extraction (`/api/v1/resume/upload`)

#### **Endpoint**: `POST /api/v1/resume/upload`
* **Description**: Accepts `.pdf` or `.docx` resume file uploads. Extracts structured entities (skills, experience, certs, GitHub/LinkedIn links) using Groq Llama-3.3-70B.
* **HTTP Method**: `POST`
* **Content-Type**: `multipart/form-data`
* **Target Requirement**: `FR-02`, `FR-03`

**Request Payload**:
* Form parameter `file`: File binary (`.pdf` or `.docx`, max 10MB).

**Response Payload Schema (200 OK)**:
```json
{
  "file_name": "Jane_Doe_Resume.pdf",
  "extracted_data": {
    "technical_skills": ["Python", "FastAPI", "React", "Docker", "SQL"],
    "soft_skills": ["Communication", "Leadership"],
    "education": [
      {
        "degree": "B.S. Computer Science",
        "institution": "State University",
        "year": 2024
      }
    ],
    "work_experience": [
      {
        "company": "Tech Corp",
        "role": "Software Developer Development Intern",
        "duration": "2023 - 2024",
        "highlights": ["Built REST APIs in Python", "Optimized SQL queries"]
      }
    ],
    "projects": [
      {
        "title": "Portfolio Web App",
        "description": "Full-stack React app with authentication"
      }
    ],
    "certifications": [
      {
        "title": "AWS Certified Cloud Practitioner",
        "verification_link": "https://aws.amazon.com/verify/12345"
      }
    ],
    "links": {
      "github": "https://github.com/janedoe",
      "linkedin": "https://linkedin.com/in/janedoe",
      "portfolio": "https://janedoe.dev"
    }
  }
}
```

---

### 2.3 Job Description Ingestion & Parsing (`/api/v1/jobs/extract`)

#### **Endpoint**: `POST /api/v1/jobs/extract`
* **Description**: Parses raw pasted target Job Description text into structured criteria.
* **HTTP Method**: `POST`
* **Content-Type**: `application/json`
* **Target Requirement**: `FR-04`, `FR-05`

**Request Payload Schema**:
```json
{
  "raw_job_description": "We are seeking a Senior AI Engineer. Required: Python, FastAPI, Docker, Groq/OpenAI, ChromaDB. Preferred: Kubernetes, CI/CD. Work Mode: Remote. Location: San Francisco, CA. Salary: $140,000 - $170,000."
}
```

**Response Payload Schema (200 OK)**:
```json
{
  "job_id": "job_123456789",
  "extracted_job": {
    "job_title": "Senior AI Engineer",
    "required_skills": ["Python", "FastAPI", "Docker", "Groq/OpenAI", "ChromaDB"],
    "preferred_skills": ["Kubernetes", "CI/CD"],
    "required_experience": "3+ years",
    "education_requirements": "Bachelor's in CS or equivalent",
    "work_mode": "Remote",
    "location": "San Francisco, CA",
    "salary_range": "$140,000 - $170,000"
  }
}
```

---

### 2.4 Skill Gap Analysis & Suitability Scoring (`/api/v1/analysis/gap`)

#### **Endpoint**: `POST /api/v1/analysis/gap`
* **Description**: Compares candidate's extracted profile skills against extracted job criteria. Generates a 3-way skill matrix and readiness match tier (`High Match`, `Moderate Match`, `Low Match`).
* **HTTP Method**: `POST`
* **Content-Type**: `application/json`
* **Target Requirement**: `FR-06`, `FR-07`

**Request Payload Schema**:
```json
{
  "profile_id": "usr_987654321",
  "job_id": "job_123456789"
}
```

**Response Payload Schema (200 OK)**:
```json
{
  "analysis_id": "anl_555666777",
  "readiness_category": "Moderate Match",
  "match_score_percentage": 68.5,
  "skill_matrix": {
    "matched_skills": ["Python", "FastAPI"],
    "missing_skills": ["Docker", "Kubernetes", "CI/CD"],
    "partially_available_skills": ["Groq/OpenAI", "ChromaDB"]
  },
  "assessment": {
    "strengths": ["Strong foundational Python experience", "FastAPI REST knowledge"],
    "skill_gaps": ["Lacks containerization (Docker)", "Missing cloud deployment (Kubernetes)"],
    "potential_weaknesses": ["Limited DevOps background"],
    "recommended_improvements": ["Focus on Docker containerization first, then CI/CD pipelines."]
  }
}
```

---

### 2.5 Personalized Learning Roadmap Generator (`/api/v1/roadmap/generate`)

#### **Endpoint**: `POST /api/v1/roadmap/generate`
* **Description**: Ranks missing skills into priority badges (`Priority 1`, `Priority 2`, `Priority 3`) and queries ChromaDB vector store to produce a week-by-week learning plan.
* **HTTP Method**: `POST`
* **Content-Type**: `application/json`
* **Target Requirement**: `FR-08`, `FR-09`

**Request Payload Schema**:
```json
{
  "analysis_id": "anl_555666777",
  "available_hours_per_week": 5,
  "preferred_duration_weeks": 4
}
```

**Response Payload Schema (200 OK)**:
```json
{
  "roadmap_id": "rdm_999888777",
  "prioritization_badges": {
    "priority_1_critical": ["Docker"],
    "priority_2_high": ["CI/CD"],
    "priority_3_secondary": ["Kubernetes"]
  },
  "weekly_milestones": [
    {
      "week": 1,
      "focus_skill": "Docker Fundamentals",
      "target_hours": 5,
      "tasks": [
        "Learn Dockerfile syntax and image building",
        "Containerize FastAPI backend application"
      ],
      "resources": [
        "https://docs.docker.com/get-started/"
      ]
    },
    {
      "week": 2,
      "focus_skill": "Docker Compose & Networking",
      "target_hours": 5,
      "tasks": [
        "Write docker-compose.yml for FastAPI + ChromaDB"
      ]
    }
  ]
}
```

---

### 2.6 Streaming RAG AI Career Assistant (`/api/v1/chat/message`)

#### **Endpoint**: `POST /api/v1/chat/message`
* **Description**: RAG-powered streaming chatbot providing interactive career guidance. Uses user profile + gap analysis context + ChromaDB knowledge base.
* **HTTP Method**: `POST`
* **Content-Type**: `application/json`
* **Target Requirement**: `FR-10`

**Request Payload Schema**:
```json
{
  "session_id": "sess_11223344",
  "analysis_id": "anl_555666777",
  "message": "How do I explain my partial experience in vector databases to the interviewer?"
}
```

**Response Payload Schema (Server-Sent Events / Stream or JSON)**:
```json
{
  "session_id": "sess_11223344",
  "response": "Frame your partial experience by highlighting your solid Python foundation and explaining how you have implemented ChromaDB vector search concepts in your Career Compass AI project...",
  "suggested_followups": [
    "Give me 3 sample interview bullet points for Docker.",
    "How do I rephrase my resume experience?"
  ]
}
```

---

## 3. Error Handling & HTTP Status Codes

| Status Code | Description | Example Cause |
| :--- | :--- | :--- |
| `200 OK` / `201 Created` | Success | Request executed successfully. |
| `400 Bad Request` | Invalid Input | Uploaded file format is not `.pdf`/`.docx` or exceeds 10MB. |
| `422 Unprocessable Entity` | Validation Error | Request JSON fails Pydantic schema validation. |
| `429 Too Many Requests` | Rate Limit Exceeded | Groq API rate limit exceeded (handled by backend retry handlers). |
| `500 Internal Server Error` | Server Failure | Unexpected backend error. |
