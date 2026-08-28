#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  msb-ecom: Full Stack Teardown Script
#  Removes all Kubernetes resources in reverse dependency order.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

NAMESPACE="msb-ecom"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================="
echo "  msb-ecom — Tearing down Kubernetes stack"
echo "============================================="
echo ""

# ── Step 1: API Gateway & Frontend ─────────────────────────
echo "▸ [1/6] Removing API Gateway and Frontend..."
kubectl delete -f "$SCRIPT_DIR/05-gateway-frontend.yaml" --ignore-not-found
echo "  ✓ Gateway and Frontend removed"
echo ""

# ── Step 2: Backend Microservices ──────────────────────────
echo "▸ [2/6] Removing backend microservices..."
kubectl delete -f "$SCRIPT_DIR/04-backend-services.yaml" --ignore-not-found
echo "  ✓ Backend services removed"
echo ""

# ── Step 3: Infrastructure Services ────────────────────────
echo "▸ [3/6] Removing infrastructure services..."
kubectl delete -f "$SCRIPT_DIR/03-infrastructure.yaml" --ignore-not-found
echo "  ✓ Infrastructure services removed"
echo ""

# ── Step 4: Databases ──────────────────────────────────────
echo "▸ [4/6] Removing databases..."
kubectl delete -f "$SCRIPT_DIR/02-databases.yaml" --ignore-not-found
echo "  ✓ Databases removed"
echo ""

# ── Step 5: ConfigMaps & Secrets ───────────────────────────
echo "▸ [5/6] Removing ConfigMaps and Secrets..."
kubectl delete -f "$SCRIPT_DIR/01-configmaps-secrets.yaml" --ignore-not-found
echo "  ✓ ConfigMaps and Secrets removed"
echo ""

# ── Step 6: Namespace ──────────────────────────────────────
echo "▸ [6/6] Removing namespace..."
kubectl delete -f "$SCRIPT_DIR/00-namespace.yaml" --ignore-not-found
echo "  ✓ Namespace '$NAMESPACE' removed"
echo ""

# ── Summary ────────────────────────────────────────────────
echo "============================================="
echo "  ✓ Teardown complete!"
echo "============================================="
echo ""
echo "To also remove the kind cluster:"
echo "  kind delete cluster --name msb-ecom-local"
