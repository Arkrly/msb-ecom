# msb-ecom — Kubernetes Deployment Guide

> Complete guide for deploying the msb-ecom microservices stack onto a local `kind` Kubernetes cluster.

## Quick Start (Zero-to-Running)

### Prerequisites

- **Docker** — running and accessible without `sudo`
- **kind** — [kubernetes.io/docs/tasks/tools/install-kind/](https://kubernetes.io/docs/tasks/tools/install-kind/)
- **kubectl** — [kubernetes.io/docs/tasks/tools/](https://kubernetes.io/docs/tasks/tools/)

### Step 1: Create the Cluster

```bash
kind create cluster --config k8s/kind-cluster-config.yaml --name msb-ecom-local
```

This creates a single-node cluster with port mappings:
- **9000** → API Gateway (NodePort 30000)
- **4200** → Angular Frontend (NodePort 30420)
- **80** → Frontend HTTP (NodePort 30080)

### Step 2: Load Application Images

Build your images locally first, then load them into the cluster:

```bash
# Build images (from project root)
./run.sh  # or: docker-compose build

# Load each image into kind
for svc in auth-service product-service order-service inventory-service \
           payment-service notification-service api-gateway frontend; do
  kind load docker-image "msb-ecom/${svc}:local" --name msb-ecom-local
done
```

### Step 3: Deploy

```bash
./k8s/deploy.sh
```

This applies all manifests in dependency order and waits for each tier to be Ready.

### Step 4: Verify

```bash
./k8s/verify.sh
```

Checks all pods are Running/Ready and HTTP endpoints respond through the Gateway.

### Step 5: Access

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:9000 |
| Frontend | http://localhost:4200 |

---

## Architecture Overview

### Dependency Chain

```
┌─────────────────────────────────────────────────────────────┐
│  00-namespace.yaml                                          │
│  Creates the msb-ecom namespace                             │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  01-configmaps-secrets.yaml                                 │
│  ConfigMap (app-config) + Secret (app-secrets)              │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  02-databases.yaml                                          │
│  MongoDB · MySQL · PostgreSQL (Auth) · PostgreSQL (Keycloak) │
│  All with PersistentVolumeClaims                             │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  03-infrastructure.yaml                                     │
│  Zookeeper → Kafka Broker · Keycloak · Mailpit              │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  04-backend-services.yaml                                   │
│  Auth · Product · Order · Inventory · Payment · Notification │
│  All with Actuator health probes + resource limits          │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  05-gateway-frontend.yaml                                   │
│  API Gateway (NodePort 30000) · Frontend (NodePort 30080)   │
└─────────────────────────────────────────────────────────────┘
```

### All 16 Pods

| # | Pod | Tier | Port | Role |
|---|-----|------|------|------|
| 1 | `mongo` | database | 27017 | Product service data store |
| 2 | `mysql` | database | 3306 | Order, Inventory, Payment data store |
| 3 | `postgres-auth` | database | 5432 | Auth service data store |
| 4 | `postgres-keycloak` | database | 5432 | Keycloak IAM data store |
| 5 | `zookeeper` | infrastructure | 2181 | Kafka coordination |
| 6 | `broker` | infrastructure | 29092 | Kafka message broker |
| 7 | `keycloak` | infrastructure | 8080 | OAuth2/OIDC IAM |
| 8 | `mailpit` | infrastructure | 1025 | SMTP test server |
| 9 | `auth-service` | backend | 8085 | JWT authentication |
| 10 | `product-service` | backend | 8080 | Product catalog |
| 11 | `order-service` | backend | 8081 | Order management |
| 12 | `inventory-service` | backend | 8082 | Stock tracking |
| 13 | `payment-service` | backend | 8084 | Payment processing |
| 14 | `notification-service` | backend | 8083 | Email notifications |
| 15 | `api-gateway` | gateway | 9000 | Request routing |
| 16 | `frontend` | frontend | 4200 | Angular SPA |

---

## Manifest Deep-Dive

### `00-namespace.yaml`
Creates the `msb-ecom` namespace. All subsequent resources live here. Labels (`app.kubernetes.io/part-of: msb-ecom`) enable bulk operations.

### `01-configmaps-secrets.yaml`
- **ConfigMap `app-config`**: Non-sensitive configuration (database hosts, service URLs, Kafka bootstrap servers)
- **Secret `app-secrets`**: Sensitive values (database passwords, JWT secret, Keycloak admin credentials) stored as `stringData` for readability

### `02-databases.yaml`
Each database follows the same pattern:
- **PersistentVolumeClaim** (1Gi) for data persistence across pod restarts
- **Deployment** with `replicas: 1`, resource requests/limits, and volume mounts
- **ClusterIP Service** for internal DNS discovery
- MySQL includes a `ConfigMap`-mounted init script to create databases

### `03-infrastructure.yaml`
- **Zookeeper → Kafka**: Kafka depends on Zookeeper for coordination
- **Keycloak**: Connects to `postgres-keycloak` via JDBC URL, runs in `start-dev` mode
- **Mailpit**: Lightweight SMTP test server with web UI on port 8025

### `04-backend-services.yaml`
Each Spring Boot service follows the same pattern:
- **Deployment** with `imagePullPolicy: IfNotPresent` (local kind images)
- **Liveness probe**: HTTP GET `/actuator/health` — restarts unresponsive pods
- **Readiness probe**: HTTP GET `/actuator/health` — removes pods from Service during startup
- **Resource requests/limits**: Prevents node memory exhaustion on 15GB host
- **Environment variables**: Injected via ConfigMap and Secret references

### `05-gateway-frontend.yaml`
- **API Gateway**: Routes requests to backend services via `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`, etc.
- **Frontend**: Nginx serving the Angular SPA, probed on `/`
- **NodePort Services**: Expose ports 30000, 30080, 30420 for host access

### Key Attributes Explained

**`imagePullPolicy: IfNotPresent`** — Used because images are loaded into kind via `kind load docker-image`, not pulled from a registry. This avoids unnecessary pull attempts.

**`livenessProbe`** — Detects when a container is stuck or dead. If the probe fails, Kubernetes restarts the pod. Initial delay accounts for JVM startup time.

**`readinessProbe`** — Detects when a container is ready to accept traffic. Until the probe passes, the pod is removed from Service endpoints — preventing requests from hitting a starting service.

**Resource requests vs limits** — `requests` guarantee minimum CPU/memory allocation for scheduling. `limits` cap maximum usage — exceeding memory limits causes OOMKill, exceeding CPU limits causes throttling.

---

## Docker Compose vs Kubernetes

| Aspect | Docker Compose | Kubernetes |
|--------|---------------|------------|
| **Orchestration model** | Single-file `docker-compose.yml` | Declarative YAML manifests per resource |
| **Service discovery** | Container names on a shared bridge network | ClusterIP DNS names within a namespace |
| **Health checks** | `healthcheck:` in compose file | `livenessProbe` + `readinessProbe` in Deployment |
| **Scaling** | `docker-compose up --scale svc=N` | `kubectl scale deployment svc --replicas=N` |
| **Networking** | Bridge network (all containers share a subnet) | ClusterIP (internal), NodePort/LoadBalancer (external) |
| **Configuration** | `.env` files or `environment:` keys | ConfigMaps + Secrets (versioned, declarative) |
| **Storage** | Docker volumes | PersistentVolumeClaims (bound to storage classes) |
| **Rolling updates** | `docker-compose up --force-recreate` (downtime) | `kubectl rollout` (zero-downtime) |
| **Self-healing** | `restart: always` (restart only) | Probes + ReplicaSets (restart, reschedule, reschedule on new node) |
| **Multi-host** | Single host only | Clusters across multiple nodes/hosts |

### When to Use Which

- **Docker Compose**: Local development, simple apps, single-host deployments, quick prototyping
- **Kubernetes**: Production workloads, multi-service architectures, need for auto-scaling, self-healing, rolling updates, and complex networking

---

## Interview Q&A

### Q: Why Kubernetes over Docker Compose for production?

**A:** Docker Compose runs on a single host with limited self-healing (restart only). Kubernetes provides automatic pod rescheduling if a node fails, rolling updates with zero downtime, horizontal pod autoscaling based on metrics, and declarative configuration that can be version-controlled. For a microservices architecture like msb-ecom, Kubernetes manages service discovery, load balancing, and health checking automatically.

### Q: What are liveness and readiness probes, and why do they matter?

**A:** Liveness probes detect when a container is stuck or dead — Kubernetes restarts it automatically. Readiness probes detect when a container is ready to accept traffic — the pod is removed from Service endpoints until the probe passes. Without probes, Kubernetes might route requests to pods that are still starting up (causing errors) or keep routing to pods that have deadlocked (causing cascading failures).

### Q: What are resource requests and limits? What happens without them?

**A:** Resource requests guarantee a minimum amount of CPU/memory for scheduling — the scheduler won't place a pod on a node without sufficient free resources. Limits cap maximum usage — exceeding the memory limit triggers OOMKill (pod restart), while exceeding CPU limits causes throttling. Without them, a single pod can consume all node memory, causing other pods to be evicted.

### Q: How does service discovery work in Kubernetes?

**A:** Each Service gets a DNS entry within the cluster: `<service-name>.<namespace>.svc.cluster.local`. Within the same namespace, pods can reach each other by just the service name (e.g., `http://product-service:8080`). The kube-proxy handles load balancing across all pods matching the Service's selector labels.

### Q: Explain the difference between ClusterIP, NodePort, and LoadBalancer services.

**A:** **ClusterIP** (default) — only accessible within the cluster. **NodePort** — exposes the service on a static port (30000-32767) on every node, accessible from outside the cluster via `<NodeIP>:<NodePort>`. **LoadBalancer** — provisions an external load balancer (cloud provider-specific) that routes to the service. For local development with kind, NodePort with `extraPortMappings` maps container ports to host ports.

### Q: What is a PersistentVolumeClaim and why do databases need one?

**A:** A PersistentVolumeClaim (PVC) requests persistent storage that survives pod restarts. Databases must persist data — without a PVC, restarting a database pod would lose all data. The PVC is bound to a PersistentVolume (PV) by the cluster's storage class. In our deployment, each database gets a 1Gi PVC for local persistence.

### Q: How would you scale this deployment for production?

**A:** Multiple strategies: **Horizontal Pod Autoscaler** scales pods based on CPU/memory metrics. **Cluster Autoscaler** adds/removes nodes based on pending pods. For databases, use managed services (RDS, Cloud SQL) or StatefulSets with read replicas. The API Gateway can be scaled independently since it's stateless. For production, replace NodePort with Ingress + TLS termination.

---

## Teardown

### Remove All Resources

```bash
./k8s/teardown.sh
```

This deletes all Kubernetes resources in reverse order (Gateway → Backend → Infrastructure → Databases → Config → Namespace).

### Remove the Cluster

```bash
kind delete cluster --name msb-ecom-local
```

### Complete Cleanup

```bash
./k8s/teardown.sh
kind delete cluster --name msb-ecom-local
```
