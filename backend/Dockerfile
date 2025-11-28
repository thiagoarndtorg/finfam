# Backend Dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy the JAR (build context is already ./backend, so just app.jar)
COPY app.jar app.jar

EXPOSE 8081

# Execute the JAR
ENTRYPOINT ["java", "-jar", "app.jar"]