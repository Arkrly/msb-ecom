# API Documentation

The MSB E-Commerce platform exposes RESTful APIs for all its microservices.

## Swagger UI

Each microservice utilizes SpringDoc OpenAPI to generate interactive API documentation. You can access them at the following URLs when running locally:

| Service                 | Swagger UI URL                                                                 |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Product Service**     | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) |
| **Order Service**       | [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html) |
| **Inventory Service**   | [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html) |
| **Payment Service**     | [http://localhost:8084/swagger-ui.html](http://localhost:8084/swagger-ui.html) |
| **Auth Service**        | [http://localhost:8085/swagger-ui.html](http://localhost:8085/swagger-ui.html) |
| **Gateway (Aggregate)** | [http://localhost:9000/swagger-ui.html](http://localhost:9000/swagger-ui.html) |

## Key Endpoints

### Authentication

- `POST /auth/signup`: Register a new user.
- `POST /auth/login`: Authenticate and receive JWT.

### Products

- `GET /api/product`: List all products.
- `POST /api/product`: Create a new product (Admin).

### Orders

- `POST /api/order`: Place a new order.
- `GET /api/order`: List user orders.

### Inventory

- `GET /api/inventory/{skuCode}`: Check stock for a product.
