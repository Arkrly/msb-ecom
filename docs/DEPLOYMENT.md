# Deployment Guide

This guide covers how to deploy the MSB E-Commerce microservices.

## Local Deployment (Docker Compose)

The easiest way to run the entire system locally is using Docker Compose.

1. **Build the project** (Skip if you want to use pre-built images or local build)

   ```bash
   mvn clean package -DskipTests
   ```

2. **Run Docker Compose**

   ```bash
   docker-compose up --build -d
   ```

3. **Verify**
   Check if all containers are healthy:
   ```bash
   docker ps
   ```

## Cloud Deployment (AWS/GCP/Azure)

### Kubernetes (K8s) Strategy

For production, we recommend deploying to a Kubernetes cluster (EKS, GKE, AKS).

1. **Containerize**: Build Docker images for each service and push to a Container Registry (ECR, GCR, Docker Hub).
2. **Manifests**: Create K8s manifests (Deployment, Service, Ingress) for each microservice.
3. **ConfigMaps/Secrets**: Store database credentials and JWT secrets securely.
4. **Ingress Controller**: Use NGINX or ALB Ingress Controller to route traffic to the API Gateway.

### Database Hosting

- Use managed database services (RDS, Cloud SQL) instead of running databases in containers for better reliability and backups.
- **PostgreSQL**: For Auth and Keycloak.
- **MongoDB**: For Product Service.
- **MySQL**: For Order, Inventory, Payment services.

### CI/CD Pipeline

- Set up a pipeline (GitHub Actions, Jenkins) to:
  - Run tests on commit.
  - Build Docker images on merge to main.
  - Deploy to the cluster using Helm or Kustomize.
