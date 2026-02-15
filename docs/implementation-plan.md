# Microservices E-commerce Setup Plan

This plan outlines the creation of a microservices-based e-commerce system using Spring Boot 3, as per the gathered tutorial context.

## User Review Required

> [!IMPORTANT]
> This plan involves creating multiple new projects and a complex Docker environment. Ensure you have Docker and Java 21+ installed.
> confirm if you want all services to be in a single monorepo (e.g., maven modules) or separate independent projects. I will assume a monorepo structure with a parent pom for easier management unless specified otherwise.

## Proposed Changes

I will create a root project `msb-ecom` with the following modules:

### [Root] `msb-ecom`

#### [NEW] `pom.xml` (Parent POM)

- Manages common dependencies (Spring Boot 3.x, Spring Cloud, Testcontainers).
- Modules: `product-service`, `order-service`, `inventory-service`, `api-gateway`, `notification-service`.

### [Component] `product-service`

- **Database**: MongoDB (Docker: `mongo:7.0.7`)
- **Port**: 8080

#### [NEW] `src/main/java/.../ProductServiceApplication.java`

#### [NEW] `src/main/java/.../controller/ProductController.java`

- `POST /api/product`: Create product
- `GET /api/product`: List products

#### [NEW] `src/main/java/.../service/ProductService.java`

#### [NEW] `src/main/java/.../repository/ProductRepository.java`

#### [NEW] `src/main/java/.../model/Product.java`

#### [NEW] `src/test/.../ProductServiceApplicationTests.java` (Testcontainers)

### [Component] `order-service`

- **Database**: MySQL (Docker: `mysql:8.3.0`)
- **Migration**: Flyway
- **Port**: 8081
- **Communication**: OpenFeign (to Inventory), Kafka (to Notification)

#### [NEW] `src/main/java/.../OrderServiceApplication.java`

#### [NEW] `src/main/java/.../controller/OrderController.java`

- `POST /api/order`: Place order

#### [NEW] `src/main/java/.../service/OrderService.java`

- Checks inventory via `InventoryClient`.
- Saves order.
- Sends `OrderPlacedEvent` to Kafka.

#### [NEW] `src/main/java/.../client/InventoryClient.java` (Feign)

#### [NEW] `src/main/resources/db/migration/V1__init.sql`

- Create `t_orders` table.

#### [NEW] `src/main/resources/avro/order-placed.avsc`

- Avro schema for Kafka event.

### [Component] `inventory-service`

- **Database**: MySQL (Docker: `mysql:8.3.0`)
- **Migration**: Flyway
- **Port**: 8082

#### [NEW] `src/main/java/.../InventoryServiceApplication.java`

#### [NEW] `src/main/java/.../controller/InventoryController.java`

- `GET /api/inventory`: Check stock

#### [NEW] `src/main/resources/db/migration/V1__init.sql`

- Create `t_inventory` table.

### [Component] `api-gateway`

- **Type**: Spring Cloud Gateway MVC
- **Port**: 9000
- **Security**: Keycloak (OAuth2 Resource Server)

#### [NEW] `src/main/java/.../ApiGatewayApplication.java`

#### [NEW] `src/main/java/.../config/SecurityConfig.java`

#### [NEW] `src/main/java/.../routes/Routes.java`

- Routes for Product, Order, Inventory, Swagger Aggregation.

### [Component] `notification-service`

- **Port**: 8083 (or generic)
- **Communication**: Kafka Consumer

#### [NEW] `src/main/java/.../NotificationServiceApplication.java`

#### [NEW] `src/main/java/.../service/NotificationService.java`

- Listens to `order-placed`.
- Sends email (Log/Mailtrap).

### [Infrastructure] Docker

#### [NEW] `docker-compose.yml`

- **Services**:
  - `mongo` (Product DB)
  - `mysql` (Order & Inventory DBs)
  - `zookeeper`, `broker`, `schema-registry` (Kafka)
  - `keycloak` (Identity Provider)
  - `mailtrap` (Optional/Mock)
  - `kafka-ui` (Optional)

## Verification Plan

### Automated Tests

- **Run Integration Tests**: `mvn verify` in the root directory.
  - `product-service`: Verifies MongoDB interaction.
  - `order-service`: Verifies MySQL interaction, Mock Inventory (Wiremock), Kafka Producer (EmbeddedKafka).
  - `inventory-service`: Verifies MySQL interaction.

### Manual Verification

1.  **Start Infrastructure**: `docker-compose up -d`
2.  **Start Services**: Run all Spring Boot apps.
3.  **Test via Gateway**:
    - **Create Product**: `POST http://localhost:9000/api/product` (Auth required? Yes, setup Keycloak user).
    - **Check Inventory**: `GET http://localhost:9000/api/inventory?skuCode=iphone_15&quantity=1`
    - **Place Order**: `POST http://localhost:9000/api/order`
4.  **Verify Event**: Check `notification-service` logs for email sent message.
