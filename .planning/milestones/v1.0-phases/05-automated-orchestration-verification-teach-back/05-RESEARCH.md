# Research: Phase 5 — Automated Orchestration, Verification & Teach-Back

**Phase:** 5
**Date:** 2026-08-28
**Researcher:** Buffy (inline)

## Objective

Research how to implement Phase 5: Automated Orchestration, Verification & Teach-Back.
Answer: "What do I need to know to PLAN this phase well?"

## Current State Analysis

### Existing Kubernetes Manifests (Phases 1-4)

All 7 manifest files are authored and ready under `k8s/`:

| File | Contents | Tier |
|------|----------|------|
| `k8s/kind-cluster-config.yaml` | kind cluster configuration (port mappings 9000, 4200, 80) | cluster |
| `k8s/00-namespace.yaml` | Namespace `msb-ecom` | config |
| `k8s/01-configmaps-secrets.yaml` | ConfigMap `app-config` + Secret `app-secrets` | config |
| `k8s/02-databases.yaml` | MongoDB, MySQL, PostgreSQL (Auth + Keycloak) with PVCs | database |
| `k8s/03-infrastructure.yaml` | Zookeeper, Kafka, Keycloak, Mailpit | infrastructure |
| `k8s/04-backend-services.yaml` | 6 Spring Boot microservices with Actuator probes | backend |
| `k8s/05-gateway-frontend.yaml` | API Gateway (NodePort 30000) + Angular Frontend (NodePort 30080/30420) | gateway |

### Deployment Dependency Chain

The manifests must be applied in strict order due to resource dependencies:

```
00-namespace.yaml          ← must exist first (all resources live here)
  ↓
01-configmaps-secrets.yaml ← referenced by all downstream Deployments
  ↓
02-databases.yaml          ← PVCs + DB Deployments (MongoDB, MySQL, Postgres)
  ↓
03-infrastructure.yaml     ← Zookeeper → Kafka, Keycloak (needs postgres-keycloak)
  ↓
04-backend-services.yaml   ← all 6 Spring Boot services (need databases + config)
  ↓
05-gateway-frontend.yaml   ← API Gateway + Frontend (need backend services)
```

### Port Mapping Summary

| Service | NodePort | Host Port | Purpose |
|---------|----------|-----------|---------|
| API Gateway | 30000 | 9000 | Backend API routing |
| Frontend | 30080 | 80 | HTTP access |
| Frontend | 30420 | 4200 | Angular dev server |

### Health Check Endpoints

- Backend services: `/actuator/health` (Spring Actuator)
- Frontend: `/` (Nginx root)
- Gateway: `/actuator/health` (Spring Actuator)

## Research Findings

### 1. Deployment Script Design (ORCH-01)

**Key decisions:**
- `k8s/deploy.sh` must apply manifests in numeric order (00 → 05)
- Must wait for each tier to be Ready before proceeding to the next
- Should use `kubectl wait --for=condition=Available` for Deployments
- Should use `kubectl wait --for=condition=Ready` for pods
- Idempotent: safe to run multiple times (kubectl apply is idempotent)

**Implementation pattern:**
```bash
#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="msb-ecom"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Phase 5: Deploying msb-ecom stack ==="

# Step 1: Namespace
kubectl apply -f "$SCRIPT_DIR/00-namespace.yaml"

# Step 2: Config & Secrets
kubectl apply -f "$SCRIPT_DIR/01-configmaps-secrets.yaml"

# Step 3: Databases (wait for Ready)
kubectl apply -f "$SCRIPT_DIR/02-databases.yaml"
kubectl wait --for=condition=Available deployment/mongo -n $NAMESPACE --timeout=120s
kubectl wait --for=condition=Available deployment/mysql -n $NAMESPACE --timeout=120s
kubectl wait --for=condition=Available deployment/postgres-auth -n $NAMESPACE --timeout=120s
kubectl wait --for=condition=Available deployment/postgres-keycloak -n $NAMESPACE --timeout=120s

# Step 4: Infrastructure (wait for Ready)
kubectl apply -f "$SCRIPT_DIR/03-infrastructure.yaml"
kubectl wait --for=condition=Available deployment/zookeeper -n $NAMESPACE --timeout=120s
kubectl wait --for=condition=Available deployment/broker -n $NAMESPACE --timeout=120s
kubectl wait --for=condition=Available deployment/keycloak -n $NAMESPACE --timeout=180s
kubectl wait --for=condition=Available deployment/mailpit -n $NAMESPACE --timeout=60s

# Step 5: Backend services (wait for Ready)
kubectl apply -f "$SCRIPT_DIR/04-backend-services.yaml"
for svc in auth-service product-service order-service inventory-service payment-service notification-service; do
  kubectl wait --for=condition=Available deployment/$svc -n $NAMESPACE --timeout=180s
done

# Step 6: Gateway & Frontend (wait for Ready)
kubectl apply -f "$SCRIPT_DIR/05-gateway-frontend.yaml"
kubectl wait --for=condition=Available deployment/api-gateway -n $NAMESPACE --timeout=180s
kubectl wait --for=condition=Available deployment/frontend -n $NAMESPACE --timeout=120s

echo "=== Deployment complete ==="
kubectl get pods,svc -n $NAMESPACE
```

**Teardown script pattern:**
```bash
#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="msb-ecom"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Tearing down msb-ecom stack ==="

# Reverse order: gateway/frontend → backend → infrastructure → databases → config → namespace
kubectl delete -f "$SCRIPT_DIR/05-gateway-frontend.yaml" --ignore-not-found
kubectl delete -f "$SCRIPT_DIR/04-backend-services.yaml" --ignore-not-found
kubectl delete -f "$SCRIPT_DIR/03-infrastructure.yaml" --ignore-not-found
kubectl delete -f "$SCRIPT_DIR/02-databases.yaml" --ignore-not-found
kubectl delete -f "$SCRIPT_DIR/01-configmaps-secrets.yaml" --ignore-not-found
kubectl delete -f "$SCRIPT_DIR/00-namespace.yaml" --ignore-not-found

echo "=== Teardown complete ==="
```

### 2. End-to-End Verification (VERIF-01)

**Verification checklist:**
1. All pods in `msb-ecom` namespace are Running and Ready
2. HTTP GET `http://localhost:9000/actuator/health` returns 200
3. HTTP GET `http://localhost:4200/` returns 200 (or 301 redirect)
4. HTTP GET `http://localhost:80/` returns 200

**Implementation approach:**
- A `k8s/verify.sh` script that runs after deploy.sh
- Uses `kubectl get pods` to check all pods are Running (1/1)
- Uses `curl` to verify HTTP endpoints through the API Gateway
- Reports pass/fail with colored output

### 3. Documentation (DOC-01)

**README.md structure:**
1. **Zero-to-Running** — exact commands to go from fresh clone to running stack
2. **Architecture Overview** — what each manifest does, the dependency chain
3. **Manifest Deep-Dive** — explained attributes (probes, limits, selectors, labels)
4. **Docker Compose vs Kubernetes** — conceptual comparison (interview-ready)
5. **Interview Q&A** — common questions and model answers

## Technical Considerations

### Resource Constraints
- Target machine: Intel i5-1135G7, 15GB RAM
- All resource limits already defined in manifests (Phases 3-4)
- Total estimated footprint: ~8-10GB aggregate

### kind Cluster Requirements
- Cluster name: `msb-ecom-local`
- Port mappings: 9000 (Gateway), 4200/80 (Frontend)
- Images must be pre-loaded via `kind load docker-image`

### Interview Readiness
- Every manifest attribute (probes, limits, selectors, labels) must be explainable
- Docker Compose vs K8s comparison should cover: orchestration model, service discovery, health checks, scaling, networking, configuration management
- Q&A should cover: Why K8s over Docker Compose? What are probes? What are resource limits? How does service discovery work?

## Validation Architecture

### Dimension 1: Functional Correctness
- deploy.sh provisions the entire stack in dependency order
- teardown.sh cleans up all resources

### Dimension 2: Integration
- HTTP requests through API Gateway round-trip to backend services
- Frontend is accessible from host browser

### Dimension 3: Operational Readiness
- All pods reach Running and Ready state
- Scripts are idempotent (safe to re-run)

### Dimension 4: Documentation
- README.md covers all required sections
- Interview Q&A addresses common questions

## RESEARCH COMPLETE
