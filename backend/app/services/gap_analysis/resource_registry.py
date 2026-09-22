"""
Verified Canonical Documentation and Learning Resource Registry
Maps technologies and technical skills to authoritative, permanently valid documentation URLs and friendly labels.
"""

from typing import Dict, List, Tuple, Optional
import re

# Comprehensive registry of verified official documentation
VERIFIED_DOCUMENTATION_REGISTRY: Dict[str, Tuple[str, str]] = {
    # System Architecture & Cloud
    "system design": ("https://github.com/donnemartin/system-design-primer", "System Design Primer"),
    "system architecture": ("https://github.com/donnemartin/system-design-primer", "System Design Primer"),
    "cloud infrastructure": ("https://aws.amazon.com/architecture/", "AWS Architecture Center"),
    "cloud optimization": ("https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html", "AWS Well-Architected Docs"),
    "aws": ("https://docs.aws.amazon.com/", "AWS Official Documentation"),
    "amazon web services": ("https://docs.aws.amazon.com/", "AWS Official Documentation"),
    "gcp": ("https://cloud.google.com/docs", "Google Cloud Documentation"),
    "google cloud": ("https://cloud.google.com/docs", "Google Cloud Documentation"),
    "azure": ("https://learn.microsoft.com/en-us/azure/", "Azure Architecture & Docs"),
    "microsoft azure": ("https://learn.microsoft.com/en-us/azure/", "Azure Architecture & Docs"),

    # Backend & Frameworks
    "fastapi": ("https://fastapi.tiangolo.com/", "FastAPI Official Documentation"),
    "python": ("https://docs.python.org/3/", "Python 3 Official Documentation"),
    "pydantic": ("https://docs.pydantic.dev/latest/", "Pydantic v2 Documentation"),
    "starlette": ("https://www.starlette.io/", "Starlette ASGI Documentation"),
    "django": ("https://docs.djangoproject.com/", "Django Official Documentation"),
    "flask": ("https://flask.palletsprojects.com/", "Flask Documentation"),
    "node": ("https://nodejs.org/en/docs", "Node.js Official Documentation"),
    "nodejs": ("https://nodejs.org/en/docs", "Node.js Official Documentation"),
    "express": ("https://expressjs.com/", "Express.js Documentation"),
    "java": ("https://docs.oracle.com/en/java/", "Java Official Documentation"),
    "spring boot": ("https://spring.io/projects/spring-boot", "Spring Boot Official Guides"),
    "spring": ("https://spring.io/guides", "Spring Framework Guides"),
    "go": ("https://go.dev/doc/", "Go Documentation"),
    "golang": ("https://go.dev/doc/", "Go Documentation"),
    "rust": ("https://doc.rust-lang.org/book/", "The Rust Programming Language"),

    # DevOps, Containers & Orchestration
    "docker": ("https://docs.docker.com/", "Docker Official Documentation"),
    "kubernetes": ("https://kubernetes.io/docs/", "Kubernetes Official Documentation"),
    "k8s": ("https://kubernetes.io/docs/", "Kubernetes Official Documentation"),
    "ci/cd": ("https://docs.github.com/en/actions", "GitHub Actions CI/CD Docs"),
    "github actions": ("https://docs.github.com/en/actions", "GitHub Actions CI/CD Docs"),
    "linux": ("https://linuxjourney.com/", "Linux Journey Guide"),
    "terraform": ("https://developer.hashicorp.com/terraform/docs", "Terraform Documentation"),
    "ansible": ("https://docs.ansible.com/", "Ansible Official Documentation"),
    "nginx": ("https://nginx.org/en/docs/", "NGINX Documentation"),

    # Caching & Event Streaming
    "redis": ("https://redis.io/docs/", "Redis Official Documentation"),
    "kafka": ("https://kafka.apache.org/documentation/", "Apache Kafka Documentation"),
    "apache kafka": ("https://kafka.apache.org/documentation/", "Apache Kafka Documentation"),
    "rabbitmq": ("https://www.rabbitmq.com/documentation.html", "RabbitMQ Documentation"),
    "celery": ("https://docs.celeryq.dev/en/stable/", "Celery Task Queue Documentation"),

    # Databases & Storage
    "sql": ("https://www.postgresql.org/docs/", "PostgreSQL Documentation"),
    "postgresql": ("https://www.postgresql.org/docs/", "PostgreSQL Documentation"),
    "postgres": ("https://www.postgresql.org/docs/", "PostgreSQL Documentation"),
    "mysql": ("https://dev.mysql.com/doc/", "MySQL Documentation"),
    "mongodb": ("https://www.mongodb.com/docs/", "MongoDB Official Manual"),
    "sqlite": ("https://www.sqlite.org/docs.html", "SQLite Documentation"),
    "sqlalchemy": ("https://docs.sqlalchemy.org/", "SQLAlchemy Documentation"),

    # AI, RAG & Vector Databases
    "rag": ("https://python.langchain.com/docs/concepts/rag/", "LangChain RAG Architecture"),
    "retrieval augmented generation": ("https://python.langchain.com/docs/concepts/rag/", "LangChain RAG Architecture"),
    "langchain": ("https://python.langchain.com/docs/", "LangChain Official Docs"),
    "llamaindex": ("https://docs.llamaindex.ai/", "LlamaIndex Documentation"),
    "chromadb": ("https://docs.trychroma.com/", "ChromaDB Documentation"),
    "chroma": ("https://docs.trychroma.com/", "ChromaDB Documentation"),
    "qdrant": ("https://qdrant.tech/documentation/", "Qdrant Vector DB Docs"),
    "pinecone": ("https://docs.pinecone.io/", "Pinecone Documentation"),
    "weaviate": ("https://weaviate.io/developers/weaviate", "Weaviate Documentation"),
    "pytorch": ("https://pytorch.org/docs/stable/index.html", "PyTorch Documentation"),
    "tensorflow": ("https://www.tensorflow.org/learn", "TensorFlow Documentation"),
    "huggingface": ("https://huggingface.co/docs", "Hugging Face Transformers Docs"),
    "openai": ("https://platform.openai.com/docs", "OpenAI API Documentation"),
    "gemini": ("https://ai.google.dev/docs", "Google Gemini API Documentation"),

    # Frontend & Web
    "react": ("https://react.dev/", "React Official Documentation"),
    "typescript": ("https://www.typescriptlang.org/docs/", "TypeScript Documentation"),
    "javascript": ("https://developer.mozilla.org/en-US/docs/Web/JavaScript", "MDN Web Docs (JavaScript)"),
    "next.js": ("https://nextjs.org/docs", "Next.js Official Documentation"),
    "nextjs": ("https://nextjs.org/docs", "Next.js Official Documentation"),
    "tailwind": ("https://tailwindcss.com/docs", "Tailwind CSS Documentation"),
    "graphql": ("https://graphql.org/learn/", "GraphQL Official Tutorials"),
    "rest": ("https://restfulapi.net/", "RESTful API Standards & Guide"),
    "rest api": ("https://restfulapi.net/", "RESTful API Standards & Guide"),

    # Testing & Engineering Hygiene
    "pytest": ("https://docs.pytest.org/en/stable/", "Pytest Official Documentation"),
    "unit testing": ("https://docs.pytest.org/en/stable/", "Pytest Official Documentation"),
    "git": ("https://git-scm.com/doc", "Pro Git Documentation"),
    "github": ("https://docs.github.com/", "GitHub Official Documentation"),
    "continuous learning": ("https://github.com/kamranahmedse/developer-roadmap", "Developer Roadmap Guides"),
}


def get_canonical_resource_for_skill(skill_name: str) -> Tuple[str, str]:
    """
    Finds the canonical verified documentation URL and label for a skill name.
    Falls back to official developer search or general roadmap if unknown.
    """
    if not skill_name:
        return ("https://devdocs.io/", "DevDocs Developer Documentation")

    clean = skill_name.strip().lower()
    # Direct match
    if clean in VERIFIED_DOCUMENTATION_REGISTRY:
        return VERIFIED_DOCUMENTATION_REGISTRY[clean]

    # Partial substring match
    for key, val in VERIFIED_DOCUMENTATION_REGISTRY.items():
        if key in clean or clean in key:
            return val

    # Token-based match
    tokens = re.findall(r"\b[a-zA-Z0-9+#.]+\b", clean)
    for token in tokens:
        if token in VERIFIED_DOCUMENTATION_REGISTRY:
            return VERIFIED_DOCUMENTATION_REGISTRY[token]

    # Fallback to DevDocs official technical documentation search
    slug = "+".join(tokens) if tokens else "programming"
    return (f"https://devdocs.io/#q={slug}", f"{skill_name} Official Documentation")


TRUSTED_DOCS_DOMAINS = {
    "fastapi.tiangolo.com",
    "docs.docker.com",
    "kubernetes.io",
    "redis.io",
    "kafka.apache.org",
    "docs.python.org",
    "postgresql.org",
    "mongodb.com",
    "dev.mysql.com",
    "sqlite.org",
    "sqlalchemy.org",
    "github.com",
    "aws.amazon.com",
    "docs.aws.amazon.com",
    "cloud.google.com",
    "learn.microsoft.com",
    "react.dev",
    "typescriptlang.org",
    "developer.mozilla.org",
    "nextjs.org",
    "nodejs.org",
    "spring.io",
    "docs.pytest.org",
    "docs.celeryq.dev",
    "rabbitmq.com",
    "python.langchain.com",
    "docs.llamaindex.ai",
    "docs.trychroma.com",
    "qdrant.tech",
    "pinecone.io",
    "weaviate.io",
    "pytorch.org",
    "tensorflow.org",
    "huggingface.co",
    "platform.openai.com",
    "ai.google.dev",
    "git-scm.com",
    "linuxjourney.com",
    "graphql.org",
    "restfulapi.net",
    "tailwindcss.com",
}


def validate_llm_resource_link(resource: str, focus_skill: str = "") -> Optional[str]:
    """
    Strict validation for LLM-provided links.
    If the link is from a trusted, recognized official domain, returns the sanitized URL.
    If the link is fake, broken, dummy (e.g. docs.reference.org), or unknown:
    Returns None so that no fake or unverified link is ever shown!
    """
    if not resource:
        return None

    # Strip markdown syntax: [Label](url) -> url
    md_match = re.search(r"\((https?://[^)]+)\)", resource)
    if md_match:
        resource = md_match.group(1).strip()
    else:
        resource = resource.strip()

    if not (resource.startswith("http://") or resource.startswith("https://")):
        clean_name = resource.strip().lower()
        if clean_name in VERIFIED_DOCUMENTATION_REGISTRY:
            return VERIFIED_DOCUMENTATION_REGISTRY[clean_name][0]
        return None

    try:
        from urllib.parse import urlparse
        parsed = urlparse(resource)
        host = parsed.netloc.lower().replace("www.", "")

        # Check dead/placeholder domains explicitly
        if any(d in host for d in ["reference.org", "example.com", "placeholder.com", "example.org"]):
            return None

        # Check if host matches or ends with any of our trusted domains
        for trusted in TRUSTED_DOCS_DOMAINS:
            if host == trusted or host.endswith("." + trusted):
                return resource

        # If domain is not recognized as verified official documentation, do NOT use it
        return None
    except Exception:
        return None


def sanitize_resource_link(resource: str, focus_skill: str) -> Optional[str]:
    """
    Cleans an LLM resource link. If invalid or fake, returns None (no fake links allowed).
    """
    return validate_llm_resource_link(resource, focus_skill)


