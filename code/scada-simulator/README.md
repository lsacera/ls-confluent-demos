# SCADA Simulator

SCADA telemetry simulator for USA energy grid monitoring demo.

## Overview
Generates synthetic sensor telemetry data from electrical grid and gas network sensors across USA regions.

## Features
- Simulates 50-100 virtual sensors
- Realistic voltage, current, frequency, pressure, flow measurements
- Geographic distribution across USA states
- Publishes to `scada-telemetry` Kafka topic
- Generates alerts to `scada-alerts` topic

## Running locally
```bash
mvn compile
mvn exec:java
```

## Running in Docker
```bash
docker build -t scada-simulator .
docker run scada-simulator
```
