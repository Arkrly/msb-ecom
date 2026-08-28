# msb-ecom

## What This Is

`msb-ecom` is a full-stack microservices e-commerce application consisting of Java 21 / Spring Boot 3.4.2 backend services, an Angular 20 frontend, Spring Cloud API Gateway, Keycloak OAuth2/OIDC authentication, Kafka asynchronous event messaging, and multiple persistence engines (PostgreSQL, MySQL, MongoDB).

## Core Value

Enable seamless, observable, and resilient end-to-end e-commerce operations across decoupled microservices with production-aligned containerization, service discovery, and orchestration.

## Current Milestone: v1.0 Local Kubernetes Deployment

**Goal:** Containerize all services, author production-pattern raw Kubernetes manifests, and deploy the entire multi-service e-commerce ecosystem onto a local `kind` cluster with end-to-end traffic verification and interview-ready architectural documentation.

**Target features:**
- Single-node `kind` cluster configuration (`msb-ecom-local`) optimized for local laptop resources
- Complete containerization pass with multi-stage Dockerfiles and image loading into `kind`
- Structured Kubernetes manifests under `k8s/` (Namespace, Deployments, Services, ConfigMaps, Secrets, resource requests/limits, Actuator health probes)
- Stateful backing infrastructure management with PersistentVolumeClaims
- Sequential orchestration script (`k8s/deploy.sh` & `k8s/teardown.sh`) and live traffic verification
- Comprehensive teach-back documentation and Docker Compose vs. Kubernetes comparative interview guide

## Requirements

### Validated

- ✓ 7 Core Spring Boot 3.4.2 microservices & Angular 20 frontend built and tested
- ✓ Multi-database persistence (PostgreSQL, MySQL, MongoDB)
- ✓ Keycloak OAuth2/OIDC integration and Kafka event-driven notifications
- ✓ Docker Compose orchestration (`docker-compose.yml`, `docker-compose.prod.yml`, `run.sh`)

### Active

- [ ] K8S-01: Single-node `kind` local cluster (`msb-ecom-local`) configured and verified
- [ ] K8S-02: Multi-stage Dockerfiles verified/created for all services and loaded into `kind`
- [ ] K8S-03: Base namespace, ConfigMaps, and Secrets manifests defined under `k8s/`
- [ ] K8S-04: Stateful backing services (PostgreSQL, MySQL, MongoDB, Kafka, Keycloak) deployed with PVCs and ClusterIP Services
- [ ] K8S-05: Backend application microservices Deployments & Services configured with Actuator liveness/readiness probes and resource requests/limits
- [ ] K8S-06: API Gateway & Angular Frontend manifests configured with NodePort / Ingress external routing
- [ ] K8S-07: Automated deployment script (`deploy.sh`), teardown script (`teardown.sh`), and end-to-end HTTP verification
- [ ] K8S-08: Architecture & interview teach-back guide documented in `k8s/README.md`

### Out of Scope

- Helm chart templating — keep to raw `kubectl` YAML fundamentals for conceptual mastery
- GitOps / ArgoCD / FluxCD automation — deferred to future infrastructure milestone
- Production multi-node managed cloud deployment (EKS/GKE/AKS) — focused strictly on local `kind` cluster
- Complex multi-replica distributed statefulsets / operators — simple Deployment + PVC is sufficient for local demonstration

## Context

- Target Developer Machine: Intel i5-1135G7 (4 cores / 8 threads), 15 GB RAM, Linux OS
- Backend Stack: Java 21, Spring Boot 3.4.2, Spring Cloud Gateway, Spring Security (OAuth2 Resource Server), Resilience4j
- Databases & Middleware: PostgreSQL (Auth), MongoDB (Product), MySQL (Order, Inventory, Payment), Apache Kafka (Notification), Keycloak (IAM)
- Frontend: Angular 20, Nginx runtime
- Goal timeline: Ready for DevOps Engineer interview on Aug 31, 2026

## Constraints

- **Hardware**: Must stay within ~10-12GB aggregate memory footprint during local cluster execution
- **Tooling**: Pure Kubernetes manifests (`kubectl`), no Helm or third-party orchestrators
- **Comprehension**: Every manifest attribute (probes, limits, selectors, labels) must be explainable in an interview

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use `kind` instead of Minikube | `kind` runs nodes as Docker containers, is lightweight and fast for local multi-image workflows | ✓ Good |
| Raw YAML manifests over Helm | Maximizes understanding of core Kubernetes primitives for the upcoming interview | ✓ Good |
| Spring Actuator probes | Native HTTP probes on `/actuator/health` demonstrate robust Kubernetes health-checking vs basic TCP | ✓ Good |
| Simple Deployment + PVC for DBs | Avoids StatefulSet complexity while preserving local data persistence during restarts | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-28 after milestone v1.0 initialization*
