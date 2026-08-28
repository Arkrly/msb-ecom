# Roadmap: msb-ecom (Milestone v1.0 - Local Kubernetes Deployment)

## Overview

Containerize and deploy the complete 7-microservice `msb-ecom` architecture and backing infrastructure (PostgreSQL, MongoDB, MySQL, Kafka, Keycloak, Angular Frontend, Spring Cloud Gateway) onto a local `kind` Kubernetes cluster using raw manifests, health probes, resource limits, automated scripts, and an interview-ready architectural guide.

## Phases

- [ ] **Phase 1: Local Cluster Setup** - Provision and verify a single-node `kind` cluster with ingress port mappings
- [ ] **Phase 2: Containerization & Image Loading** - Verify/author multi-stage Dockerfiles and load images into `kind`
- [ ] **Phase 3: Config, Secrets & Stateful Infrastructure** - Deploy namespace, ConfigMaps, Secrets, databases, Kafka, and Keycloak with PVCs
- [ ] **Phase 4: Backend Services & Gateway Routing** - Deploy Spring Boot services with Actuator probes and expose Gateway and Frontend
- [ ] **Phase 5: Automated Orchestration, Verification & Teach-Back** - Author deployment scripts, run end-to-end smoke tests, and document interview teach-back

## Phase Details

### Phase 1: Local Cluster Setup
**Goal**: Establish a healthy, lightweight local Kubernetes cluster running on `kind` with configured host-to-container port forwards.
**Depends on**: Nothing (first phase)
**Requirements**: [CLUST-01]
**Success Criteria**:
  1. `kind` is confirmed available or installation instructions provided.
  2. Single-node cluster `msb-ecom-local` is provisioned with port mappings (9000 for Gateway, 4200/80 for Frontend).
  3. `kubectl cluster-info` and `kubectl get nodes` report the control-plane node as `Ready`.
**Plans**: TBD

### Phase 2: Containerization & Image Loading
**Goal**: Build optimized Docker images for all services and make them directly accessible to the `kind` cluster without a remote registry.
**Depends on**: Phase 1
**Requirements**: [IMAGE-01, IMAGE-02]
**Success Criteria**:
  1. Dockerfiles verified or created for all Spring Boot backend services (Auth, Product, Order, Inventory, Payment, Notification, Gateway) and Angular frontend.
  2. Multi-stage builds compile cleanly and produce lightweight runtime containers.
  3. All application images are loaded into the `msb-ecom-local` cluster via `kind load docker-image`.
**Plans**: TBD

### Phase 3: Config, Secrets & Stateful Infrastructure
**Goal**: Provision namespace, configuration, secrets, and backing stateful services with persistent storage.
**Depends on**: Phase 2
**Requirements**: [CONF-01, STATE-01, STATE-02]
**Success Criteria**:
  1. Namespace `msb-ecom`, shared ConfigMaps, and Secrets are applied cleanly.
  2. PostgreSQL, MongoDB, and MySQL Deployments initialize with PVCs and pass health checks.
  3. Apache Kafka broker and Keycloak IAM service reach `Running` state and are discoverable via ClusterIP Services.
**Plans**: TBD

### Phase 4: Backend Services & Gateway Routing
**Goal**: Deploy all application workloads with production-grade health probes and resource limits, and configure external access routes.
**Depends on**: Phase 3
**Requirements**: [APP-01, APP-02, GATE-01]
**Success Criteria**:
  1. All 6 backend microservices reach `Ready` status with Spring Actuator `/actuator/health` liveness and readiness probes passing.
  2. CPU and memory resource requests and limits prevent node memory exhaustion on a 15GB RAM host.
  3. API Gateway and Angular frontend are accessible from host localhost ports.
**Plans**: TBD

### Phase 5: Automated Orchestration, Verification & Teach-Back
**Goal**: Provide single-command deploy/teardown automation, verify live HTTP round-trips, and document the interview-ready teach-back guide.
**Depends on**: Phase 4
**Requirements**: [ORCH-01, VERIF-01, DOC-01]
**Success Criteria**:
  1. `k8s/deploy.sh` provisions the entire stack in dependency order; `k8s/teardown.sh` cleans up resources cleanly.
  2. HTTP requests through the API Gateway successfully round-trip to backend services.
  3. `k8s/README.md` documents exact zero-to-running commands, manifest deep-dive, Docker Compose vs K8s comparison, and interview Q&A talking points.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local Cluster Setup | 0/1 | Not started | - |
| 2. Containerization & Image Loading | 0/1 | Not started | - |
| 3. Config, Secrets & Stateful Infrastructure | 0/1 | Not started | - |
| 4. Backend Services & Gateway Routing | 0/1 | Not started | - |
| 5. Automated Orchestration, Verification & Teach-Back | 0/1 | Planned | - |
