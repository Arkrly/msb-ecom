FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY target/*.jar app.jar

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD java -version || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
