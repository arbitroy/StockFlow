# api/Dockerfile
# Build stage
FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# This will be the directory where PostgreSQL stores its data
RUN mkdir -p /var/lib/postgresql/data

ENTRYPOINT ["java", "-jar", "app.jar"]