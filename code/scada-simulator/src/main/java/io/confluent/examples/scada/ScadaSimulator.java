package io.confluent.examples.scada;

import io.confluent.kafka.serializers.AbstractKafkaSchemaSerDeConfig;
import io.confluent.kafka.serializers.KafkaAvroSerializer;
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import org.apache.log4j.Logger;

import java.util.*;

public class ScadaSimulator {

    private static final Logger logger = Logger.getLogger(ScadaSimulator.class);
    private static final int INGESTION_INTERVAL = 5000; // 5 seconds between sensor readings
    private static final Random random = new Random();

    // Problematic sensors that fail intermittently (for demo purposes)
    // These sensors will fail ~60% of the time, showing WARNING/CRITICAL health status
    private static final Set<String> PROBLEMATIC_SENSORS = new HashSet<>(Arrays.asList(
        "SENSOR_TX_007",  // Texas/ERCOT - needs maintenance
        "SENSOR_CA_003",  // California/WECC - intermittent
        "SENSOR_NY_009",  // New York/EASTERN - failing
        "SENSOR_FL_005",  // Florida/EASTERN - degraded
        "SENSOR_WA_002"   // Washington/WECC - unstable
    ));

    // USA Grid Locations (City, State, Lat, Long, Zone, Grid Region)
    private static final String[][] USA_LOCATIONS = {
        {"Houston", "TX", "29.7604", "-95.3698", "ZONE_TX_CENTRAL", "ERCOT"},
        {"Dallas", "TX", "32.7767", "-96.7970", "ZONE_TX_NORTH", "ERCOT"},
        {"Austin", "TX", "30.2672", "-97.7431", "ZONE_TX_CENTRAL", "ERCOT"},
        {"San Antonio", "TX", "29.4241", "-98.4936", "ZONE_TX_SOUTH", "ERCOT"},
        {"Los Angeles", "CA", "34.0522", "-118.2437", "ZONE_CA_SOUTH", "WECC"},
        {"San Francisco", "CA", "37.7749", "-122.4194", "ZONE_CA_NORTH", "WECC"},
        {"San Diego", "CA", "32.7157", "-117.1611", "ZONE_CA_SOUTH", "WECC"},
        {"Phoenix", "AZ", "33.4484", "-112.0740", "ZONE_AZ_CENTRAL", "WECC"},
        {"Seattle", "WA", "47.6062", "-122.3321", "ZONE_WA_WEST", "WECC"},
        {"Portland", "OR", "45.5152", "-122.6784", "ZONE_OR_WEST", "WECC"},
        {"New York", "NY", "40.7128", "-74.0060", "ZONE_NY_METRO", "EASTERN"},
        {"Boston", "MA", "42.3601", "-71.0589", "ZONE_MA_EAST", "EASTERN"},
        {"Philadelphia", "PA", "39.9526", "-75.1652", "ZONE_PA_EAST", "EASTERN"},
        {"Miami", "FL", "25.7617", "-80.1918", "ZONE_FL_SOUTH", "EASTERN"},
        {"Atlanta", "GA", "33.7490", "-84.3880", "ZONE_GA_NORTH", "EASTERN"},
        {"Chicago", "IL", "41.8781", "-87.6298", "ZONE_IL_NORTH", "EASTERN"},
        {"Detroit", "MI", "42.3314", "-83.0458", "ZONE_MI_SOUTH", "EASTERN"},
        {"Denver", "CO", "39.7392", "-104.9903", "ZONE_CO_CENTRAL", "WECC"}
    };

    // Number of sensors per location
    private static final int SENSORS_PER_LOCATION = 10;

    // Measurement types with their normal ranges
    private static final Map<String, double[]> MEASUREMENT_RANGES = new HashMap<String, double[]>() {{
        put("VOLTAGE", new double[]{132.0, 765.0});     // kV - USA transmission voltages
        put("CURRENT", new double[]{100.0, 3000.0});    // A
        put("FREQUENCY", new double[]{59.95, 60.05});   // Hz - USA grid frequency (60 Hz nominal)
        put("POWER_ACTIVE", new double[]{50.0, 500.0}); // MW
        put("POWER_REACTIVE", new double[]{10.0, 100.0}); // MVAr
        put("PRESSURE", new double[]{40.0, 70.0});      // bar - gas network
        put("FLOW", new double[]{1000.0, 50000.0});     // m³/h - gas flow
        put("TEMPERATURE", new double[]{5.0, 25.0});    // °C
    }};

    private static final Map<String, String> MEASUREMENT_UNITS = new HashMap<String, String>() {{
        put("VOLTAGE", "kV");
        put("CURRENT", "A");
        put("FREQUENCY", "Hz");
        put("POWER_ACTIVE", "MW");
        put("POWER_REACTIVE", "MVAr");
        put("POWER_FACTOR", "");
        put("PRESSURE", "bar");
        put("FLOW", "m3/h");
        put("TEMPERATURE", "C");
    }};

    public static void main(String[] args) {
        logger.info("Starting SCADA Simulator for USA Energy Grid...");

        Properties props = new Properties();

        // Kafka configuration from environment variables
        String bootstrapServers = System.getenv("BOOTSTRAP_SERVERS");
        String kafkaApiKey = System.getenv("KAFKA_API_KEY");
        String kafkaApiSecret = System.getenv("KAFKA_API_SECRET");
        String schemaRegistryUrl = System.getenv("SCHEMA_REGISTRY_URL");
        String schemaRegistryKey = System.getenv("SCHEMA_REGISTRY_KEY");
        String schemaRegistrySecret = System.getenv("SCHEMA_REGISTRY_SECRET");

        if (bootstrapServers == null || schemaRegistryUrl == null) {
            logger.error("Missing required environment variables. Please set BOOTSTRAP_SERVERS and SCHEMA_REGISTRY_URL");
            System.exit(1);
        }

        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, KafkaAvroSerializer.class);
        props.put(AbstractKafkaSchemaSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG, schemaRegistryUrl);
        props.put(AbstractKafkaSchemaSerDeConfig.AUTO_REGISTER_SCHEMAS, "false");
        props.put(AbstractKafkaSchemaSerDeConfig.USE_LATEST_VERSION, "true");

        // Authentication
        if (kafkaApiKey != null && kafkaApiSecret != null) {
            props.put("sasl.mechanism", "PLAIN");
            props.put("security.protocol", "SASL_SSL");
            props.put("sasl.jaas.config",
                String.format("org.apache.kafka.common.security.plain.PlainLoginModule required username='%s' password='%s';",
                    kafkaApiKey, kafkaApiSecret));
        }

        if (schemaRegistryKey != null && schemaRegistrySecret != null) {
            props.put("basic.auth.credentials.source", "USER_INFO");
            props.put("basic.auth.user.info", schemaRegistryKey + ":" + schemaRegistrySecret);
        }

        logger.info("Kafka Producer configured. Bootstrap servers: " + bootstrapServers);
        int totalSensors = USA_LOCATIONS.length * SENSORS_PER_LOCATION;
        logger.info("Simulating " + totalSensors + " sensors across USA grid regions (" +
                    SENSORS_PER_LOCATION + " per location)");

        try (Producer<String, Object> producer = new KafkaProducer<>(props)) {
            int counter = 0;

            while (true) {
                int readingsGenerated = 0;

                // Generate telemetry for each location and each sensor
                for (String[] location : USA_LOCATIONS) {
                    for (int sensorIndex = 0; sensorIndex < SENSORS_PER_LOCATION; sensorIndex++) {
                        String state = location[1];
                        String sensorId = String.format("SENSOR_%s_%03d", state, sensorIndex);

                        // Problematic sensors fail 60% of the time (simulate intermittent failures)
                        if (PROBLEMATIC_SENSORS.contains(sensorId) && random.nextDouble() < 0.60) {
                            logger.debug("Sensor " + sensorId + " skipped (simulated failure)");
                            continue; // Skip this reading - sensor is failing
                        }

                        generateSensorReading(producer, location, sensorIndex, counter);
                        readingsGenerated++;
                    }
                }

                counter++;
                logger.info("Batch " + counter + " - Generated " + readingsGenerated + "/" + totalSensors + " sensor readings");

                Thread.sleep(INGESTION_INTERVAL);
            }
        } catch (Exception e) {
            logger.error("Error in SCADA Simulator: " + e.getMessage(), e);
            System.exit(1);
        }
    }

    private static void generateSensorReading(Producer<String, Object> producer, String[] location, int sensorIndex, int counter) {
        try {
            String city = location[0];
            String state = location[1];
            double latitude = Double.parseDouble(location[2]);
            double longitude = Double.parseDouble(location[3]);
            String zoneId = location[4];
            String gridRegion = location[5];

            // Generate fixed sensor ID based on location and index
            String sensorId = String.format("SENSOR_%s_%03d", state, sensorIndex);

            // Randomly select measurement type
            String[] measurementTypes = {"VOLTAGE", "CURRENT", "FREQUENCY", "POWER_ACTIVE", "PRESSURE", "FLOW", "TEMPERATURE"};
            String measurementType = measurementTypes[random.nextInt(measurementTypes.length)];

            // Generate realistic value within normal range using Gaussian distribution
            // Values are centered around midpoint with ~95% within normal range
            double[] range = MEASUREMENT_RANGES.get(measurementType);
            double midpoint = (range[0] + range[1]) / 2.0;
            double rangeWidth = range[1] - range[0];

            // Use Gaussian distribution: mean = midpoint, stddev = rangeWidth/6 (keeps 99.7% within range)
            double baseValue = midpoint + (random.nextGaussian() * rangeWidth / 6.0);

            // Clamp to normal range
            baseValue = Math.max(range[0], Math.min(range[1], baseValue));

            // Occasionally generate values outside normal range (2% chance - reduced from 10%)
            // Flink will detect these as anomalies and generate alerts
            final double value;
            if (random.nextDouble() < 0.02) {
                // Generate anomalous value (15-25% outside normal range)
                double deviation = 0.15 + (0.10 * random.nextDouble());
                if (random.nextBoolean()) {
                    value = range[1] * (1.0 + deviation); // Above max
                } else {
                    value = range[0] * (1.0 - deviation); // Below min
                }
            } else {
                value = baseValue;
            }

            // Sensor status is always NORMAL - Flink will detect anomalies
            final String status = "NORMAL";

            String unit = MEASUREMENT_UNITS.get(measurementType);
            long timestamp = System.currentTimeMillis();

            // Create Avro record using generated classes
            ScadaTelemetry telemetryRecord = ScadaTelemetry.newBuilder()
                .setSensorId(sensorId)
                .setTimestamp(timestamp)
                .setMeasurementType(MeasurementType.valueOf(measurementType))
                .setValue(value)
                .setUnit(unit)
                .setLatitude(latitude)
                .setLongitude(longitude)
                .setZoneId(zoneId)
                .setState(state)
                .setCity(city)
                .setStatus(SensorStatus.valueOf(status))
                .setGridRegion(GridRegion.valueOf(gridRegion))
                .build();

            ProducerRecord<String, Object> record = new ProducerRecord<>("scada-telemetry", sensorId, telemetryRecord);

            producer.send(record, new Callback() {
                public void onCompletion(RecordMetadata metadata, Exception e) {
                    if (e != null) {
                        logger.error("Error sending record: " + e.getMessage());
                    } else {
                        logger.debug(String.format("Sent: %s @ %s, %s = %.2f %s [%s]",
                            sensorId, city, measurementType, value, unit, status));
                    }
                }
            });

        } catch (Exception e) {
            logger.error("Error generating sensor reading: " + e.getMessage(), e);
        }
    }
}
