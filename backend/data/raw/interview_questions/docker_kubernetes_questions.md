---
skill: docker_kubernetes
category: devops_and_cloud
difficulty: beginner-to-advanced
content_type: interview_question
interview_relevance: high
---

# Docker & Kubernetes Interview Questions & Senior Model Answers

## Beginner Tier

### Q1 — Containers vs. Virtual Machines

**Difficulty:** Beginner  
**Topic:** Core Virtualization Primitives

#### Ideal Answer:

- **Virtual Machines (Hypervisor-Based):** Virtualizes hardware. Each VM runs a dedicated full guest operating system (kernel, userland, system daemons). Overhead is high (gigabytes of disk/RAM), and startup takes minutes.
- **Containers (OS-Level Virtualization):** Share the host OS kernel. Isolation is achieved via two Linux kernel primitives:
  1. **Namespaces:** Isolates what a process can _see_ (PID for processes, NET for networking, MNT for filesystems, IPC for shared memory, UTS for hostnames).
  2. **Control Groups (cgroups):** Enforces limits on what a process can _use_ (CPU, RAM, block I/O, network bandwidth).
- Overhead is negligible (sub-second boot times, megabytes of RAM).

---

### Q2 — Docker Multi-Stage Builds & Image Optimization

**Difficulty:** Beginner to Intermediate  
**Topic:** Dockerfile Best Practices

#### Ideal Answer:

- **Problem:** Compiling applications (like Go, Rust, TypeScript, or C-extensions for Python) requires heavy compilers, package managers, and header files that inflate the final production image (often $>1.5\text{GB}$) and introduce security attack vectors.
- **Multi-Stage Solution:** Uses multiple `FROM` instructions in a single Dockerfile. Early stages build the binaries, and a clean minimal final stage copies only the compiled output into a lean production runtime (e.g., Alpine, Debian-Slim, or Google Distroless):

  ```dockerfile
  # Stage 1: Build stage
  FROM python:3.11-slim AS builder
  WORKDIR /build
  COPY requirements.txt .
  RUN pip install --no-cache-dir --user -r requirements.txt

  # Stage 2: Minimal production image
  FROM gcr.io/distroless/python3-debian12
  WORKDIR /app
  COPY --from=builder /root/.local /root/.local
  COPY . .
  USER nonroot
  CMD ["main.py"]
  ```

---

## Intermediate Tier

### Q3 — Kubernetes Probes: Startup, Liveness, and Readiness

**Difficulty:** Intermediate  
**Topic:** Container Lifecycle & Traffic Management

#### Ideal Answer:

- **1. Startup Probe:** Determines if a slow application has fully initialized (e.g. loading a 5GB ML model or running DB migrations). While active, liveness and readiness checks are disabled. If it fails, the container is restarted.
- **2. Liveness Probe:** Checks if the application is healthy and alive. If a container enters a deadlock or unrecoverable loop, the liveness probe fails, and the kubelet **kills and restarts the container** according to the `restartPolicy`.
- **3. Readiness Probe:** Checks if the container is ready to accept incoming user network traffic. If it fails (e.g., during a temporary database connection spike), the Pod is **NOT restarted**; instead, its IP is immediately **removed from the Service endpoints**, preventing users from receiving HTTP 500/503 errors.

#### Follow-Up Questions:

- _"What is the danger of using the same endpoint for both Liveness and Readiness?"_  
  $\rightarrow$ If your database is temporarily overloaded and causes health checks to fail, a liveness probe will restart all pods simultaneously, causing a cascading outage! A readiness probe should remove pods from traffic without restarting them.

---

### Q4 — Kubernetes Services: ClusterIP vs. NodePort vs. LoadBalancer vs. Ingress

**Difficulty:** Intermediate  
**Topic:** Cluster Networking & Ingress Architecture

#### Ideal Answer:

- **ClusterIP (Default):** Exposes the Service on an internal cluster-only IP. Accessible only from within the Kubernetes cluster (used for internal microservice-to-microservice communication).
- **NodePort:** Exposes the Service on a static high port (range 30000–32767) across every worker node's external IP (`<NodeIP>:<NodePort>`).
- **LoadBalancer:** Requests a cloud provider load balancer (e.g. AWS Network Load Balancer, GCP Cloud LB) and routes traffic directly to the Pods. Costly if used for every microservice.
- **Ingress Controller:** A single layer-7 reverse proxy (e.g. NGINX Ingress, Traefik, AWS ALB Controller) that routes HTTP/HTTPS requests to internal ClusterIP Services based on domain hosts (`api.domain.com`) and URL path prefixes (`/v1/auth`, `/v1/chat`).

---

## Advanced Tier

### Q5 — Troubleshooting `OOMKilled` (Exit Code 137) vs. CPU Throttling

**Difficulty:** Advanced  
**Topic:** Resource Limits & Production Observability

#### Ideal Answer:

- **`OOMKilled` (Memory Violation - Exit Code 137):**
  - Occurs when a container exceeds its defined `resources.limits.memory`.
  - Memory is a **non-compressible resource**. The Linux kernel OOM killer immediately sends `SIGKILL` (signal 9, exit code $128 + 9 = 137$) to the offending process.
  - _Fix:_ Profile memory usage with heap dumps, check for unclosed database connections/memory leaks, and raise memory limits with adequate headroom.
- **CPU Throttling (Compressible Resource):**
  - When a container exceeds `resources.limits.cpu`, it is **NEVER killed**.
  - Instead, the Linux Completely Fair Scheduler (CFS) throttles the container by depriving it of CPU time slices, causing response latency to spike dramatically.
  - _Production Best Practice:_ Many high-performance architectures omit CPU limits and use only CPU requests to avoid unnecessary CFS throttling while preventing node resource starvation.
