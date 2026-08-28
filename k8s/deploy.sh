#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  msb-ecom: Full Stack Deployment Script
#  Applies all Kubernetes manifests in dependency order and
#  waits for each tier to be Ready before proceeding.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

NAMESPACE="msb-ecom"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================="
echo "  msb-ecom — Deploying to Kubernetes"
echo "============================================="
echo ""

# ── Step 1: Namespace ───────────────────────────────────────
echo "▸ [1/6] Applying namespace..."
kubectl apply -f "$SCRIPT_DIR/00-namespace.yaml"
echo "  ✓ Namespace '$NAMESPACE' ready"
echo ""

# ── Step 2: ConfigMaps & Secrets ───────────────────────────
echo "▸ [2/6] Applying ConfigMaps and Secrets..."
kubectl apply -f "$SCRIPT_DIR/01-configmaps-secrets.yaml"
echo "  ✓ app-config and app-secrets applied"
echo ""

# ── Step 3: Databases ──────────────────────────────────────
echo "▸ [3/6] Deploying databases (MongoDB, MySQL, PostgreSQL)..."
kubectl apply -f "$SCRIPT_DIR/02-databases.yaml"

echo "  Waiting for MongoDB..."
kubectl wait --for=condition=Available deployment/mongo -n "$NAMESPACE" --timeout=120s
echo "  ✓ MongoDB ready"

echo "  Waiting for MySQL..."
kubectl wait --for=condition=Available deployment/mysql -n "$NAMESPACE" --timeout=120s
echo "  ✓ MySQL ready"

echo "  Waiting for PostgreSQL (Auth)..."
kubectl wait --for=condition=Available deployment/postgres-auth -n "$NAMESPACE" --timeout=120s
echo "  ✓ PostgreSQL (Auth) ready"

echo "  Waiting for PostgreSQL (Keycloak)..."
kubectl wait --for=condition=Available deployment/postgres-keycloak -n "$NAMESPACE" --timeout=120s
echo "  ✓ PostgreSQL (Keycloak) ready"
echo ""

# ── Step 4: Infrastructure Services ────────────────────────
echo "▸ [4/6] Deploying infrastructure (Zookeeper, Kafka, Keycloak, Mailpit)..."
kubectl apply -f "$SCRIPT_DIR/03-infrastructure.yaml"

echo "  Waiting for Zookeeper..."
kubectl wait --for=condition=Available deployment/zookeeper -n "$NAMESPACE" --timeout=120s
echo "  ✓ Zookeeper ready"

echo "  Waiting for Kafka Broker..."
kubectl wait --for=condition=Available deployment/broker -n "$NAMESPACE" --timeout=120s
echo "  ✓ Kafka Broker ready"

echo "  Waiting for Keycloak..."
kubectl wait --for=condition=Available deployment/keycloak -n "$NAMESPACE" --timeout=180s
echo "  ✓ Keycloak ready"

echo "  Waiting for Mailpit..."
kubectl wait --for=condition=Available deployment/mailpit -n "$NAMESPACE" --timeout=60s
echo "  ✓ Mailpit ready"
echo ""

# ── Step 5: Backend Microservices ──────────────────────────
echo "▸ [5/6] Deploying backend microservices..."
kubectl apply -f "$SCRIPT_DIR/04-backend-services.yaml"

for SVC in auth-service product-service order-service inventory-service payment-service notification-service; do
  echo "  Waiting for $SVC..."
  kubectl wait --for=condition=Available deployment/"$SVC" -n "$NAMESPACE" --timeout=180s
  echo "  ✓ $SVC ready"
done
echo ""

# ── Step 6: API Gateway & Frontend ─────────────────────────
echo "▸ [6/6] Deploying API Gateway and Frontend..."
kubectl apply -f "$SCRIPT_DIR/05-gateway-frontend.yaml"

echo "  Waiting for API Gateway..."
kubectl wait --for=condition=Available deployment/api-gateway -n "$NAMESPACE" --timeout=180s
echo "  ✓ API Gateway ready"

echo "  Waiting for Frontend..."
kubectl wait --for=condition=Available deployment/frontend -n "$NAMESPACE" --timeout=120s
echo "  ✓ Frontend ready"
echo ""

# ── Summary ────────────────────────────────────────────────
echo "============================================="
echo "  ✓ Deployment complete!"
echo "============================================="
echo ""
echo "Pods and Services:"
kubectl get pods,svc -n "$NAMESPACE"
echo ""
echo "Access points:"
echo "  Gateway: http://localhost:9000"
echo "  Frontend: http://localhost:4200"
