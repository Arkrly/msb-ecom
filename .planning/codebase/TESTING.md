---
last_mapped_commit: HEAD
---

# Testing

**Analysis Date:** 2026-08-28

## Overview

Testing infrastructure is **minimal and scaffolded** — most services have only a default Spring Boot context-load test. The product-service has the most developed test setup with Testcontainers configuration.

## Test Framework Stack

| Framework | Version | Purpose |
|-----------|---------|---------|
| JUnit 5 | (via `spring-boot-starter-test`) | Test runner |
| Spring Boot Test | (via `spring-boot-starter-test`) | Context loading, `@SpringBootTest` |
| Testcontainers | 1.21.4 | Integration tests with real databases |
| Spring Boot Testcontainers | (via `spring-boot-testcontainers`) | `@ServiceConnection` auto-config |
| REST Assured | (via dependency) | HTTP API testing |
| Spring Security Test | (auth-service only) | Security testing |
| Spring Kafka Test | (notification-service only) | Kafka consumer testing |
| Jasmine + Karma | (frontend) | Angular unit testing |

## Test Files

### Backend (9 test files total)

| Service | Test File | Type |
|---------|-----------|------|
| api-gateway | `ApiGatewayApplicationTests.java` | Context load |
| auth-service | `AuthServiceApplicationTests.java` | Context load |
| inventory-service | `InventoryServiceApplicationTests.java` | Context load |
| notification-service | `NotificationServiceApplicationTests.java` | Context load |
| order-service | `OrderServiceApplicationTests.java` | Context load |
| payment-service | `PaymentServiceApplicationTests.java` | Context load |
| product-service | `ProductServiceApplicationTests.java` | Context load |
| product-service | `TestProductServiceApplication.java` | Test bootstrap |
| product-service | `TestcontainersConfiguration.java` | Testcontainers setup |

### Frontend (1 test file)
- `frontend/src/app/app.spec.ts` — root component spec

## Testcontainers Configuration

The product-service has the most complete Testcontainers setup:

```java
// product-service/src/test/java/.../TestcontainersConfiguration.java
@TestConfiguration(proxyBeanMethods = false)
class TestcontainersConfiguration {
    @Bean
    @ServiceConnection
    MongoDBContainer mongoDbContainer() {
        return new MongoDBContainer(DockerImageName.parse("mongo:latest"));
    }
}

// product-service/src/test/java/.../TestProductServiceApplication.java
public class TestProductServiceApplication {
    public static void main(String[] args) {
        SpringApplication.from(ProductServiceApplication::main)
            .with(TestcontainersConfiguration.class)
            .run(args);
    }
}
```

### Available Testcontainers by Service
| Service | Testcontainers Dependency | Container |
|---------|--------------------------|-----------|
| product-service | `testcontainers:mongodb` | MongoDB |
| order-service | `testcontainers:mysql` | MySQL |
| inventory-service | `testcontainers:mysql` | MySQL |
| payment-service | `testcontainers:mysql` | MySQL |
| auth-service | `testcontainers:postgresql` | PostgreSQL |
| notification-service | `testcontainers:kafka` | Kafka |

**Note:** Dependencies are declared in POMs but no integration test classes use them yet (only context-load tests exist).

## Test Patterns

### Context Load Tests
All services have a minimal smoke test:
```java
@SpringBootTest
class ServiceApplicationTests {
    @Test
    void contextLoads() {
    }
}
```

### REST Assured
Available in product, order, inventory, payment services and api-gateway (declared as test dependency) but not yet used in any test class.

### Security Tests
- `spring-security-test` available in auth-service
- Not yet used in test implementations

### Kafka Tests
- `spring-kafka-test` + `testcontainers:kafka` available in notification-service
- Not yet used in test implementations

## Frontend Testing

- **Framework:** Jasmine 5.8 + Karma 6.4
- **Browser:** Chrome (via `karma-chrome-launcher`)
- **Coverage:** `karma-coverage`
- **Reporter:** `karma-jasmine-html-reporter`
- **Config:** `tsconfig.spec.json` for TypeScript test compilation
- **Command:** `ng test`

## Test Execution

### Maven
```bash
# Run all tests (from root)
mvn test

# Run tests for a specific service
cd order-service && mvn test

# Skip tests during build (used in run.sh)
mvn clean package -DskipTests
```

### Frontend
```bash
cd frontend && npm test
```

## Test Configuration

### Notification Service
- Surefire plugin configured with `-Dnet.bytebuddy.experimental=true` (for Kafka consumer mocking)

### API Gateway
- Test properties: `api-gateway/src/test/resources/application-test.properties`

## Coverage Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| No integration tests | Cannot verify DB interactions | High |
| No API endpoint tests | Cannot verify REST contract | High |
| No Kafka consumer tests | Cannot verify event processing | Medium |
| No auth flow tests | Cannot verify login/signup security | High |
| No frontend component tests | Cannot verify UI behavior | Medium |
| No E2E tests | Cannot verify full user journeys | Medium |

---

*Codebase testing analysis: 2026-08-28*
