# External Integrations

## **Analysis Date:** 2026-08-28

## Overview
This document analyzes external integrations, APIs, databases, authentication providers, and webhook systems used by the MSB E-Commerce microservices platform.

## Databases

### Product Service

- **Database:** MongoDB
  - Location: `product-service/src/main/resources/application.properties`
  - Collections: `products`, `categories`, `inventory`
  - Reason: Flexible schema for product catalog
  - Connection: Embedded in Spring Boot configuration

### Order Service

- **Database:** PostgreSQL
  - Location: `order-service/src/main/resources/application.properties`
  - Tables: `orders`, `order_items`, `customers`
  - Reason: ACID compliance for financial transactions
  - Connection: Managed via Spring Data JPA

### Auth Service

- **Database:** PostgreSQL
  - Location: `auth-service/src/main/resources/application.properties`
  - Tables: `users`, `roles`, `permissions`, `sessions`
  - Reason: User management and authentication
  - Connection: JPA with Spring Security integration

### Inventory Service

- **Database:** MongoDB
  - Location: `inventory-service/src/main/resources/application.properties`
  - Collections: `inventory_items`, `warehouse_locations`
  - Reason: Real-time inventory tracking with flexible queries

## Authentication & Authorization

### OAuth2 / OpenID Connect

- **Provider:** Keycloak
  - Location: Configured in `api-gateway/src/main/resources/application.properties`
  - Integration: Spring Security OAuth2 Resource Server
  - Endpoints: `/auth/realms/msb-ecom/protocol/openid-connect/*`
  - Scopes: `openid`, `profile`, `email`, `roles`

### JWT Tokens

- **Implementation:** Custom JWT service in `auth-service`
  - Location: `auth-service/src/main/java/com/msb/ecom/auth_service/service/JwtService.java`
  - Algorithm: HS256 with secret key
  - Expiration: 24 hours for access tokens, 7 days for refresh tokens
  - Validation: Token filtering in API Gateway

## External APIs

### Payment Processing

- **Provider:** Custom payment service
  - Location: `payment-service/src/main/java/com/msb/ecom/payment_service/service/PaymentService.java`
  - Integration: REST API calls to external payment gateways
  - Methods: `processPayment()`, `refundPayment()`
  - Configuration: External API endpoints in application properties

### Notification Service

- **Provider:** Email/SMS providers
  - Location: `notification-service/src/main/java/com/msb/ecom/notification_service/service/NotificationService.java`
  - Channels: Email, SMS, Push notifications
  - Integration: SMTP for email, third-party SMS APIs for SMS
  - Templates: Email templates in `/templates/` directories

### Inventory Management

- **Provider:** External inventory APIs
  - Location: `inventory-service/src/main/java/com/msb/ecom/inventory_service/service/InventoryService.java`
  - Integration: HTTP client for external warehouse systems
  - Methods: `syncInventory()`, `checkStockAvailability()`

## Event-Driven Integrations

### Apache Kafka Topics

- **Order Processing Events**
  - Topic: `order-events`
  - Producer: `order-service`
  - Consumers: `inventory-service`, `payment-service`, `notification-service`
  - Event Types: `OrderCreated`, `OrderCompleted`, `OrderCancelled`

- **Inventory Updates**
  - Topic: `inventory-updates`
  - Producer: `inventory-service`
  - Consumers: `order-service`
  - Event Types: `StockReserved`, `StockReleased`

- **Payment Events**
  - Topic: `payment-events`
  - Producer: `payment-service`
  - Consumers: `notification-service`
  - Event Types: `PaymentProcessed`, `PaymentFailed`

### Event Schema

```java
// OrderCreated event
public class OrderCreatedEvent {
    private String orderId;
    private String customerId;
    private BigDecimal amount;
    private List<OrderItem> items;
    private Timestamp timestamp;
}
```

## API Gateway Routes

### Authentication Routes

- `/auth/login` - Authenticate users
- `/auth/logout` - Logout users
- `/auth/register` - Register new users
- `/auth/validate` - Validate tokens

### Service Routes

- `/product/**` - Product service gateway
- `/order/**` - Order service gateway
- `/inventory/**` - Inventory service gateway
- `/payment/**` - Payment service gateway
- `/notification/**` - Notification service gateway

## Webhook Integrations

### Order Webhooks

- **Target:** External analytics services
  - Location: `order-service/src/main/resources/application.properties`
  - Webhook URL: Configurable via properties
  - Events: Order created, completed, cancelled

### Payment Webhooks

- **Target:** Payment gateway callbacks
  - Location: `payment-service/src/main/resources/application.properties`
  - Webhook URL: Payment gateway endpoint
  - Events: Payment success, failure, refund

## Third-Party Service Integrations

### Email Service

- **Provider:** JavaMail API
  - Location: `notification-service/src/main/java/com/msb/ecom/notification_service/service/EmailService.java`
  - Integration: SMTP protocol
  - Templates: Thymeleaf email templates

### SMS Service

- **Provider:** Third-party SMS APIs
  - Location: `notification-service/src/main/java/com/msb/ecom/notification_service/service/SmsService.java`
  - Integration: REST API calls
  - Configuration: API keys and endpoints in properties

### Currency Exchange

- **Provider:** External APIs
  - Location: `order-service/src/main/java/com/msb/ecom/order_service/service/CurrencyService.java`
  - Integration: REST API for real-time rates
  - Caching: Redis for rate limiting

## Security Integrations

### Keycloak Configuration

- **Realm:** `msb-ecom`
- **Client:** `msb-ecom-app`
- **Scopes:** `openid`, `profile`, `email`, `roles`, `offline_access`
- **Mappers:** Standard profile, email, roles

### Token Validation

- **Interceptor:** `api-gateway/src/main/java/com/msb/ecom/api_gateway/config/SecurityConfig.java`
- **Validation:** JWT token validation in request headers
- **Authorities:** Roles extracted from JWT claims

## Integration Testing

### Testcontainers

- **Databases:** PostgreSQL, MongoDB
  - Location: Service test configurations
  - Purpose: Isolated database testing
  - Integration: Spring Boot Testcontainers

### Mock APIs

- **External Services:** MockServer, WireMock
  - Location: Service test resources
  - Purpose: Simulate external dependencies
  - Integration: Spring Cloud Contract

## Integration Monitoring

### Metrics

- **External API calls:** Prometheus metrics
  - Location: Service actuator endpoints
  - Monitoring: API response times, error rates

### Logging

- **Integration logs:** Logstash configuration
  - Location: `src/main/resources/logback.xml`
  - Format: Structured logging for audit trails

## Integration Security

### API Keys

- **Storage:** Environment variables
  - Location: `.env` files
  - Protection: Encryption at rest

### Secure Communication

- **TLS/SSL:** HTTPS for all external API calls
- **Authentication:** Bearer tokens for authenticated services
- **Authorization:** Scope-based access control

## Integration Best Practices

1. **Circuit Breaker:** Resilience4j for external service failures
2. **Timeouts:** Configurable timeouts for all external calls
3. **Retry Logic:** Exponential backoff for transient failures
4. **Rate Limiting:** Prevent abuse of external services
5. **Monitoring:** Health checks and metrics collection
6. **Security:** TLS, authentication, and authorization

## Integration Dependencies

### Maven Dependencies

```xml
<!-- External API clients -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- Kafka integration -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>

<!-- JWT authentication -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>

<!-- Email service -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

## Integration Future Roadmap

1. **API Gateway**: Add service mesh (Envoy/Linkerd)
2. **Observability**: Distributed tracing with Jaeger/Zipkin
3. **Security**: Zero-trust network architecture
4. **Data Integration**: Elasticsearch for search capabilities
5. **Event Streaming**: Advanced Kafka patterns (kinesis, pulsar)


## *...tech analysis: 2026-08-28*
