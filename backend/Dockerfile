# Backend Dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app

# Download Grafana OpenTelemetry Java Agent
RUN wget https://github.com/grafana/grafana-opentelemetry-java/releases/latest/download/grafana-opentelemetry-java.jar -O /opt/grafana-opentelemetry-java.jar


# Copy the JAR (build context is already ./backend, so just app.jar)
COPY app.jar app.jar

EXPOSE 8081

# Execute the JAR
ENTRYPOINT ["java", "-javaagent:/opt/grafana-opentelemetry-java.jar", "-jar", "app.jar"]