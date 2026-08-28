#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  msb-ecom: End-to-End Deployment Verification
#  Validates pod readiness and HTTP endpoint health.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

NAMESPACE="msb-ecom"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

pass() { echo -e "  ${GREEN}✓ PASS${NC}: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo -e "  ${RED}✗ FAIL${NC}: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

echo "============================================="
echo "  msb-ecom — Deployment Verification"
echo "============================================="
echo ""

# ── Step 1: Pod Readiness ──────────────────────────────────
echo "▸ Step 1: Pod Readiness"
POD_OUTPUT=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null || true)

if [ -z "$POD_OUTPUT" ]; then
  fail "No pods found in namespace '$NAMESPACE'"
else
  TOTAL_PODS=0
  READY_PODS=0
  while IFS= read -r line; do
    TOTAL_PODS=$((TOTAL_PODS + 1))
    POD_NAME=$(echo "$line" | awk '{print $1}')
    STATUS=$(echo "$line" | awk '{print $3}')
    READY=$(echo "$line" | awk '{print $2}')
    if [ "$STATUS" = "Running" ] && [ "$READY" = "1/1" ]; then
      READY_PODS=$((READY_PODS + 1))
    else
      fail "Pod '$POD_NAME' is $STATUS ($READY)"
    fi
  done <<< "$POD_OUTPUT"

  if [ "$READY_PODS" -eq "$TOTAL_PODS" ]; then
    pass "All $TOTAL_PODS pods are Running (1/1)"
  else
    fail "$READY_PODS/$TOTAL_PODS pods are Ready"
  fi
fi
echo ""

# ── Step 2: Gateway Health ─────────────────────────────────
echo "▸ Step 2: API Gateway Health"
GW_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 http://localhost:9000/actuator/health 2>/dev/null || echo "000")
if [ "$GW_STATUS" = "200" ]; then
  pass "API Gateway /actuator/health returned HTTP 200"
else
  fail "API Gateway /actuator/health returned HTTP $GW_STATUS (expected 200)"
fi
echo ""

# ── Step 3: Frontend Health ────────────────────────────────
echo "▸ Step 3: Frontend Health"
FE_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 http://localhost:4200/ 2>/dev/null || echo "000")
if [ "$FE_STATUS" = "200" ]; then
  pass "Frontend / returned HTTP 200"
else
  fail "Frontend / returned HTTP $FE_STATUS (expected 200)"
fi
echo ""

# ── Summary ────────────────────────────────────────────────
echo "============================================="
echo "  Results: ${PASS_COUNT} passed, ${FAIL_COUNT} failed"
echo "============================================="

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "${GREEN}  ALL CHECKS PASSED${NC}"
  exit 0
else
  echo -e "${RED}  SOME CHECKS FAILED${NC}"
  exit 1
fi
