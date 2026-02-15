# Services — Test & Fix Walkthrough

## Product Service ✅ 3/3

**Issues Fixed:** `createProduct` void→response, duplicate `contoller/` dir, Lombok JDK 25 upgrade, Testcontainers Docker API, Spring Boot 3.3→3.4.2

| Test                                       | Status |
| ------------------------------------------ | ------ |
| `shouldCreateProduct`                      | ✅     |
| `shouldGetAllProducts`                     | ✅     |
| `shouldReturnEmptyListWhenNoProductsExist` | ✅     |

---

## Order Service ✅ 3/3

**Implementation:** `Order` entity (JPA, `t_orders`), MySQL 8.3 + Flyway, `POST/GET /api/order`
**Issues Fixed:** Duplicate `OrderserviceApplication` class

| Test                                        | Status |
| ------------------------------------------- | ------ |
| `shouldPlaceOrder`                          | ✅     |
| `shouldGetAllOrders`                        | ✅     |
| `shouldReturnOrderWithGeneratedOrderNumber` | ✅     |

---

## Inventory Service ✅ 5/5

**Implementation:** `Inventory` entity (JPA, `t_inventory`), MySQL 8.3 + Flyway (seed data), `GET /api/inventory → boolean`
**Issues Fixed:** None — clean first-try pass

| Test                                         | Status |
| -------------------------------------------- | ------ |
| `shouldReturnTrueWhenProductIsInStock`       | ✅     |
| `shouldReturnTrueWhenExactQuantityAvailable` | ✅     |
| `shouldReturnFalseWhenQuantityExceedsStock`  | ✅     |
| `shouldReturnFalseWhenProductHasZeroStock`   | ✅     |
| `shouldReturnFalseWhenProductDoesNotExist`   | ✅     |

---

## API Gateway ✅ 4/4

**Implementation:** Spring Cloud Gateway MVC routes, Resilience4j circuit breaker (count-based, 50% threshold, 5s open, 3 retries), OAuth2 JWT (Keycloak), CORS, Actuator health
**Issues Fixed:** Test `JwtDecoder` — mock decoder via `@TestConfiguration`

| Test                                           | Status |
| ---------------------------------------------- | ------ |
| `shouldReturnFallbackWhenProductServiceDown`   | ✅     |
| `shouldReturnFallbackWhenOrderServiceDown`     | ✅     |
| `shouldReturnFallbackWhenInventoryServiceDown` | ✅     |
| `shouldExposeActuatorHealth`                   | ✅     |

---

## Notification Service ✅ 2/2

**Implementation:** Kafka consumer on `order-placed` topic, JSON deserialization, HTML email via JavaMailSender (Mailpit for dev)
**Issues Fixed:** Byte Buddy JDK 25 (`-Dnet.bytebuddy.experimental=true`), mock reset between tests

| Test                                           | Status |
| ---------------------------------------------- | ------ |
| `shouldReceiveOrderPlacedEventAndSendEmail`    | ✅     |
| `shouldReceiveEventWithNullEmailAndUseDefault` | ✅     |

---

## Payment Service ✅ 5/5

**Implementation:** `Payment` entity (JPA, `t_payments`), MySQL 8.3 + Flyway, status enum (PENDING/COMPLETED/FAILED/REFUNDED), UUID transaction IDs
**Endpoints:** `POST /api/payment`, `GET /api/payment`, `GET /api/payment/order/{orderNumber}`, `GET /api/payment/transaction/{transactionId}`, `POST /api/payment/refund/{transactionId}`
**Issues Fixed:** None — clean first-try pass

| Test                              | Status |
| --------------------------------- | ------ |
| `shouldProcessPayment`            | ✅     |
| `shouldGetAllPayments`            | ✅     |
| `shouldGetPaymentsByOrderNumber`  | ✅     |
| `shouldGetPaymentByTransactionId` | ✅     |
| `shouldRefundPayment`             | ✅     |
