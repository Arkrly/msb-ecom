---
last_mapped_commit: HEAD
---

# External Integrations

**Analysis Date:** 2026-08-28

## Database Connections

### MongoDB — Product Service
- **Connection URI:** `mongodb://root:password@localhost:27017/product-service?authSource=admin`
- **Config:** `product-service/src/main/resources/application.properties`
- **Spring Data:** `spring-boot-starter-data-mongodb`
- **Document:** `Product` entity in `product-service/src/main/java/com/msb/ecom/product_service/model/Product.java`
- **Repository:** `ProductRepository` (Spring Data MongoDB interface)

### MySQL — Order, Inventory, Payment Services
- **Host:** `localhost:3306` (configurable via `MYSQL_PORT`)
- **Credentials:** root / `${MYSQL_ROOT_PASSWORD:-mysql}`
- **Databases:** `order_service`, `inventory_service`, `payment_service` (created at runtime by `run.sh`)
- **Config:** Each service's `application.properties`
- **ORM:** Spring Data JPA + Hibernate
- **Migrations:** Flyway (`classpath:db/migration`)
- **DDL:** `hibernate.ddl-auto=none` (Flyway manages schema)

#### Flyway Migrations
| Service | File | Tables |
|---------|------|--------|
| Order | `order-service/src/main/resources/db/migration/V1__init.sql` | `t_orders` |
| Inventory | `inventory-service/src/main/resources/db/migration/V1__init.sql` | `t_inventory` (with seed data) |
| Payment | `payment-service/src/main/resources/db/migration/V1__init.sql` | `t_payments` |

### PostgreSQL — Auth Service
- **Host:** `localhost:5432` (separate container `postgres-auth`)
- **Database:** `auth_service`
- **Credentials:** `${AUTH_DB_USER:-auth}` / `${AUTH_DB_PASSWORD:-password}`
- **Config:** `auth-service/src/main/resources/application.properties`
- **ORM:** Spring Data JPA + Hibernate
- **Migrations:** Flyway (`V1__init_users.sql` → `t_users`)

### PostgreSQL — Keycloak
- **Host:** `postgres-keycloak:5432` (internal Docker network)
- **Database:** `keycloak`
- **Purpose:** Keycloak's own persistence (user sessions, realms, etc.)

## Messaging — Apache Kafka

### Topic: `order-placed`
- **Producer:** Not yet implemented in any service (see CONCERNS.md)
- **Consumer:** Notification Service
  - **Config:** `notification-service/src/main/resources/application.properties`
  - **Group ID:** `notificationService`
  - **Deserializer:** `JsonDeserializer` with type mapping: `orderPlacedEvent → OrderPlacedEvent`
  - **Listener:** `NotificationService.listen()` in `notification-service/src/main/java/com/msb/ecom/notification_service/service/NotificationService.java`
  - **Event Class:** `OrderPlacedEvent` — fields: `orderNumber`, `skuCode`, `quantity`, `userEmail`

### Kafka Infrastructure
- **Broker:** `localhost:9092` (external) / `broker:29092` (internal)
- **Zookeeper:** `localhost:2181`
- **Schema Registry:** `localhost:8081` (configured but not actively used)
- **Kafka UI:** `localhost:8080` (topic inspection)

## Identity & Authentication

### Keycloak (Configured, Not Fully Integrated)
- **Admin UI:** `http://localhost:8181` (admin/admin)
- **Realm:** Default (master) — no custom realm configured yet
- **Config:** `docker-compose.yml` service definition
- **API Gateway integration:** Keycloak's issuer-uri and jwk-set-uri are empty in gateway config

### Self-Managed JWT Auth
- **Auth Service** (`auth-service`) issues its own JWTs using JJWT library
- **Secret:** Symmetric HS256 key shared between auth-service and api-gateway
- **Config locations:**
  - `auth-service/src/main/resources/application.properties` — `jwt.secret`, `jwt.expiration`
  - `api-gateway/src/main/resources/application.properties` — `spring.security.oauth2.resourceserver.jwt.secret`
- **Token flow:** Auth service generates → Client stores → API Gateway validates
- **Free paths:** `/auth/**`, `/swagger-ui/**`, `/actuator/health/**`, `/fallbackRoute`

### Session Management
- Auth service originally used `HttpSession` (commented out code suggests transition)
- Current implementation: pure JWT-based, no server-side sessions

## Email — Mailpit

- **SMTP:** `localhost:1025`
- **Web UI:** `http://localhost:8025`
- **Consumer:** Notification Service sends order confirmation emails
- **Config:** `notification-service/src/main/resources/application.properties`
- **Mail format:** HTML with order details (MIME message)
- **From address:** `orders@msb-ecom.com`

## API Gateway Routing

All traffic flows through API Gateway (`localhost:9000`) which proxies to individual services:

| Route Pattern | Target Service | Circuit Breaker |
|---------------|----------------|-----------------|
| `/api/product/**` | `http://localhost:8080` | `productServiceCircuitBreaker` |
| `/api/order/**` | `http://localhost:8081` | `orderServiceCircuitBreaker` |
| `/api/inventory/**` | `http://localhost:8082` | `inventoryServiceCircuitBreaker` |
| `/api/payment/**` | `http://localhost:8084` | `paymentServiceCircuitBreaker` |
| `/auth/**` | `http://localhost:8085` | `authServiceCircuitBreaker` |
| `/fallbackRoute` | Gateway itself (503 response) | — |

**Config:** `api-gateway/src/main/java/com/msb/ecom/api_gateway/routes/Routes.java`

## Frontend → Backend

- Angular app communicates with backend services exclusively through the API Gateway
- **Auth interceptor:** `frontend/src/app/core/interceptors/auth.interceptor.ts` — attaches JWT to requests
- **Auth guard:** `frontend/src/app/core/guards/auth.guard.ts` — protects routes
- **Services:** `frontend/src/app/core/services/` — HTTP clients for each domain (product, order, payment, inventory, auth)

## Observability (ELK Stack)

- **Elasticsearch:** `localhost:9200/9300` — single-node, security disabled
- **Logstash:** `localhost:50000` — pipeline config at `logstash/logstash.conf` (file not found in repo)
- **Kibana:** `localhost:5601` — dashboard
- **Status:** Infrastructure defined but no application log shipping configured yet (Logstash pipeline file missing)

---

*Codebase integrations analysis: 2026-08-28*
