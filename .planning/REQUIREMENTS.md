# Requirements: msb-ecom

**Defined:** 2026-08-28
**Core Value:** Enable seamless, observable, and resilient end-to-end e-commerce operations across decoupled microservices with production-aligned containerization, service discovery, and orchestration.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Cluster Setup & Environment

- [ ] **CLUST-01**: Single-node `kind` cluster named `msb-ecom-local` provisioned with port mapping configuration and verified with `kubectl cluster-info` and `kubectl get nodes`.

### Containerization & Image Preparation

- [ ] **IMAGE-01**: Multi-stage Dockerfiles verified or created for all Spring Boot microservices and Angular frontend.
- [ ] **IMAGE-02**: All application container images built and loaded into the `kind` cluster via `kind load docker-image`.

### Core Configuration & Secrets

- [ ] **CONF-01**: Dedicated namespace `msb-ecom`, ConfigMaps (service URLs, DB hosts, Kafka brokers), and Secrets (DB passwords, Keycloak credentials) defined under `k8s/`.

### Stateful Backing Infrastructure

- [ ] **STATE-01**: PostgreSQL (Auth), MongoDB (Product), and MySQL (Order, Inventory, Payment) deployed with PersistentVolumeClaims and ClusterIP Services.
- [ ] **STATE-02**: Apache Kafka (KRaft mode or single broker) and Keycloak IAM deployed with PVCs and ClusterIP Services.

### Application Workloads & Health Probes

- [ ] **APP-01**: Deployments and ClusterIP Services created for backend services (Auth, Product, Order, Inventory, Payment, Notification) with resource `requests` and `limits`.
- [ ] **APP-02**: HTTP liveness and readiness probes configured for all Spring Boot services targeting `/actuator/health`.

### Edge Gateway & Frontend Routing

- [ ] **GATE-01**: API Gateway (port 9000) and Angular Frontend Deployments and external access Services (NodePort or Ingress) configured for host machine reachability.

### Deployment Automation & End-to-End Verification

- [ ] **ORCH-01**: Automated ordered deployment script (`k8s/deploy.sh`) and teardown script (`k8s/teardown.sh`) created.
- [ ] **VERIF-01**: End-to-end deployment verification validating pod readiness and running HTTP test requests through the API Gateway and frontend.

### Architecture Documentation & Interview Teach-Back

- [ ] **DOC-01**: Comprehensive `k8s/README.md` containing zero-to-running commands, manifest architecture explanation, Docker Compose vs. Kubernetes conceptual breakdown, and interview Q&A guide.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### GitOps & Tooling

- **GITOPS-01**: Helm chart packaging for all microservices.
- **GITOPS-02**: ArgoCD application synchronization and declarative GitOps pipeline.
- **OBSERV-01**: Prometheus metrics scraping and Grafana dashboard integration.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Helm charts | Prioritizing raw `kubectl` and YAML manifest fundamentals for interview defense |
| Multi-node cloud cluster (EKS/GKE) | Resource and scope constraints; single-node `kind` is ideal for local mastery |
| ArgoCD / FluxCD | Advanced GitOps tooling deferred to future infrastructure milestone |
| Distributed StatefulSet clustering | Simple Deployment + PVC is sufficient and defensible for local database dependencies |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLUST-01 | Phase 1 | Pending |
| IMAGE-01 | Phase 2 | Pending |
| IMAGE-02 | Phase 2 | Pending |
| CONF-01 | Phase 3 | Pending |
| STATE-01 | Phase 3 | Pending |
| STATE-02 | Phase 3 | Pending |
| APP-01 | Phase 4 | Pending |
| APP-02 | Phase 4 | Pending |
| GATE-01 | Phase 4 | Pending |
| ORCH-01 | Phase 5 | Pending |
| VERIF-01 | Phase 5 | Pending |
| DOC-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-28*
*Last updated: 2026-08-28 after initial definition*
