---
last_mapped_commit: HEAD
---

# Project Structure

**Analysis Date:** 2026-08-28

## Root Layout

```
msb-ecom/
├── pom.xml                    # Parent Maven POM (multi-module)
├── docker-compose.yml         # Infrastructure containers (databases, Kafka, Keycloak, ELK)
├── docker-compose.prod.yml    # Application service containers
├── run.sh                     # Single-script runner (local/docker/stop/status/logs)
├── .env.example               # Environment variable template
├── .env                       # Local environment overrides
├── README.md                  # Project documentation
├── CONTRIBUTING.md            # Contribution guidelines
├── LICENSE                    # MIT License
│
├── api-gateway/               # API Gateway service
├── auth-service/              # Authentication service
├── product-service/           # Product catalog service
├── order-service/             # Order management service
├── inventory-service/         # Inventory tracking service
├── payment-service/           # Payment processing service
├── notification-service/      # Email notification service (Kafka consumer)
├── frontend/                  # Angular 20 frontend application
│
├── .planning/                 # GSD planning documents
├── graphify-out/              # Codebase knowledge graph output
├── .agent/                    # Agent skills and configuration
├── .vscode/                   # VS Code settings
├── .github/                   # GitHub configuration
└── docs/                      # Additional documentation
```

## Backend Service Structure

Each Java service follows the standard Spring Boot Maven layout:

```
<service>/
├── pom.xml                    # Module POM (inherits from parent)
├── Dockerfile                 # Multi-stage Docker build
├── mvnw / mvnw.cmd           # Maven wrapper
├── .mvn/                      # Maven wrapper JAR
├── src/
│   ├── main/
│   │   ├── java/com/msb/ecom/<service_name>/
│   │   │   ├── <Service>Application.java    # @SpringBootApplication entry point
│   │   │   ├── config/                       # Configuration classes (SecurityConfig, etc.)
│   │   │   ├── controller/                   # REST controllers (@RestController)
│   │   │   ├── service/                      # Business logic (@Service)
│   │   │   ├── repository/                   # Data access (JPA/MongoDB repositories)
│   │   │   ├── model/                        # Domain entities (@Entity/@Document)
│   │   │   ├── dto/                          # Request/Response DTOs (Java records)
│   │   │   └── event/                        # Kafka event classes (notification-service only)
│   │   └── resources/
│   │       ├── application.properties        # Service configuration
│   │       └── db/migration/                 # Flyway SQL migrations (V1__init.sql)
│   └── test/
│       └── java/com/msb/ecom/<service_name>/
│           ├── <Service>ApplicationTests.java
│           ├── TestcontainersConfiguration.java  # (product-service)
│           └── Test<Service>Application.java     # (product-service)
└── target/                    # Build output (JARs, logs)
```

### Package Naming Convention
- Base package: `com.msb.ecom.<service_name>` (uses underscores, not dots)
- Examples: `com.msb.ecom.product_service`, `com.msb.ecom.order_service`

## Service Inventory

### API Gateway (`api-gateway/`)
```
api-gateway/src/main/java/com/msb/ecom/api_gateway/
├── ApiGatewayApplication.java
├── config/
│   └── SecurityConfig.java          # JWT validation, CORS, free paths
└── routes/
    └── Routes.java                  # Service routing with circuit breakers
```

### Auth Service (`auth-service/`)
```
auth-service/src/main/java/com/msb/ecom/auth_service/
├── AuthServiceApplication.java
├── config/
│   ├── SecurityConfig.java
│   └── SessionAuthenticationFilter.java
├── controller/
│   ├── AuthController.java
│   └── GlobalExceptionHandler.java
├── dto/
│   ├── LoginRequest.java
│   ├── SignupRequest.java
│   └── UserResponse.java
├── model/
│   └── User.java
├── repository/
│   └── UserRepository.java
└── service/
    ├── AuthService.java
    └── JwtService.java
```

### Product Service (`product-service/`)
```
product-service/src/main/java/com/msb/ecom/product_service/
├── ProductServiceApplication.java
├── controller/
│   └── ProductController.java
├── dto/
│   ├── ProductRequest.java
│   └── ProductResponse.java
├── model/
│   └── Product.java               # @Document (MongoDB)
├── repository/
│   └── ProductRepository.java     # MongoRepository
└── service/
    └── ProductService.java
```

### Order Service (`order-service/`)
```
order-service/src/main/java/com/msb/ecom/order_service/
├── OrderServiceApplication.java
├── controller/
│   └── OrderController.java
├── dto/
│   ├── OrderRequest.java
│   └── OrderResponse.java
├── model/
│   └── Order.java                 # @Entity (JPA)
├── repository/
│   └── OrderRepository.java       # JpaRepository
└── service/
    └── OrderService.java
```

### Inventory Service (`inventory-service/`)
```
inventory-service/src/main/java/com/msb/ecom/inventory_service/
├── InventoryServiceApplication.java
├── controller/
│   └── InventoryController.java
├── model/
│   └── Inventory.java
├── repository/
│   └── InventoryRepository.java
└── service/
    └── InventoryService.java
```

### Payment Service (`payment-service/`)
```
payment-service/src/main/java/com/msb/ecom/payment_service/
├── PaymentServiceApplication.java
├── controller/
│   └── PaymentController.java
├── dto/
│   ├── PaymentRequest.java
│   └── PaymentResponse.java
├── model/
│   ├── Payment.java
│   └── PaymentStatus.java         # Enum: COMPLETED, REFUNDED
├── repository/
│   └── PaymentRepository.java
└── service/
    └── PaymentService.java
```

### Notification Service (`notification-service/`)
```
notification-service/src/main/java/com/msb/ecom/notification_service/
├── NotificationServiceApplication.java
├── event/
│   └── OrderPlacedEvent.java      # Kafka event DTO
└── service/
    └── NotificationService.java   # @KafkaListener + email sending
```

## Frontend Structure (`frontend/`)

```
frontend/
├── angular.json
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.spec.json
├── Dockerfile
├── public/                        # Static assets
└── src/
    ├── index.html
    ├── main.ts                    # Bootstrap
    ├── main.server.ts             # SSR bootstrap
    ├── server.ts                  # Express SSR server
    ├── styles.css                 # Global styles (TailwindCSS)
    ├── environments/              # Environment configs
    └── app/
        ├── app.ts                 # Root component
        ├── app.html               # Root template
        ├── app.routes.ts          # Route definitions
        ├── app.routes.server.ts   # SSR routes
        ├── app.config.ts          # App config
        ├── app.config.server.ts   # SSR config
        ├── core/                  # Singleton services & guards
        │   ├── guards/
        │   │   └── auth.guard.ts
        │   ├── interceptors/
        │   │   └── auth.interceptor.ts
        │   ├── models/
        │   │   ├── auth.model.ts
        │   │   ├── order.model.ts
        │   │   ├── payment.model.ts
        │   │   └── product.model.ts
        │   └── services/
        │       ├── auth.service.ts
        │       ├── inventory.service.ts
        │       ├── order.service.ts
        │       ├── payment.service.ts
        │       ├── product.service.ts
        │       └── toast.service.ts
        ├── features/              # Feature modules (lazy-loaded)
        │   ├── auth/
        │   │   └── login.component.ts
        │   ├── dashboard/
        │   │   └── dashboard.component.ts
        │   ├── inventory/
        │   │   └── inventory-check.component.ts
        │   ├── orders/
        │   │   ├── order-list.component.ts
        │   │   └── order-place.component.ts
        │   ├── payments/
        │   │   ├── payment-list.component.ts
        │   │   └── payment-process.component.ts
        │   └── products/
        │       ├── product-list.component.ts
        │       └── product-create.component.ts
        ├── layout/                # Shell layout
        │   ├── navbar/
        │   │   └── navbar.component.ts
        │   ├── shell/
        │   │   └── shell.component.ts
        │   └── sidebar/
        │       └── sidebar.component.ts
        └── shared/                # Shared components
            └── components/
                └── toast/
                    └── toast-container.component.ts
```

### Frontend Route Structure
```
/login          → LoginComponent (public)
/               → ShellComponent (auth-guarded)
  /dashboard    → DashboardComponent
  /products     → ProductListComponent
  /products/new → ProductCreateComponent
  /orders       → OrderListComponent
  /orders/new   → OrderPlaceComponent
  /payments     → PaymentListComponent
  /payments/new → PaymentProcessComponent
  /inventory    → InventoryCheckComponent
/**             → redirects to /login
```

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Java packages | `com.msb.ecom.<service_name>` | `com.msb.ecom.order_service` |
| DB tables | `t_<entity>` | `t_orders`, `t_payments`, `t_users` |
| MongoDB documents | lowercase plural | `product` |
| Kafka topics | kebab-case | `order-placed` |
| Flyway migrations | `V{N}__{description}.sql` | `V1__init.sql` |
| Angular components | kebab-case | `product-list.component.ts` |
| Angular services | kebab-case | `auth.service.ts` |
| DTOs (Java) | Records | `OrderRequest`, `ProductResponse` |

---

*Codebase structure analysis: 2026-08-28*
