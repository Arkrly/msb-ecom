---
last_mapped_commit: HEAD
---

# Technical Concerns

**Analysis Date:** 2026-08-28

## Security Concerns

### Hardcoded JWT Secret Default
- **Location:** `api-gateway/src/main/resources/application.properties`, `auth-service/src/main/resources/application.properties`
- **Issue:** JWT secret has a hardcoded default value (`5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437`) shared across services
- **Risk:** If `JWT_SECRET` env var is not set in production, all tokens use the same known secret
- **Fix:** Require `JWT_SECRET` with no default, fail fast if missing

### CORS Wildcard
- **Location:** `api-gateway/src/main/java/com/msb/ecom/api_gateway/config/SecurityConfig.java`
- **Issue:** `setAllowedOriginPatterns(List.of("*"))` allows any origin
- **Risk:** Cross-origin requests from any domain
- **Fix:** Restrict to specific frontend origin(s) per environment

### Database Credentials in Compose
- **Location:** `docker-compose.yml`
- **Issue:** Default passwords (`password`, `mysql`, `admin`) used for all databases and Keycloak
- **Risk:** If containers are exposed, credentials are trivially guessable
- **Mitigation:** Ports bound to `127.0.0.1` only (localhost), but production deployments need proper secrets management

### No HTTPS/TLS
- All services communicate over plain HTTP
- No TLS termination configured at the gateway level
- **Risk:** Credentials and tokens transmitted in cleartext on the network

## Architecture Gaps

### Missing Kafka Producer
- **Location:** `order-service/`
- **Issue:** The notification service has a Kafka consumer for `order-placed` events, but **no service produces to this topic**
- **Impact:** Order placement notifications are never sent
- **Fix:** Add KafkaTemplate to order-service to publish `OrderPlacedEvent` after order creation

### No Service Discovery
- **Location:** API Gateway routes
- **Issue:** All service URLs are hardcoded as `http://localhost:{port}`
- **Impact:** Cannot scale services, no load balancing, no resilience to service restarts
- **Fix:** Integrate Eureka, Consul, or Kubernetes DNS for service discovery

### No Distributed Tracing
- **Issue:** ELK stack is defined in `docker-compose.yml` but no log shipping pipeline exists (Logstash config file missing)
- **Impact:** Cannot trace requests across services, difficult to debug production issues
- **Fix:** Add Spring Cloud Sleuth/Micrometer + configure Logstash pipeline

### No Rate Limiting
- **Issue:** Only circuit breakers protect downstream services; no rate limiting at the gateway
- **Impact:** Services can be overwhelmed by too many requests
- **Fix:** Add rate limiting filter to API Gateway (Resilience4j RateLimiter or bucket4j)

### No API Versioning
- **Issue:** All endpoints use `/api/<domain>` without version prefix
- **Impact:** Breaking changes require coordinated updates across frontend and all clients
- **Fix:** Adopt `/api/v1/<domain>` pattern

### Keycloak Not Integrated
- **Location:** `docker-compose.yml`, API Gateway
- **Issue:** Keycloak is running but the API Gateway's `issuer-uri` and `jwk-set-uri` are empty
- **Impact:** JWT validation uses shared secret instead of Keycloak's public key infrastructure
- **Fix:** Configure Keycloak realm and update gateway to validate against Keycloak's JWK endpoint

## Code Quality Concerns

### Inconsistent Error Handling
- Auth Service has `GlobalExceptionHandler` with `@RestControllerAdvice`
- Other services throw raw `IllegalArgumentException` or `RuntimeException`
- No unified error response format across services

### No Inter-Service Communication
- Services are completely isolated — no HTTP calls between them
- Order Service doesn't check inventory before placing orders
- Order Service doesn't initiate payment processing
- **Impact:** Business logic is incomplete; no end-to-end order flow

### Missing Flyway for Product Service
- Product Service uses MongoDB (no SQL), so Flyway is not applicable
- But MongoDB has no schema versioning strategy
- **Risk:** Schema drift in MongoDB collections over time

### Test Coverage
- Only context-load smoke tests exist
- No integration tests, no API tests, no business logic tests
- Testcontainers dependencies declared but unused
- See `TESTING.md` for full gap analysis

## Operational Concerns

### No Health Checks in Production Compose
- `docker-compose.prod.yml` does not define `healthcheck` for application services
- `depends_on` without health conditions means services may start before dependencies are ready
- `run.sh` handles this for local mode with `wait_for_port`, but Docker mode relies on `restart: unless-stopped`

### No Graceful Shutdown
- Java services don't configure `server.shutdown=graceful`
- Kubernetes/Swarm deployments may kill in-flight requests

### No Resource Limits
- Docker Compose files don't set CPU/memory limits
- Elasticsearch configured with `-Xms512m -Xmx512m` but application services have no JVM memory limits

### Log Management
- `run.sh` writes logs to `<service>/target/<service>.log`
- No log rotation configured
- In Docker mode, logs go to stdout (Docker's log driver)

## Missing Features (Pre-Kubernetes)

| Feature | Status | Priority |
|---------|--------|----------|
| Kubernetes manifests | Not started | High |
| ConfigMaps/Secrets | Not started | High |
| Liveness/readiness probes | Not started | High |
| HPA (auto-scaling) | Not started | Medium |
| Ingress controller | Not started | High |
| Persistent volume claims | Not started | Medium |
| Network policies | Not started | Medium |

## Technical Debt Summary

1. **Kafka producer missing** — notifications never fire
2. **No service discovery** — static URLs prevent scaling
3. **Hardcoded secrets** — JWT secret has insecure defaults
4. **CORS wildcard** — overly permissive
5. **No tests** — zero confidence in code correctness
6. **No tracing** — debugging distributed issues is impossible
7. **Incomplete order flow** — no inventory check, no payment initiation
8. **Keycloak unused** — identity provider running but not connected

---

*Codebase concerns analysis: 2026-08-28*
