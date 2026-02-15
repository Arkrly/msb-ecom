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

## Quick start

Prereqs: Java 21 (JDK), Node.js 20+. Maven Wrapper is included; no global Maven required.

### Setup (Unix/Linux/macOS)

Ensure Maven wrappers are executable:

```bash
chmod +x */mvnw
```

### Run services

Open separate terminals for each service you need:

**Windows (PowerShell):**

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

**Unix/Linux/macOS:**

```bash
# API Gateway
cd api-gateway && ./mvnw spring-boot:run

# Product Service
cd product-service && ./mvnw spring-boot:run

# Inventory Service
cd inventory-service && ./mvnw spring-boot:run

# Order Service (if/when implemented)
cd order-service && ./mvnw spring-boot:run

# Notification Service (if/when implemented)
cd notification-service && ./mvnw spring-boot:run
```

### Run the frontend

```bash
cd frontend
npm install
npm start
```

## VS Code Extensions

This repository includes a recommended list of extensions for VS Code.
When you open this folder in VS Code, you should see a prompt to install the recommended extensions.
If not, you can view them in `.vscode/extensions.json` or by searching for `@recommended` in the Extensions view.

## Notes

- Git ignores the `archives/` directory by default.
- Ports, routes, and service URLs can be configured via each module's `application.properties`.

