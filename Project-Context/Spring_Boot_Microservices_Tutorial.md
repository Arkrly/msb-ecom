# Spring Boot Microservices Tutorial

## Part 1

Source: https://programmingtechie.com/articles/spring-boot-microservices-tutorial

### Introduction

In this Spring Boot Microservices Tutorial series, you will learn how to develop applications with Microservices Architecture using Spring Boot and Spring Cloud and deploy them using Docker and Kubernetes.
We will cover several concepts and Microservices Architectural Patterns as part of this tutorial series.

### Application Overview

We will be building a simple e-commerce application where customers can order products. Our application contains the following services:

- Product Service
- Order Service
- Inventory Service
- Notification Service

## Creating our First Microservice: Product Service

Let's start creating our first microservice (Product Service). As discussed before, we will keep this service simple and only include the most important features.
We are going to expose a REST API endpoint that will CREATE and READ products.

Dependencies:

- Lombok
- Spring Web
- Test Containers
- Spring Data MongoDB
- Java 21
- Maven

### Docker Compose for MongoDB

```yaml
version: "4"
services:
  mongo:
    image: mongo:7.0.5
    container_name: mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: product-service
    volumes:
      - ./docker/mongodb/data:/data/db
```

Application Properties:

```properties
spring.data.mongodb.uri=mongodb://root:password@localhost:27017/product-service?authSource=admin
```

### Product Service Implementation

**Product.java**

```java
package com.programmingtechie.productservice.model;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;

@Document(value = "product")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class Product {
    @Id
    private String id;
    private String name;
    private String description;
    private BigDecimal price;
}
```

**ProductRepository.java**

```java
package com.programming.techie.productservice.repository;
import com.programming.techie.productservice.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface ProductRepository extends MongoRepository<Product, String> { }
```

**ProductService.java**

```java
package com.programmingtechie.productservice.service;
import com.programmingtechie.productservice.dto.ProductRequest;
import com.programmingtechie.productservice.dto.ProductResponse;
import com.programmingtechie.productservice.model.Product;
import com.programmingtechie.productservice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    private final ProductRepository productRepository;

    public void createProduct(ProductRequest productRequest) {
        Product product = Product.builder()
                .name(productRequest.name())
                .description(productRequest.description())
                .price(productRequest.price())
                .build();
        productRepository.save(product);
        log.info("Product {} is saved", product.getId());
    }

    public List<ProductResponse> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return products.stream().map(this::mapToProductResponse).toList();
    }

    private ProductResponse mapToProductResponse(Product product) {
        return new ProductResponse(product.getId(), product.getName(), product.getDescription(), product.getPrice());
    }
}
```

**ProductController.java**

```java
package com.programmingtechie.productservice.controller;
import com.programmingtechie.productservice.dto.ProductRequest;
import com.programmingtechie.productservice.dto.ProductResponse;
import com.programmingtechie.productservice.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/product")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createProduct(@RequestBody ProductRequest productRequest) {
        productService.createProduct(productRequest);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<ProductResponse> getAllProducts() {
        return productService.getAllProducts();
    }
}
```

**DTOs**

```java
public record ProductRequest(String name, String description, BigDecimal price) { }
public record ProductResponse(String id, String name, String description, BigDecimal price) { }
```

### Integration Tests

Using Testcontainers for MongoDB.

**ProductServiceApplicationTests.java**

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductServiceApplicationTests {
    @ServiceConnection
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:7.0.7");
    @LocalServerPort
    private Integer port;

    @BeforeEach
    void setup() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
    }

    static { mongoDBContainer.start(); }

    @Test
    void shouldCreateProduct() throws Exception {
        ProductRequest productRequest = getProductRequest();
        RestAssured.given()
                .contentType("application/json")
                .body(productRequest)
                .when()
                .post("/api/product")
                .then()
                .statusCode(201)
                .body("id", Matchers.notNullValue())
                .body("name", Matchers.equalTo(productRequest.name()));
    }
}
```

## Order Service

Dependencies: Spring Web, Lombok, Spring Data JPA, MySQL Driver, Flyway Migration, Testcontainers.

**docker-compose.yml**

```yaml
services:
  mysql:
    image: mysql:8.3.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: mysql
    volumes:
      - ./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
      - ./docker/mysql/data:/var/lib/mysql
```

**application.properties**

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/order_service
spring.datasource.username=root
spring.jpa.hibernate.ddl-auto=none
```

**Flyway Script (V1\_\_init.sql)**

```sql
CREATE TABLE `t_orders` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `order_number` varchar(255) DEFAULT NULL,
    `sku_code` varchar(255),
    `price` decimal(19, 2),
    `quantity` int(11),
    PRIMARY KEY (`id`)
);
```

**OrderService.java**

```java
@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    public void placeOrder(OrderRequest orderRequest) {
        var order = mapToOrder(orderRequest);
        orderRepository.save(order);
    }
}
```

## Inventory Service

MySQL database, Flyway migrations.

**V1\_\_init.sql**

```sql
CREATE TABLE `t_inventory` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `sku_code` varchar(255) DEFAULT NULL,
    `quantity` int(11) DEFAULT NULL,
    PRIMARY KEY (`id`)
);
```

**InventoryService.java**

```java
@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    @Transactional(readOnly = true)
    public boolean isInStock(String skuCode, Integer quantity) {
        return inventoryRepository.existsBySkuCodeAndQuantityIsGreaterThanEqual(skuCode, quantity);
    }
}
```

**InventoryController.java**

```java
@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public boolean isInStock(@RequestParam String skuCode, @RequestParam Integer quantity) {
        return inventoryService.isInStock(skuCode, quantity);
    }
}
```

## Part 2: Synchronous Communication

Source: https://programmingtechie.com/articles/spring-boot-microservices-tutorial-part-2

### OpenFeign Setup

Add `spring-cloud-starter-openfeign` to Order Service.

**InventoryClient.java**

```java
@FeignClient(value = "inventory", url = "${inventory.url}")
public interface InventoryClient {
    @RequestMapping(method = RequestMethod.GET, value = "/api/inventory")
    boolean isInStock(@RequestParam String skuCode, @RequestParam Integer quantity);
}
```

**OrderService.java** with Feign Client:

```java
@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    public void placeOrder(OrderRequest orderRequest) {
        boolean inStock = inventoryClient.isInStock(orderRequest.skuCode(), orderRequest.quantity());
        if (inStock) {
            var order = mapToOrder(orderRequest);
            orderRepository.save(order);
        } else {
            throw new RuntimeException("Product with Skucode " + orderRequest.skuCode() + " is not in stock");
        }
    }
}
```

Enable Feign Clients in `OrderServiceApplication`:

```java
@SpringBootApplication
@EnableFeignClients
public class OrderServiceApplication { ... }
```

### Integration Tests with WireMock

Add `spring-cloud-starter-contract-stub-runner`.

**OrderServiceApplicationTests.java**

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWireMock(port = 0)
class OrderServiceApplicationTests {
    @Test
    void shouldSubmitOrder() {
        InventoryStubs.stubInventoryCall("iphone_15", 1);
        ...
    }
}
```

## Part 3: API Gateway

Source: https://programmingtechie.com/articles/spring-boot-microservices-tutorial-part-3

Using Spring Cloud Gateway MVC.

**pom.xml**
`spring-cloud-starter-gateway-mvc`

**Routes.java**

```java
@Configuration(proxyBeanMethods = false)
public class Routes {
    @Bean
    public RouterFunction<ServerResponse> productServiceRoute() {
        return route("product_service")
                .route(RequestPredicates.path("/api/product"), http("http://localhost:8080"))
                .build();
    }
    @Bean
    public RouterFunction<ServerResponse> orderServiceRoute() {
        return route("order_service")
                .route(RequestPredicates.path("/api/order"), http("http://localhost:8081"))
                .build();
    }
    @Bean
    public RouterFunction<ServerResponse> inventoryServiceRoute() {
        return route("inventory_service")
                .route(RequestPredicates.path("/api/inventory"), http("http://localhost:8082"))
                .build();
    }
}
```

## Part 4: Security with Keycloak

Source: https://programmingtechie.com/articles/spring-boot-microservices-tutorial-part-4

**docker-compose.yml**
Keycloak setup with MySQL.

**API Gateway Configuration**
Dependency: `spring-boot-starter-oauth2-resource-server`

`application.properties`:

```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8181/realms/spring-microservices-realm
```

**SecurityConfig.java**

```java
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity.authorizeHttpRequests(authorize -> authorize
                .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                .build();
    }
}
```

## Part 5: API Documentation

Source: https://programmingtechie.com/articles/spring-boot-microservices-tutorial-part-5

Using Springdoc OpenAPI.
Dependency: `springdoc-openapi-starter-webmvc-ui`

**OpenAPIConfig.java**

```java
@Configuration
public class OpenAPIConfig {
    @Bean
    public OpenAPI productServiceAPI() {
        return new OpenAPI()
                .info(new Info().title("Product Service API")
                .description("This is the REST API for Product Service")
                .version("v0.0.1")
                .license(new License().name("Apache 2.0")))
                .externalDocs(new ExternalDocumentation()
                .description("Wiki Documentation")
                .url("https://product-service-dummy-url.com/docs"));
    }
}
```

**Aggregating Documentation in Gateway**
`springdoc-openapi-starter-webmvc-ui` in Gateway.

`application.properties`:

```properties
springdoc.swagger-ui.urls[0].name=Product Service
springdoc.swagger-ui.urls[0].url=/aggregate/product-service/v3/api-docs
...
```

**Routes.java Updates**
Add routes for `/aggregate/...` to forward to `/api-docs`.

## Part 6: Circuit Breaker

Source: https://programmingtechie.com/articles/spring-boot-microservices-tutorial-part-6

Using Resilience4j.

**API Gateway Circuit Breaker**
Dependency: `spring-cloud-starter-circuitbreaker-resilience4j`

**Routes.java Update**

```java
.filter(circuitBreaker("productServiceCircuitBreaker", URI.create("forward:/fallbackRoute")))
```

**Fallback Route**

```java
@Bean
public RouterFunction<ServerResponse> fallbackRoute() {
    return route("fallbackRoute")
            .GET("/fallbackRoute", request -> ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE).body("Service Unavailable"))
            .build();
}
```

**Resilience4j Configuration**
`application.properties`: `resilience4j.circuitbreaker.configs.default...`

**Order Service Circuit Breaker**
Use `@CircuitBreaker` and `@Retry` annotations on Feign Client methods.

```java
@GetExchange("/api/inventory")
@CircuitBreaker(name = "inventory", fallbackMethod = "fallbackMethod")
@Retry(name = "inventory")
boolean isInStock(@RequestParam String skuCode, @RequestParam Integer quantity);
```

**RestClientConfig.java**
Configure timeouts.

## Part 7: Frontend with Angular

Source: https://programmingtechie.com/articles/spring-boot-microservices-tutorial-part-7

**Project Setup**

- Angular project: `ng new microservices-shop-frontend`
- Tailwind CSS installed.
- Dependency: `angular-auth-oidc-client` for OAuth2.

**Security Configuration**

- `auth-config.ts`: Configures OIDC client with Keycloak (`http://localhost:8181/realms/spring-microservices-security-realm`).
- `Client ID`: `angular-client`.
- `auth.interceptor.ts`: Adds Bearer token to outgoing requests.

**Components**

- `HeaderComponent`: Requires login/logout logic using `OidcSecurityService`.
- `HomePageComponent`: Lists products, handles ordering.
- `AddProductComponent`: Form to add products.

**Services**

- `ProductService`: Calls `http://localhost:9000/api/product`.
- `OrderService`: Calls `http://localhost:9000/api/order`.

**Gateway CORS**
Update `SecurityConfig.java` in Gateway to allow `http://localhost:4200`.

## Part 8: Event-Driven Architecture with Kafka

Source: https://programmingtechie.com/articles/spring-boot-microservices-tutorial-part-8

**Docker Setup**

- Services: `zookeeper`, `broker` (Kafka), `schema-registry`, `kafka-ui`.
- Defined in `docker-compose.yml`.

**Order Service (Producer)**

- Dependencies: `spring-kafka`, `kafka-avro-serializer`.
- **Avro Schema**: `src/main/resources/avro/order-placed.avsc` defines `OrderPlacedEvent`.
- **Properties**: Configures Kafka producer and Schema Registry URL.
- **Service Logic**: Sends `OrderPlacedEvent` to `order-placed` topic after saving order.

**Notification Service (Consumer)**

- **New Service**: `notification-service`.
- Dependencies: `spring-kafka`, `spring-boot-starter-mail`.
- **Properties**: Configures Kafka consumer (group-id: `notificationService`) and Mailtrap settings.
- **Service Logic**: Listens to `order-placed` topic, deserializes event using Avro, and sends email notification.

```

```
