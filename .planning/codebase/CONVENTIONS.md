---
last_mapped_commit: HEAD
---

# Coding Conventions

**Analysis Date:** 2026-08-28

## Java Conventions

### Boilerplate Reduction — Lombok
All services use Lombok extensively. Standard annotations:

```java
@Data           // Getters, setters, toString, equals, hashCode
@Builder        // Builder pattern
@AllArgsConstructor
@NoArgsConstructor
@RequiredArgsConstructor  // Constructor injection (used in @Service/@Controller)
@Slf4j          // Logger field
```

**Pattern:** Services and controllers use `@RequiredArgsConstructor` for constructor injection (final fields):

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;  // injected via constructor
}
```

### DTOs — Java Records
Request and response DTOs are **immutable Java records** (not classes):

```java
// Example: order-service
public record OrderRequest(
    @NotBlank String skuCode,
    @NotNull @Min(1) BigDecimal price,
    @NotNull @Min(1) Integer quantity
) {}

public record OrderResponse(
    Long id, String orderNumber, String skuCode,
    BigDecimal price, Integer quantity
) {}
```

**Convention:** Records live in `dto/` package, one file per DTO.

### Entity/Model Pattern

**JPA Entities** (Order, Inventory, Payment, Auth):
```java
@Entity
@Table(name = "t_orders")  // Table prefix: t_
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // fields...
}
```

**MongoDB Documents** (Product):
```java
@Document(value = "product")
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class Product {
    @Id
    private String id;  // String for MongoDB
    // fields...
}
```

### Service Layer
- Annotated with `@Service`, `@RequiredArgsConstructor`, `@Slf4j`
- Write operations wrapped in `@Transactional` (class-level or method-level)
- Read-only operations use `@Transactional(readOnly = true)`
- Mapping from entity to DTO done via private `mapToXxxResponse()` methods (not MapStruct)

### Controller Layer
- `@RestController` + `@RequestMapping("/api/<domain>")`
- `@RequiredArgsConstructor` for dependency injection
- `@ResponseStatus` on each method for HTTP status codes
- `@Valid` on `@RequestBody` for validation
- Return DTOs, not entities

### Error Handling
- Auth Service has `GlobalExceptionHandler` with `@RestControllerAdvice`
- Other services rely on Spring Boot's default error handling
- Business exceptions thrown as `IllegalArgumentException` or `RuntimeException`

### Configuration
- **Properties files** (not YAML) — `application.properties`
- Environment variable overrides with defaults: `${VAR_NAME:default_value}`
- Service URLs injected via `@Value` in gateway routes

## Frontend Conventions

### Angular Architecture
- **Standalone components** (no NgModules) — Angular 20 style
- **Lazy loading** via `loadComponent` in routes
- **Feature modules** organized by domain in `features/`
- **Core module** for singleton services, guards, interceptors
- **Layout module** for shell, navbar, sidebar

### Component Pattern
- Single-file components (`.component.ts` contains template, styles, logic)
- Inline templates and styles (no separate `.html`/`.css` files)
- Signal-based state management (no RxJS-heavy patterns)

### Service Pattern
- Angular services in `core/services/`
- One service per backend domain (auth, product, order, payment, inventory)
- HTTP client calls to API Gateway

### Authentication Flow
- `auth.guard.ts` — route protection
- `auth.interceptor.ts` — attaches JWT to outgoing requests
- Login redirects to dashboard
- Unauthenticated access redirects to login

## Database Conventions

### Table Naming
- All tables prefixed with `t_`: `t_orders`, `t_payments`, `t_users`, `t_inventory`
- MongoDB documents use lowercase singular: `product`

### Migrations
- Flyway for all relational databases
- Naming: `V{N}__{description}.sql` (e.g., `V1__init.sql`, `V1__init_users.sql`)
- No `ddl-auto=update` — schema managed exclusively by Flyway
- Seed data included in migrations (inventory service has test data)

### Column Types
- IDs: `BIGINT AUTO_INCREMENT` (MySQL) or `BIGSERIAL` (PostgreSQL)
- Money: `DECIMAL(19, 2)`
- Timestamps: `TIMESTAMP` / `DATETIME` with defaults
- Status: `VARCHAR(50)` (string enum pattern, e.g., `PaymentStatus`)

## API Conventions

### REST Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/product` | Create product |
| `GET` | `/api/product` | List all products |
| `POST` | `/api/order` | Place order |
| `GET` | `/api/order` | List all orders |
| `GET` | `/api/inventory/check` | Check stock |
| `POST` | `/api/payment` | Process payment |
| `GET` | `/api/payment` | List payments |
| `POST` | `/auth/signup` | Register user |
| `POST` | `/auth/login` | Authenticate user |

### Response Format
- All endpoints return JSON
- `201 Created` for successful POST operations
- `200 OK` for successful GET operations
- Error responses use Spring Boot's default `{"timestamp", "status", "error", "path"}` format

### Validation
- Jakarta Bean Validation (`@NotBlank`, `@NotNull`, `@Min`, `@Email`)
- Applied on DTO record components
- Triggered by `@Valid` on controller method parameters

## Logging Conventions

- **SLF4J** via Lombok `@Slf4j`
- Log key business events: user registration, order placement, payment processing
- Log levels: `DEBUG` for dev (auth-service, gateway), default for others
- Logstash encoder configured for structured JSON logging (parent POM dependency)
- ELK stack available but not yet connected to application logs

## Docker Conventions

- **Multi-stage builds:** JDK for compilation → JRE-alpine for runtime
- **Non-root user:** All containers create `spring:spring` user
- **Health checks:** `java -version` as basic liveness check
- **Port exposure:** Matches service port (e.g., 8080, 8081, 9000)
- **No secrets in images:** All sensitive values passed via environment variables

---

*Codebase conventions analysis: 2026-08-28*
