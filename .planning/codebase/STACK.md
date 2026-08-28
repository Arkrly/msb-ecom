---
last_mapped_commit: HEAD
---

# Technology Stack

**Analysis Date:** 2026-08-28

## Backend

### Language & Runtime
- **Java 21** (LTS) — required by all backend services
- **Maven** multi-module build with parent POM at root `pom.xml`
- **Maven Wrapper** (`mvnw`) bundled in each service module

### Framework
- **Spring Boot 3.4.2** — core framework for all services
- **Spring Cloud 2024.0.0** — cloud-native extensions (gateway, circuit breaker)
- **Spring Cloud Gateway MVC** — API gateway (not the older reactive gateway)

### Key Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| Spring Data MongoDB | (via Boot starter) | Product Service data access |
| Spring Data JPA + Hibernate | (via Boot starter) | Order, Inventory, Payment, Auth data access |
| Spring Security | (via Boot starter) | Auth service security |
| Spring Kafka | (via Boot starter) | Notification Service Kafka consumer |
| Spring Mail | (via Boot starter) | Notification Service email sending |
| Spring Validation | (via Boot starter) | Bean validation (`@Valid`, `@NotBlank`, etc.) |
| Lombok | 1.18.42 | Boilerplate reduction (`@Data`, `@Builder`, `@RequiredArgsConstructor`) |
| JJWT | 0.11.5 | JWT token generation/validation (auth-service) |
| Flyway | (via Boot starter) | Database schema migrations |
| Resilience4j | (via Spring Cloud) | Circuit breaker, retry, timeout |
| Logstash Logback Encoder | 7.4 | Structured JSON logging |
| Nimbus JOSE+JWT | (via Boot starter) | JWT decoding in API Gateway |

### Build & Packaging
- **Spring Boot Maven Plugin** — executable JARs for each service (parent POM skips this)
- **Multi-stage Docker builds** — `eclipse-temurin:21-jdk` (build) → `eclipse-temurin:21-jre-alpine` (runtime)
- All Dockerfiles follow identical pattern: dependency caching → package → runtime image with non-root user

## Frontend

### Framework & Language
- **Angular 20.1.x** — SPA framework with SSR support
- **TypeScript 5.8.2**
- **Angular SSR** (`@angular/ssr` + Express 5.1) — server-side rendering capability

### Styling
- **TailwindCSS 3.4.17** — utility-first CSS
- **PostCSS 8.5.6** + **Autoprefixer** — CSS processing

### State Management
- Angular Signals (native) — no external state library

### Testing
- **Jasmine 5.8** + **Karma 6.4** — unit testing
- **Karma Chrome Launcher** — headless browser testing

### Build
- **Angular CLI 20.1.3** (`@angular/build` builder)
- **Prettier** configured for Angular HTML files

## Infrastructure & Data Stores

### Databases
| Database | Version | Services | Purpose |
|----------|---------|----------|---------|
| MongoDB | 7.0.5 | Product Service | Product catalog (document store) |
| MySQL | 8.3.0 | Order, Inventory, Payment Services | Relational data |
| PostgreSQL | 15 | Auth Service, Keycloak | User auth, identity persistence |

### Messaging
| Component | Version | Purpose |
|-----------|---------|---------|
| Apache Kafka | Confluent 7.5.0 | Event-driven async communication |
| Zookeeper | Confluent 7.5.0 | Kafka coordination |
| Schema Registry | Confluent 7.5.0 | Schema management (configured, not actively used) |

### Identity & Auth
| Component | Version | Purpose |
|-----------|---------|---------|
| Keycloak | 24.0.1 | OAuth2/OIDC identity provider (configured, not fully integrated) |
| Self-managed JWT | — | Auth service issues HS256 JWTs via JJWT |

### Observability
| Component | Version | Purpose |
|-----------|---------|---------|
| Elasticsearch | 8.15.0 | Log storage |
| Logstash | 8.15.0 | Log processing pipeline |
| Kibana | 8.15.0 | Log visualization |
| Kafka UI | latest | Kafka topic inspection |

### Email
| Component | Version | Purpose |
|-----------|---------|---------|
| Mailpit | latest | Local SMTP server for dev/testing |

## Containerization
- **Docker** + **Docker Compose 3.8**
- Two compose files: `docker-compose.yml` (infrastructure) + `docker-compose.prod.yml` (application services)
- Named volumes for data persistence
- All ports bound to `127.0.0.1` (localhost-only) in compose

## Development Tools
- `run.sh` — single script to run entire stack (`local` / `docker` / `stop` / `status` / `logs`)
- `./run.sh local` — infra in Docker + Java services + frontend natively
- `./run.sh docker` — everything containerized
- Spring Boot DevTools not present (not in dependencies)
- No IDE-specific configuration committed (`.vscode` exists but minimal)

---

*Codebase stack analysis: 2026-08-28*
