# Use Maven and JDK base image
FROM maven:3.9.9-eclipse-temurin-17

# Set the working directory inside the container
WORKDIR /opt/smartcity_simulator_app

# Copy all the project files into the container's working directory
COPY . .

# Run Maven to compile the project (this will generate Avro classes first)
RUN mvn compile

# Specify the command to run the Java application
CMD ["mvn", "exec:java"]
