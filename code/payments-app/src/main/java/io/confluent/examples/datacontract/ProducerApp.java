package io.confluent.examples.datacontract;

import com.github.javafaker.Faker;
import io.confluent.examples.datacontract.datagen.SalesDataGen;
import io.confluent.examples.datacontract.pojo.avro.Sale;
import io.confluent.examples.datacontract.utils.ClientsUtils;
import io.confluent.kafka.serializers.AbstractKafkaSchemaSerDeConfig;
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import org.apache.log4j.Logger;

import java.time.LocalTime;
import java.util.Properties;
import java.util.Random;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class ProducerApp implements Runnable {

    private static final Logger logger = Logger.getLogger(ProducerApp.class);

    private Properties props;
    private String topic, dlq;

    ProducerApp(
            String propertiesFile,
            String clientId) {
        try {
            props = ClientsUtils.loadConfig(propertiesFile);
            if (clientId != null) {
                props.put(ProducerConfig.CLIENT_ID_CONFIG, clientId);
            }
            props.put(AbstractKafkaSchemaSerDeConfig.AUTO_REGISTER_SCHEMAS, "false");
            props.put(AbstractKafkaSchemaSerDeConfig.USE_LATEST_VERSION, "true");
            props.put(AbstractKafkaSchemaSerDeConfig.LATEST_COMPATIBILITY_STRICT, "false");

            // Refresh schema cache every 5 seconds
//            props.put(AbstractKafkaSchemaSerDeConfig.LATEST_CACHE_TTL, 1000);
            props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

            props.put("value.serializer", "io.confluent.kafka.serializers.KafkaAvroSerializer");
        } catch (Exception e) {
            e.printStackTrace();
            logger.error("Error in ProducerApp.constructor: " + e);
        }
    }

    /**
     * Calculate dynamic interval based on current hour
     * Returns interval in milliseconds with realistic business patterns
     */
    private static int getDynamicInterval() {
        Random random = new Random();
        int hour = LocalTime.now().getHour();

        // Define interval ranges based on time of day (min, max in milliseconds)
        int minInterval, maxInterval;

        if (hour >= 0 && hour < 6) {
            // Midnight to 6am - Very slow (1-2 payments/hour)
            minInterval = 1800000; // 30 minutes
            maxInterval = 3600000; // 60 minutes
        } else if (hour >= 6 && hour < 10) {
            // Morning 6am-10am - Moderate (60-120 payments/hour)
            minInterval = 30000;  // 30 seconds
            maxInterval = 60000;  // 60 seconds
        } else if (hour >= 10 && hour < 14) {
            // Lunch peak 10am-2pm - High (180-360 payments/hour)
            minInterval = 10000;  // 10 seconds
            maxInterval = 20000;  // 20 seconds
        } else if (hour >= 14 && hour < 18) {
            // Afternoon 2pm-6pm - Moderate (90-180 payments/hour)
            minInterval = 20000;  // 20 seconds
            maxInterval = 40000;  // 40 seconds
        } else if (hour >= 18 && hour < 22) {
            // Dinner peak 6pm-10pm - High (180-360 payments/hour)
            minInterval = 10000;  // 10 seconds
            maxInterval = 20000;  // 20 seconds
        } else {
            // Night 10pm-midnight - Low (45-90 payments/hour)
            minInterval = 40000;  // 40 seconds
            maxInterval = 80000;  // 80 seconds
        }

        // Return random value within range for variability
        return minInterval + random.nextInt(maxInterval - minInterval + 1);
    }

    @Override
    public void run() {
        topic = "payments";
        Random random = new Random();
        try (Producer<String, Object> producer = new KafkaProducer<>(props)) {
            while (true) {
                // Send the record
                try {
                    Object sales;

                    sales = SalesDataGen.getSale();

                    System.out.println("------------------------- ");

		    // For Kafka clients >= 2.4, the producer defaults to the Sticky Partitioner for keyless messages.
		    // Messages with a key use hashing to determine the partition, aiming for an even spread and guaranteeing order per key.

		    // Create a sales record
                    ProducerRecord record = new ProducerRecord<>(topic, String.valueOf(((Sale)sales).getOrderId()), sales);
                    producer.send(record, new Callback() {
                        public void onCompletion(RecordMetadata metadata, Exception e) {
                            if(e != null) {
                                e.printStackTrace();
                            } else {
                                System.out.println("The offset of the order record we just sent is: " + metadata.offset());
                            }
                        }
                    }).get();
                    System.out.println(sales);
                    
                    // 10% of the time generate a duplicate
                    if (random.nextInt(10) == 0) {     
                        producer.send(record, new Callback() {
                            public void onCompletion(RecordMetadata metadata, Exception e) {
                                if(e != null) {
                                    e.printStackTrace();
                                } else {
                                    System.out.println("The offset of the order record we just sent is: " + metadata.offset());
                                }
                            }
                        }).get(); 
                        System.out.println("Duplicate sale event produced " + sales);
                    }

                    int interval = getDynamicInterval();
                    System.out.println("Next payment in " + (interval/1000) + " seconds (hour: " + LocalTime.now().getHour() + ")");
                    Thread.sleep(interval);
                    } catch (Exception e) {
                        // Catch and log the serialization error but continue to next record
                        // logger.error("Serialization error in ProducerApp.run: ", e);
                        e.printStackTrace();
                        continue;
                    }
            }
            } catch(Exception e){
                logger.error("Error in ProducerApp.run: ", e);
            }
            
        }


        public static void main ( final String[] args) throws Exception {
            if (args.length < 2) {
                logger.error(
                        "Provide the propertiesFile clientId  as arguments");
                System.exit(1);
            }
            ExecutorService exec = Executors.newFixedThreadPool(Integer.parseInt(args[1]));
            for(int i = 0; i < Integer.parseInt(args[1]); i++) {
                exec.submit(new Runnable() {
                    public void run() {
                        ProducerApp producer = new ProducerApp(args[0], "Pos_Store_"+(new Faker().address().cityName()));
                        System.out.println("Starting new Thread ");
                        producer.run();

                    }
                });
            }

            exec.shutdown();
            exec.awaitTermination(Long.MAX_VALUE, TimeUnit.DAYS);
            System.out.println("End of threads ==============================");

        }
    }
