package io.confluent.examples.smartcity;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import io.confluent.kafka.serializers.KafkaAvroSerializer;
import io.confluent.kafka.serializers.KafkaAvroSerializerConfig;
import org.apache.log4j.Logger;
import org.apache.log4j.BasicConfigurator;

import java.util.Properties;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Smart City Madrid Simulator
 * Generates synthetic data for traffic sensors, air quality stations, EMT buses, and citizen services
 */
public class SmartCitySimulator {
    private static final Logger logger = Logger.getLogger(SmartCitySimulator.class);

    // Kafka topics
    private static final String TRAFFIC_TOPIC = "smartcity-traffic";
    private static final String AIRQUALITY_TOPIC = "smartcity-airquality";
    private static final String EMTBUS_TOPIC = "smartcity-emtbus";
    private static final String SERVICE_TOPIC = "smartcity-service";

    // Configuration from environment variables
    private static final String BOOTSTRAP_SERVERS = getEnvOrDefault("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092");
    private static final String SCHEMA_REGISTRY_URL = getEnvOrDefault("SCHEMA_REGISTRY_URL", "http://localhost:8081");
    private static final String SECURITY_PROTOCOL = getEnvOrDefault("KAFKA_SECURITY_PROTOCOL", "PLAINTEXT");
    private static final String SASL_MECHANISM = getEnvOrDefault("KAFKA_SASL_MECHANISM", "PLAIN");
    private static final String SASL_JAAS_CONFIG = getEnvOrDefault("KAFKA_SASL_JAAS_CONFIG", "");
    private static final String SR_BASIC_AUTH_USER_INFO = getEnvOrDefault("SCHEMA_REGISTRY_BASIC_AUTH_USER_INFO", "");
    private static final int INTERVAL_SECONDS = Integer.parseInt(getEnvOrDefault("INTERVAL_SECONDS", "5"));

    private static String getEnvOrDefault(String key, String defaultValue) {
        String value = System.getenv(key);
        return value != null ? value : defaultValue;
    }

    public static void main(String[] args) {
        BasicConfigurator.configure();
        logger.info("Starting Smart City Madrid Simulator...");
        logger.info("Bootstrap Servers: " + BOOTSTRAP_SERVERS);
        logger.info("Schema Registry: " + SCHEMA_REGISTRY_URL);
        logger.info("Generation Interval: " + INTERVAL_SECONDS + " seconds");

        // Create Kafka producers
        KafkaProducer<String, Object> producer = createProducer();

        // Initialize data generators
        TrafficSensorGenerator trafficGenerator = new TrafficSensorGenerator();
        AirQualityGenerator airQualityGenerator = new AirQualityGenerator();
        EmtBusGenerator emtBusGenerator = new EmtBusGenerator();
        CitizenServiceGenerator serviceGenerator = new CitizenServiceGenerator();

        // Schedule periodic data generation
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

        // Traffic sensors - every INTERVAL_SECONDS
        scheduler.scheduleAtFixedRate(() -> {
            try {
                trafficGenerator.getSensors().forEach(sensor -> {
                    TrafficSensor data = trafficGenerator.generateData(sensor);
                    ProducerRecord<String, Object> record = new ProducerRecord<>(
                        TRAFFIC_TOPIC,
                        data.getSensorId().toString(),
                        data
                    );
                    producer.send(record, (metadata, exception) -> {
                        if (exception != null) {
                            logger.error("Error sending traffic data: " + exception.getMessage());
                        }
                    });
                });
                logger.info("Published " + trafficGenerator.getSensors().size() + " traffic sensor readings");
            } catch (Exception e) {
                logger.error("Error generating traffic data: " + e.getMessage(), e);
            }
        }, 0, INTERVAL_SECONDS, TimeUnit.SECONDS);

        // Air quality stations - every INTERVAL_SECONDS
        scheduler.scheduleAtFixedRate(() -> {
            try {
                airQualityGenerator.getStations().forEach(station -> {
                    AirQualityStation data = airQualityGenerator.generateData(station);
                    ProducerRecord<String, Object> record = new ProducerRecord<>(
                        AIRQUALITY_TOPIC,
                        data.getStationId().toString(),
                        data
                    );
                    producer.send(record, (metadata, exception) -> {
                        if (exception != null) {
                            logger.error("Error sending air quality data: " + exception.getMessage());
                        }
                    });
                });
                logger.info("Published " + airQualityGenerator.getStations().size() + " air quality readings");
            } catch (Exception e) {
                logger.error("Error generating air quality data: " + e.getMessage(), e);
            }
        }, 0, INTERVAL_SECONDS, TimeUnit.SECONDS);

        // EMT buses - every INTERVAL_SECONDS
        scheduler.scheduleAtFixedRate(() -> {
            try {
                emtBusGenerator.getBuses().forEach(bus -> {
                    EmtBus data = emtBusGenerator.generateData(bus);
                    ProducerRecord<String, Object> record = new ProducerRecord<>(
                        EMTBUS_TOPIC,
                        data.getBusId().toString(),
                        data
                    );
                    producer.send(record, (metadata, exception) -> {
                        if (exception != null) {
                            logger.error("Error sending EMT bus data: " + exception.getMessage());
                        }
                    });
                });
                logger.info("Published " + emtBusGenerator.getBuses().size() + " EMT bus updates");
            } catch (Exception e) {
                logger.error("Error generating EMT bus data: " + e.getMessage(), e);
            }
        }, 0, INTERVAL_SECONDS, TimeUnit.SECONDS);

        // Citizen services - every INTERVAL_SECONDS * 2 (less frequent)
        scheduler.scheduleAtFixedRate(() -> {
            try {
                // Generate new service requests based on time of day
                int hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY);
                double newServiceChance = getServiceGenerationChance(hour);

                if (Math.random() < newServiceChance) {
                    CitizenService newService = serviceGenerator.generateNewService();
                    ProducerRecord<String, Object> record = new ProducerRecord<>(
                        SERVICE_TOPIC,
                        newService.getTicketId().toString(),
                        newService
                    );
                    producer.send(record, (metadata, exception) -> {
                        if (exception != null) {
                            logger.error("Error sending new service request: " + exception.getMessage());
                        }
                    });
                    logger.info("Published new service request: " + newService.getTicketId());
                }

                // Update existing service requests
                serviceGenerator.updateExistingServices().forEach(service -> {
                    ProducerRecord<String, Object> record = new ProducerRecord<>(
                        SERVICE_TOPIC,
                        service.getTicketId().toString(),
                        service
                    );
                    producer.send(record, (metadata, exception) -> {
                        if (exception != null) {
                            logger.error("Error sending service update: " + exception.getMessage());
                        }
                    });
                });
            } catch (Exception e) {
                logger.error("Error generating citizen service data: " + e.getMessage(), e);
            }
        }, 0, INTERVAL_SECONDS * 2, TimeUnit.SECONDS);

        // Graceful shutdown
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("Shutting down Smart City Simulator...");
            scheduler.shutdown();
            try {
                scheduler.awaitTermination(5, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                logger.error("Error during shutdown: " + e.getMessage());
            }
            producer.close();
            logger.info("Simulator stopped");
        }));

        logger.info("Smart City Simulator is running. Press Ctrl+C to stop.");
    }

    /**
     * Calculate service generation probability based on time of day
     * More requests during daytime (8AM-8PM), fewer at night
     */
    private static double getServiceGenerationChance(int hour) {
        // Night time (11PM-6AM): very low activity (2%)
        if (hour >= 23 || hour <= 6) {
            return 0.02;
        }
        // Early morning (6AM-8AM): low activity (5%)
        else if (hour <= 8) {
            return 0.05;
        }
        // Business hours (8AM-8PM): high activity (15%)
        else if (hour <= 20) {
            return 0.15;
        }
        // Evening (8PM-11PM): moderate activity (8%)
        else {
            return 0.08;
        }
    }

    private static KafkaProducer<String, Object> createProducer() {
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, BOOTSTRAP_SERVERS);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, KafkaAvroSerializer.class.getName());
        props.put(KafkaAvroSerializerConfig.SCHEMA_REGISTRY_URL_CONFIG, SCHEMA_REGISTRY_URL);

        // Security configuration
        if (!SECURITY_PROTOCOL.equals("PLAINTEXT")) {
            props.put("security.protocol", SECURITY_PROTOCOL);
            props.put("sasl.mechanism", SASL_MECHANISM);
            props.put("sasl.jaas.config", SASL_JAAS_CONFIG);
        }

        // Schema Registry authentication
        if (!SR_BASIC_AUTH_USER_INFO.isEmpty()) {
            props.put("basic.auth.credentials.source", "USER_INFO");
            props.put("schema.registry.basic.auth.user.info", SR_BASIC_AUTH_USER_INFO);
        }

        props.put(ProducerConfig.ACKS_CONFIG, "all");
        props.put(ProducerConfig.RETRIES_CONFIG, 3);
        props.put(ProducerConfig.LINGER_MS_CONFIG, 10);
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");

        return new KafkaProducer<>(props);
    }
}
