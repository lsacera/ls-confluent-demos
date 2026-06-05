# Use Maven and JDK base image
FROM maven:3.9.9-eclipse-temurin-21-alpine

# Set the working directory inside the container
WORKDIR /opt/payments_app

# 1) Copy the application sources
COPY pom.xml .
COPY src ./src

# 2) Compile the project (downloads dependencies, generates Avro POJOs, and compiles)
# Removed -q flag to see build progress, removed dependency:go-offline as it can hang
RUN mvn -T 1C compile -DskipTests

# 4) Run the Java application via Maven exec plugin
CMD ["mvn", "exec:java"]

