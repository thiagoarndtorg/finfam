# Backend Dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copia o JAR já buildado
COPY backend/app.jar app.jar

EXPOSE 8081

# Executa o JAR
ENTRYPOINT ["java", "-jar", "app.jar"]
