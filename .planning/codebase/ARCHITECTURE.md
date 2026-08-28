# Architecture Analysis

## **Analysis Date:** 2026-08-28

## Overview
This document analyzes the architectural patterns, layers, data flow, and abstractions in the MSB E-Commerce microservices platform.

## System Architecture

### Pattern
The system follows a **Microservices Architecture** with the following characteristics:

- **Service Decomposition**: 7 independent services (product, order, inventory, api-gateway, notification, payment, auth)
- **API Gateway**: Centralized entry point (api-gateway service)
- **Event-Driven Communication**: Apache Kafka for asynchronous messaging
- **Service Discovery**: Spring Cloud Discovery Client
- **Circuit Breaker**: Resilience4j pattern for fault tolerance

## Layers

### Presentation Layer

- **API Gateway**: `api-gateway/src/main/java/com/msb/ecom/api_gateway/routes/Routes.java`
  - Centralized routing and request handling
  - Authentication and authorization enforcement
  - Rate limiting and circuit breaking

- **Frontend Services**: `frontend/` directory
  - Angular 20 application
  - RESTful API consumption
  - Single-page application (SPA)

### Business Logic Layer

- **Service Layer**: Each microservice implements business logic
  - `product-service`: Product catalog management
  - `order-service`: Order processing and management
  - `inventory-service`: Stock management
  - `payment-service`: Payment processing
  - `auth-service`: Authentication and authorization
  - `notification-service`: Notification delivery

### Data Access Layer

- **Repositories**: Spring Data repositories
  - `ProductRepository`: `product-service/src/main/java/com/msb/ecom/product_service/repository/ProductRepository.java`
  - `OrderRepository`: `order-service/src/main/java/com/msb/ecom/order_service/repository/OrderRepository.java`
  - `UserRepository`: `auth-service/src/main/java/com/msb/ecom/auth_service/repository/UserRepository.java`

- **Database Configurations**:
  - MongoDB for product and inventory services
  - PostgreSQL for order and auth services

### Infrastructure Layer

- **Message Broker**: Apache Kafka topics
  - `order-events`: Order creation and status updates
  - `inventory-updates`: Stock changes
  - `payment-events`: Payment processing

- **Configuration**: Spring Cloud Config
  - Externalized configuration management
  - Environment-specific settings

## Data Flow

### Order Processing Flow

1. **User places order** via API Gateway
   - Request: `/order/**` endpoints
   - Validation: OrderService validates and persists

2. **Inventory update** triggered asynchronously
   - Kafka event: `order-events` topic
   - Consumer: InventoryService updates stock

3. **Payment processing**
   - Kafka event: `order-events` topic
   - Consumer: PaymentService processes payment

4. **Notifications sent**
   - Kafka event: `payment-events` topic
   - Consumer: NotificationService sends notifications

## Abstractions

### Service Interfaces

- **ProductService**: `product-service/src/main/java/com/msb/ecom/product_service/service/ProductService.java`
  - `ProductRequest` → `ProductResponse`
  - CRUD operations for products

- **OrderService**: `order-service/src/main/java/com/msb/ecom/order_service/service/OrderService.java`
  - `OrderRequest` → `OrderResponse`
  - Order lifecycle management

- **AuthService**: `auth-service/src/main/java/com/msb/ecom/auth_service/service/AuthService.java`
  - `LoginRequest`, `SignupRequest`, `UserResponse`
  - Authentication and user management

### Data Transfer Objects

- **DTOs**: Used for API communication
  - Request/Response patterns
  - Validation annotations
  - JSON serialization

## Entry Points

### API Gateway Routes

- `api-gateway/src/main/java/com/msb/ecom/api_gateway/routes/Routes.java`
  - `/product/**` → ProductService
  - `/order/**` → OrderService
  - `/inventory/**` → InventoryService
  - `/payment/**` → PaymentService
  - `/auth/**` → AuthService
  - `/notification/**` → NotificationService

### External Entry Points

- **OAuth2/OpenID Connect**: `/oauth2/authorize`, `/login/oauth2/code/*`
- **Webhooks**: External payment gateway callbacks
- **Event Subscriptions**: Kafka topic listeners

## Architecture Patterns

### Repository Pattern

- **Purpose**: Abstract data access
- **Implementation**: Spring Data JPA/Mongo repositories
- **Example**: `UserRepository extends JpaRepository<User, Long>`

### Service Layer Pattern

- **Purpose**: Business logic encapsulation
- **Implementation**: Service interfaces with implementations
- **Example**: `AuthService` interface with JWT-based auth

### Facade Pattern

- **Purpose**: Simplify external interface
- **Implementation**: API Gateway provides unified API
- **Example**: Single entry point for all services

### Observer Pattern

- **Purpose**: Event-driven communication
- **Implementation**: Kafka event consumers
- **Example**: InventoryService observes Order events

## Technology Stack Components

### Spring Boot Configuration

- **Parent POM**: `msb-ecom/pom.xml` (version 3.4.2)
- **Properties**: Java 21, Spring Cloud 2024.0.0
- **Plugins**: Maven compiler, Spring Boot plugin

### Maven Multi-Module Structure

- **Parent**: `msb-ecom/pom.xml`
- **Modules**: 7 services + frontend
- **Dependency Management**: Spring Cloud dependencies

### Security Configuration

- **OAuth2 Resource Server**: `api-gateway/src/main/java/com/msb/ecom/api_gateway/config/SecurityConfig.java`
- **Authentication Filter**: `SessionAuthenticationFilter.java`
- **Authorization**: Role-based access control

## Architecture Quality Attributes

### Scalability
- **Horizontal Scaling**: Each service can scale independently
- **Stateless Services**: Recommended for easy scaling
- **Load Balancing**: API Gateway distributes traffic

### Reliability
- **Circuit Breaker**: Resilience4j prevents cascading failures
- **Retry Mechanisms**: Exponential backoff for transient failures
- **Timeouts**: Configured timeouts for all integrations

### Maintainability
- **Separation of Concerns**: Clear layer boundaries
- **Single Responsibility**: Each service has one purpose
- **Testability**: Isolated services enable unit testing

### Observability
- **Distributed Tracing**: Spring Cloud Sleuth integration
- **Metrics**: Prometheus actuator endpoints
- **Logging**: Structured logging with Logstash

## Architecture Decision Log

### Decision 1: Microservices vs Monolith
**Choice**: Microservices
**Reasoning**: Independent scaling, technology diversity, fault isolation

### Decision 2: Kafka vs MessageQueue
**Choice**: Apache Kafka
**Reasoning**: High throughput, durability, stream processing capabilities

### Decision 3: JWT vs Session Tokens
**Choice**: JWT
**Reasoning**: Stateless authentication, distributed system compatibility

### Decision 4: MongoDB vs Relational DB
**Choice**: MongoDB for product/inventory, PostgreSQL for auth/orders
**Reasoning**: Flexible schema for products, ACID compliance for transactions

## Architecture Best Practices

1. **API Design**: RESTful APIs with OpenAPI/Swagger
2. **Error Handling**: Centralized exception handling
3. **Configuration**: Externalized configuration management
4. **Security**: Zero-trust network architecture
5. **Testing**: Contract testing for integrations
6. **Monitoring**: Health checks and metrics collection

## Future Architecture Considerations

1. **Service Mesh**: Istio or Linkerd for advanced traffic management
2. **Serverless**: AWS Lambda for event processing
3. **GraphQL**: For complex queries and reduced payload
4. **Event Sourcing**: For audit trails and replay capabilities
5. **CQRS**: Separate read and write operations

## Architecture Dependencies

### Spring Cloud Dependencies
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-dependencies</artifactId>
    <version>2024.0.0</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

### Key Architecture Components

| Component | Responsibility | Location |
|-----------|----------------|----------|
| API Gateway | Routing and security | `api-gateway/` |
| Auth Service | Authentication/Authorization | `auth-service/` |
| Message Broker | Event streaming | Kafka brokers |
| Database | Data persistence | Per-service databases |
| Configuration | External settings | Spring Cloud Config |
