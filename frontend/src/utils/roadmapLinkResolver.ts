/**
 * Verified Documentation & Technical Resource Link Resolver
 * 
 * Automatically resolves, normalizes, and sanitizes documentation resource links
 * across Learning Roadmaps. Intercepts dead/placeholder domains (such as docs.reference.org)
 * and maps them to authoritative, verified official documentation URLs with clean human-readable labels.
 */

export interface ResolvedResource {
  url: string;
  label: string;
  isOfficial: boolean;
}

// Canonical registry of authoritative technical documentation
const VERIFIED_DOCS_REGISTRY: Record<string, { url: string; label: string }> = {
  'system design': {
    url: 'https://github.com/donnemartin/system-design-primer',
    label: 'System Design Primer',
  },
  'system architecture': {
    url: 'https://github.com/donnemartin/system-design-primer',
    label: 'System Design Primer',
  },
  'cloud infrastructure': {
    url: 'https://aws.amazon.com/architecture/',
    label: 'AWS Architecture Center',
  },
  'cloud optimization': {
    url: 'https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html',
    label: 'AWS Well-Architected Docs',
  },
  aws: {
    url: 'https://docs.aws.amazon.com/',
    label: 'AWS Official Documentation',
  },
  'amazon web services': {
    url: 'https://docs.aws.amazon.com/',
    label: 'AWS Official Documentation',
  },
  gcp: {
    url: 'https://cloud.google.com/docs',
    label: 'Google Cloud Documentation',
  },
  'google cloud': {
    url: 'https://cloud.google.com/docs',
    label: 'Google Cloud Documentation',
  },
  azure: {
    url: 'https://learn.microsoft.com/en-us/azure/',
    label: 'Azure Architecture & Docs',
  },
  'microsoft azure': {
    url: 'https://learn.microsoft.com/en-us/azure/',
    label: 'Azure Architecture & Docs',
  },
  fastapi: {
    url: 'https://fastapi.tiangolo.com/',
    label: 'FastAPI Official Docs',
  },
  python: {
    url: 'https://docs.python.org/3/',
    label: 'Python 3 Documentation',
  },
  pydantic: {
    url: 'https://docs.pydantic.dev/latest/',
    label: 'Pydantic v2 Docs',
  },
  starlette: {
    url: 'https://www.starlette.io/',
    label: 'Starlette ASGI Docs',
  },
  docker: {
    url: 'https://docs.docker.com/',
    label: 'Docker Documentation',
  },
  kubernetes: {
    url: 'https://kubernetes.io/docs/',
    label: 'Kubernetes Documentation',
  },
  k8s: {
    url: 'https://kubernetes.io/docs/',
    label: 'Kubernetes Documentation',
  },
  redis: {
    url: 'https://redis.io/docs/',
    label: 'Redis Official Docs',
  },
  kafka: {
    url: 'https://kafka.apache.org/documentation/',
    label: 'Apache Kafka Docs',
  },
  'apache kafka': {
    url: 'https://kafka.apache.org/documentation/',
    label: 'Apache Kafka Docs',
  },
  rabbitmq: {
    url: 'https://www.rabbitmq.com/documentation.html',
    label: 'RabbitMQ Documentation',
  },
  celery: {
    url: 'https://docs.celeryq.dev/en/stable/',
    label: 'Celery Task Queue Docs',
  },
  postgresql: {
    url: 'https://www.postgresql.org/docs/',
    label: 'PostgreSQL Docs',
  },
  postgres: {
    url: 'https://www.postgresql.org/docs/',
    label: 'PostgreSQL Docs',
  },
  sql: {
    url: 'https://www.postgresql.org/docs/',
    label: 'SQL & Database Docs',
  },
  mysql: {
    url: 'https://dev.mysql.com/doc/',
    label: 'MySQL Documentation',
  },
  mongodb: {
    url: 'https://www.mongodb.com/docs/',
    label: 'MongoDB Official Manual',
  },
  sqlite: {
    url: 'https://www.sqlite.org/docs.html',
    label: 'SQLite Documentation',
  },
  rag: {
    url: 'https://python.langchain.com/docs/concepts/rag/',
    label: 'LangChain RAG Architecture',
  },
  langchain: {
    url: 'https://python.langchain.com/docs/',
    label: 'LangChain Docs',
  },
  llamaindex: {
    url: 'https://docs.llamaindex.ai/',
    label: 'LlamaIndex Documentation',
  },
  chromadb: {
    url: 'https://docs.trychroma.com/',
    label: 'ChromaDB Docs',
  },
  chroma: {
    url: 'https://docs.trychroma.com/',
    label: 'ChromaDB Docs',
  },
  qdrant: {
    url: 'https://qdrant.tech/documentation/',
    label: 'Qdrant Vector DB Docs',
  },
  pinecone: {
    url: 'https://docs.pinecone.io/',
    label: 'Pinecone Docs',
  },
  weaviate: {
    url: 'https://weaviate.io/developers/weaviate',
    label: 'Weaviate Documentation',
  },
  pytorch: {
    url: 'https://pytorch.org/docs/stable/index.html',
    label: 'PyTorch Documentation',
  },
  tensorflow: {
    url: 'https://www.tensorflow.org/learn',
    label: 'TensorFlow Docs',
  },
  react: {
    url: 'https://react.dev/',
    label: 'React Official Docs',
  },
  typescript: {
    url: 'https://www.typescriptlang.org/docs/',
    label: 'TypeScript Docs',
  },
  javascript: {
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    label: 'MDN JavaScript Docs',
  },
  'next.js': {
    url: 'https://nextjs.org/docs',
    label: 'Next.js Documentation',
  },
  nextjs: {
    url: 'https://nextjs.org/docs',
    label: 'Next.js Documentation',
  },
  nodejs: {
    url: 'https://nodejs.org/en/docs',
    label: 'Node.js Documentation',
  },
  node: {
    url: 'https://nodejs.org/en/docs',
    label: 'Node.js Documentation',
  },
  git: {
    url: 'https://git-scm.com/doc',
    label: 'Git Official Manual',
  },
  github: {
    url: 'https://docs.github.com/',
    label: 'GitHub Documentation',
  },
  'ci/cd': {
    url: 'https://docs.github.com/en/actions',
    label: 'GitHub Actions CI/CD',
  },
  linux: {
    url: 'https://linuxjourney.com/',
    label: 'Linux Journey Guide',
  },
  pytest: {
    url: 'https://docs.pytest.org/en/stable/',
    label: 'Pytest Documentation',
  },
};

// Known official domain patterns to pretty-label
const DOMAIN_PRETTY_NAMES: Record<string, string> = {
  'github.com': 'GitHub Repository & Guide',
  'fastapi.tiangolo.com': 'FastAPI Official Docs',
  'docs.docker.com': 'Docker Documentation',
  'kubernetes.io': 'Kubernetes Docs',
  'redis.io': 'Redis Official Docs',
  'kafka.apache.org': 'Apache Kafka Docs',
  'docs.python.org': 'Python 3 Documentation',
  'react.dev': 'React Official Docs',
  'typescriptlang.org': 'TypeScript Documentation',
  'developer.mozilla.org': 'MDN Web Docs',
  'aws.amazon.com': 'AWS Documentation',
  'cloud.google.com': 'Google Cloud Docs',
  'learn.microsoft.com': 'Microsoft Learn',
  'postgresql.org': 'PostgreSQL Docs',
  'devdocs.io': 'DevDocs Developer Docs',
};

/**
 * Resolves any roadmap resource into a verified, permanently valid link and user-friendly label.
 * Returns null if the link is fake, dead, or unverified (never use fake/placeholder links).
 */
export function resolveRoadmapResource(
  rawResource: string,
  focusSkill?: string
): ResolvedResource | null {
  if (!rawResource) return null;

  let text = (rawResource || '').trim();

  // 1. Extract markdown links: [Title](url) -> url + title
  let explicitLabel = '';
  const mdMatch = text.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
  if (mdMatch) {
    explicitLabel = mdMatch[1].trim();
    text = mdMatch[2].trim();
  }

  // 2. Detect dead/placeholder domains (e.g. docs.reference.org, example.com) -> Drop immediately
  const isDeadDomain =
    text.includes('docs.reference.org') ||
    text.includes('reference.org') ||
    text.includes('example.com') ||
    text.includes('placeholder.com');

  if (isDeadDomain) {
    return null;
  }

  // 3. If it's a valid HTTP URL
  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      const parsed = new URL(text);
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

      // Check if domain matches any known official/trusted documentation provider
      const isTrusted =
        Object.keys(DOMAIN_PRETTY_NAMES).some((d) => host === d || host.endsWith('.' + d)) ||
        Object.values(VERIFIED_DOCS_REGISTRY).some((r) => {
          try {
            return new URL(r.url).hostname.replace(/^www\./, '').toLowerCase() === host;
          } catch {
            return false;
          }
        });

      if (!isTrusted) {
        // Unknown or hallucinated link from LLM -> discard rather than giving user a broken link
        return null;
      }

      let label = explicitLabel;
      if (!label) {
        label = DOMAIN_PRETTY_NAMES[host] || `${host} Docs`;
        if (focusSkill && !label.toLowerCase().includes(focusSkill.toLowerCase())) {
          label = `${focusSkill} (${host})`;
        }
      }

      return {
        url: text,
        label,
        isOfficial: true,
      };
    } catch {
      return null;
    }
  }

  // 4. If it's a plain skill/topic name instead of a URL, check if it directly matches a verified skill
  const canonical = findCanonicalDoc(text) || findCanonicalDoc(focusSkill || '');
  if (canonical) {
    return {
      url: canonical.url,
      label: explicitLabel || canonical.label,
      isOfficial: true,
    };
  }

  // 5. If unverified, return null (leave it empty)
  return null;
}

/**
 * Looks up skill string in canonical registry.
 */
function findCanonicalDoc(skillName: string): { url: string; label: string } | null {
  if (!skillName) return null;
  const clean = skillName.trim().toLowerCase().replace(/^mastering\s+/i, '');

  if (VERIFIED_DOCS_REGISTRY[clean]) {
    return VERIFIED_DOCS_REGISTRY[clean];
  }

  // Check substring matches
  for (const [key, val] of Object.entries(VERIFIED_DOCS_REGISTRY)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val;
    }
  }

  return null;
}

/**
 * Self-heals existing roadmaps in localStorage: drops dead reference.org / fake links,
 * keeping only verified, working documentation URLs (empty if none valid).
 */
export function sanitizeTrackedRoadmaps<T extends { roadmap_data?: { weekly_milestones?: any[] } }>(
  roadmaps: T[]
): T[] {
  if (!Array.isArray(roadmaps)) return [];

  return roadmaps.map((item) => {
    if (!item?.roadmap_data?.weekly_milestones) return item;

    const updatedMilestones = item.roadmap_data.weekly_milestones.map((m: any) => {
      const rawResources = Array.isArray(m.resources) ? m.resources : [];
      const focusSkill = m.focus_skill || '';

      const cleanedResources = rawResources
        .map((res: string) => resolveRoadmapResource(res, focusSkill)?.url)
        .filter((url: string | undefined): url is string => Boolean(url));

      return {
        ...m,
        resources: cleanedResources,
      };
    });

    return {
      ...item,
      roadmap_data: {
        ...item.roadmap_data,
        weekly_milestones: updatedMilestones,
      },
    };
  });
}

