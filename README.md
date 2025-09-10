# msb-ecom

A simple e-commerce monorepo with Spring Boot microservices and an Angular frontend.

## Overview

- Backend (Java 21, Spring Boot 3):
	- `api-gateway` – routes external traffic to services
	- `product-service` – product catalog
	- `inventory-service` – stock levels and migrations (Flyway)
	- `order-service` – orders (skeleton)
	- `notification-service` – notifications (skeleton)
- Frontend (Angular 20): `frontend`

## Quick start (Windows PowerShell)

Prereqs: Java 21 (JDK), Node.js 20+. Maven Wrapper is included; no global Maven required.

### Run services

Open separate terminals for each service you need:

```powershell
# API Gateway
cd api-gateway; .\mvnw.cmd spring-boot:run

# Product Service
cd product-service; .\mvnw.cmd spring-boot:run

# Inventory Service
cd inventory-service; .\mvnw.cmd spring-boot:run

# Order Service (if/when implemented)
cd order-service; .\mvnw.cmd spring-boot:run

# Notification Service (if/when implemented)
cd notification-service; .\mvnw.cmd spring-boot:run
```

### Run the frontend

```powershell
cd frontend
npm install
npm start
```

## Notes

- Git ignores the `archives/` directory by default.
- Ports, routes, and service URLs can be configured via each module's `application.properties`.

