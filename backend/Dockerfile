# ---- Build stage ----
FROM gradle:8-jdk17 AS builder
WORKDIR /app
COPY . .
RUN gradle clean build -x test

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# Download Grafana Java Agent
RUN wget https://github.com/grafana/grafana-opentelemetry-java/releases/latest/download/grafana-opentelemetry-java.jar -O /opt/grafana-opentelemetry-java.jar

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-javaagent:/opt/grafana-opentelemetry-java.jar", "-jar", "app.jar"]
