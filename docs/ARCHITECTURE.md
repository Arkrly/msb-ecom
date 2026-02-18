# Architecture Overview

MSB E-Commerce employs a microservices architecture pattern to ensure scalability, maintainability, and resilience.

## System Diagram

```mermaid
graph TD
    Client[Client Browser/Mobile] -->|HTTPS| Gateway[API Gateway (Network Layout)]

    subgraph "Infrastructure"
        Gateway -->|Route| Auth[Auth Service]
        Gateway -->|Route| Product[Product Service]
        Gateway -->|Route| Order[Order Service]
        Gateway -->|Route| Inventory[Inventory Service]
        Gateway -->|Route| Payment[Payment Service]

        Order -->|Event| Kafka[Kafka Broker]
        Kafka -->|Consume| Inventory
        Kafka -->|Consume| Notification[Notification Service]
    end

    subgraph "Data Persistence"
        Auth --> PostgresAuth[(PostgreSQL Auth)]
        Product --> MongoProduct[(MongoDB Product)]
        Order --> MySQLOrder[(MySQL Order)]
        Inventory --> MySQLInventory[(MySQL Inventory)]
        Payment --> MySQLPayment[(MySQL Payment)]
    end

    subgraph "Identity Provider"
        Auth --> Keycloak[Keycloak]
        Keycloak --> PostgresKeycloak[(PostgreSQL Keycloak)]
    end
```

## Service Responsibilities

### API Gateway (`api-gateway`)

- **Routing**: Central entry point using Spring Cloud Gateway MVC.
- **Resilience**: Circuit Breaker implementation using Resilience4j.
- **Security**: Validates JWT tokens via Keycloak as Resource Server.

### Auth Service (`auth-service`)

- **Authentication**: Handles user registration and login.
- **Identity Provider**: Interfaces with Keycloak.

### Product Service (`product-service`)

- **Catalog**: Manages product listings, categories, and attributes.
- **Storage**: Uses MongoDB for flexible schema data.

### Order Service (`order-service`)

- **Order Lifecycle**: Creates, updates, and tracks orders.
- **Events**: Publishes `OrderPlacedEvent` to Kafka.

### Inventory Service (`inventory-service`)

- **Stock Management**: Tracks product quantities.
- **Reservation**: Listens to order events to reserve stock.

### Payment Service (`payment-service`)

- **Processing**: Simulates payment transactions.
- **Payment Gateway Integration**: (Mock/Stripe placeholder).

### Notification Service (`notification-service`)

- **Communication**: Sends emails/SMS upon order updates.
- **Integration**: Consumes Kafka events.

## Communication Patterns

- **Synchronous**: REST APIs for direct user interactions (Product viewing, Cart checkout).
- **Asynchronous**: Kafka for decoupled events (Order placement -> Inventory updates -> Notification).
