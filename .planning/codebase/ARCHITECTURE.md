---
last_mapped_commit: HEAD
---

# Architecture

**Analysis Date:** 2026-08-28

## Overview

MSB E-Commerce is a **microservices architecture** with 7 backend services, an Angular frontend, and supporting infrastructure. Services communicate synchronously via REST through an API Gateway, and asynchronously via Apache Kafka for event-driven workflows.

## Architectural Pattern

### Microservices with API Gateway
- **Entry point:** API Gateway (port 9000) — all external traffic enters here
- **Service discovery:** Static URLs (no Eureka/Consul yet) — configured via environment variables
- **Communication:** REST (synchronous) + Kafka (asynchronous)
- **Data isolation:** Each service owns its own database (Database per Service pattern)

### Per-Service Layered Architecture
Each backend service follows a consistent 4-layer pattern:

```
Controller (REST endpoint)
    ↓
Service (business logic + @Transactional)
    ↓
Repository (data access — JPA or MongoDB)
    ↓
Model/Entity (domain objects)
```

Plus DTOs for request/response serialization.

### Event-Driven Communication
- **Order → Notification:** Order placement triggers a Kafka event that the notification service consumes to send emails
- **Pattern:** Publisher-subscriber with JSON serialization
- **Topic:** `order-placed`

## Service Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Angular)                       │
│                         port 4200                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                     API Gateway (Spring MVC)                     │
│                         port 9000                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ JWT Auth     │  │ Route Rules  │  │ Circuit Breakers   │     │
│  │ (HS256)      │  │ (5 routes)   │  │ (Resilience4j)     │     │
│  └─────────────┘  └──────────────┘  └────────────────────┘     │
└───┬─────────┬─────────┬──────────┬─────────┬────────────────────┘
    │         │         │          │         │
    ▼         ▼         ▼          ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ Product│ │ Order │ │Invent.│ │Payment│ │ Auth  │
│ 8080  │ │ 8081  │ │ 8082  │ │ 8084  │ │ 8085  │
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    │         │         │         │         │
    ▼         ▼         ▼         ▼         ▼
 MongoDB    MySQL     MySQL     MySQL   PostgreSQL
```

**Notification Service (8083)** runs independently — consumes Kafka events, no direct API Gateway routing.

## Data Flow

### Synchronous Request Flow (e.g., Create Product)
1. Client → API Gateway (`POST /api/product`)
2. Gateway validates JWT (if not on free path)
3. Gateway forwards to Product Service (`http://localhost:8080/api/product`)
4. Product Service processes and returns response
5. Gateway returns response to client

### Asynchronous Event Flow (e.g., Place Order)
1. Client → API Gateway → Order Service
2. Order Service saves order to MySQL
3. (Kafka producer should emit `order-placed` event — **NOT YET IMPLEMENTED**)
4. Notification Service consumes event from `order-placed` topic
5. Notification Service sends confirmation email via Mailpit

### Circuit Breaker Flow
1. If a downstream service fails, Resilience4j tracks failures
2. After 5 failures out of 10 calls → circuit opens (50% threshold)
3. Open circuit returns fallback response immediately for 5 seconds
4. Half-open state allows 3 test calls → if succeed, circuit closes

## Entry Points

| Entry Point | Type | Location |
|-------------|------|----------|
| API Gateway | HTTP REST | `api-gateway/src/main/java/com/msb/ecom/api_gateway/ApiGatewayApplication.java` |
| Auth Service | HTTP REST | `auth-service/src/main/java/com/msb/ecom/auth_service/AuthServiceApplication.java` |
| Product Service | HTTP REST | `product-service/src/main/java/com/msb/ecom/product_service/ProductServiceApplication.java` |
| Order Service | HTTP REST | `order-service/src/main/java/com/msb/ecom/order_service/OrderServiceApplication.java` |
| Inventory Service | HTTP REST | `inventory-service/src/main/java/com/msb/ecom/inventory_service/InventoryServiceApplication.java` |
| Payment Service | HTTP REST | `payment-service/src/main/java/com/msb/ecom/payment_service/PaymentServiceApplication.java` |
| Notification Service | Kafka Consumer | `notification-service/src/main/java/com/msb/ecom/notification_service/NotificationServiceApplication.java` |
| Frontend | Angular SSR | `frontend/src/app/app.ts` + `frontend/src/server.ts` |

## Key Abstractions

### API Gateway Routes
- `Routes.java` — declarative `RouterFunction<ServerResponse>` beans using Spring Cloud Gateway MVC
- Each service gets its own route bean with a circuit breaker filter
- Fallback route returns HTTP 503 with generic message

### JWT Authentication
- **Auth Service:** Issues tokens via `JwtService.generateToken()` using JJWT
- **API Gateway:** Validates tokens via `NimbusJwtDecoder` with shared HMAC secret
- **Free paths:** Auth endpoints, Swagger, Actuator health, fallback route

### Resilience4j Configuration
- **Circuit Breaker:** Count-based sliding window (10 calls), 50% failure threshold, 5s wait
- **TimeLimiter:** 3-second timeout per request
- **Retry:** 3 attempts with 2s wait between retries
- All configured centrally in `api-gateway/src/main/resources/application.properties`

## Service Dependencies

| Service | Depends On | Notes |
|---------|-----------|-------|
| API Gateway | All services | Routes traffic, validates JWT |
| Order Service | MySQL | Standalone |
| Inventory Service | MySQL | Standalone |
| Payment Service | MySQL | Standalone |
| Product Service | MongoDB | Standalone |
| Auth Service | PostgreSQL | Standalone |
| Notification Service | Kafka, Mailpit | Async consumer only |
| Frontend | API Gateway | All API calls through gateway |

---

*Codebase architecture analysis: 2026-08-28*
