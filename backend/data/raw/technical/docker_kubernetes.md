---
skill: docker_kubernetes
category: devops_and_cloud
difficulty: intermediate-to-advanced
content_type: technical_knowledge
interview_relevance: high
---

# Docker, Containerization & Kubernetes

## Overview

Docker packages software into isolated, portable containers sharing the host OS kernel. Kubernetes (K8s) is the industry standard container orchestration engine for automated deployment, scaling, service discovery, and management of containerized workloads.

## Containers vs Virtual Machines

- **Virtual Machines**: Each VM runs a full guest operating system on top of a hypervisor. High memory overhead, minutes to boot.
- **Containers**: Share the host OS kernel and use Linux `namespaces` (for process, mount, network isolation) and `cgroups` (for resource limiting: CPU, RAM). Megabytes of overhead, sub-second boot times.

## Docker Core Concepts & Interview Areas

- Multi-Stage Builds (separating build tools from minimal production runtime image)
- Layer Caching & Cache Invalidation Order (copying dependencies before code)
- Rootless Containers & Non-root user security (`USER nonroot`)
- Image Minimization: Alpine vs Distroless vs Debian Slim
- Docker Networking: Bridge, Host, Overlay, None
- Docker Volumes vs Bind Mounts (data persistence vs local development syncing)

## Kubernetes Core Concepts & Primitives

- **Pod**: Smallest deployable unit in K8s (can run 1 or more co-located containers sharing localhost & volumes).
- **Deployment**: Declarative controller managing ReplicaSets, rolling updates, and rollbacks.
- **Service**: Stable networking abstraction exposing Pods:
  - _ClusterIP_: Internal only (default).
  - _NodePort_: Exposes a port on each cluster node.
  - _LoadBalancer_: Provisions a cloud provider load balancer (e.g. AWS ALB, GCP Load Balancer).
- **Ingress**: HTTP/HTTPS routing controller managing SSL termination and path-based host routing.
- **ConfigMap & Secret**: Decoupling configuration and credentials from container images.
- **Probes**:
  - _Startup Probe_: Verifies slow-starting applications have initialized.
  - _Liveness Probe_: Restarts the container if deadlocked.
  - _Readiness Probe_: Directs traffic to the Pod only when ready to accept connections.

## Scenario Questions

- How do you reduce a 2GB Python Docker image to under 150MB?
- What happens if a Pod's liveness probe fails versus readiness probe failure?
- How do you implement zero-downtime rolling deployments in Kubernetes?
- Explain how `cgroups` enforce CPU throttling on high-load containers.

## Verified Official Learning Links

- Docker Documentation: https://docs.docker.com/
- Dockerfile Best Practices: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
- Kubernetes Official Documentation: https://kubernetes.io/docs/
- Kubernetes Interactive Katacoda / Killercoda Labs: https://killercoda.com/playgrounds/scenario/kubernetes
