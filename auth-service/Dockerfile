FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create a non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY target/*.jar app.jar

EXPOSE 8085

HEALTHCHECK --interval=30s --timeout=3s \
  CMD java -version || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
