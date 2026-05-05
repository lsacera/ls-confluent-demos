package io.confluent.examples.smartcity;

import java.util.*;

/**
 * Generates realistic EMT Madrid bus telemetry data
 */
public class EmtBusGenerator {
    private final List<BusInfo> buses;
    private final Random random = new Random();

    static class BusInfo {
        String id;
        String line;
        String routeName;
        VehicleType vehicleType;
        // Current position state
        double lat;
        double lon;
        double speed;
        int heading;
        String currentDistrict;

        BusInfo(String id, String line, String routeName, VehicleType vehicleType,
                double lat, double lon, String district) {
            this.id = id;
            this.line = line;
            this.routeName = routeName;
            this.vehicleType = vehicleType;
            this.lat = lat;
            this.lon = lon;
            this.speed = 0.0;
            this.heading = new Random().nextInt(360);
            this.currentDistrict = district;
        }
    }

    public EmtBusGenerator() {
        this.buses = initializeBuses();
    }

    private List<BusInfo> initializeBuses() {
        List<BusInfo> busList = new ArrayList<>();

        // Real EMT Madrid lines
        busList.add(new BusInfo("EMT-1-4523", "1", "Pinar de Chamartín - Portazgo",
            VehicleType.STANDARD, 40.4678, -3.6789, "Chamartin"));
        busList.add(new BusInfo("EMT-1-4524", "1", "Pinar de Chamartín - Portazgo",
            VehicleType.STANDARD, 40.4012, -3.6598, "Moratalaz"));

        busList.add(new BusInfo("EMT-6-3421", "6", "Moncloa - Plaza Elíptica",
            VehicleType.ARTICULATED, 40.4335, -3.7176, "Moncloa_Aravaca"));
        busList.add(new BusInfo("EMT-6-3422", "6", "Moncloa - Plaza Elíptica",
            VehicleType.ARTICULATED, 40.3856, -3.7089, "Arganzuela"));

        busList.add(new BusInfo("EMT-27-5612", "27", "Plaza Castilla - Embajadores",
            VehicleType.ELECTRIC, 40.4658, -3.6888, "Tetuan"));
        busList.add(new BusInfo("EMT-27-5613", "27", "Plaza Castilla - Embajadores",
            VehicleType.ELECTRIC, 40.4086, -3.7037, "Centro"));

        busList.add(new BusInfo("EMT-146-2834", "146", "Cuatro Caminos - Orcasitas",
            VehicleType.HYBRID, 40.4512, -3.7089, "Chamberi"));
        busList.add(new BusInfo("EMT-146-2835", "146", "Cuatro Caminos - Orcasitas",
            VehicleType.HYBRID, 40.3678, -3.7123, "Usera"));

        busList.add(new BusInfo("EMT-3-7823", "3", "Puerta de Toledo - Villaverde Alto",
            VehicleType.STANDARD, 40.4086, -3.7089, "Centro"));

        busList.add(new BusInfo("EMT-74-9234", "74", "Principe Pio - Barrio del Pilar",
            VehicleType.STANDARD, 40.4232, -3.7176, "Moncloa_Aravaca"));

        return busList;
    }

    public List<BusInfo> getBuses() {
        return buses;
    }

    public EmtBus generateData(BusInfo bus) {
        long timestamp = System.currentTimeMillis();
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);

        // Update bus position (simulate movement)
        updateBusPosition(bus);

        // Generate occupancy based on time of day
        boolean isRushHour = (hour >= 7 && hour <= 10) || (hour >= 18 && hour <= 21);
        boolean isLunchHour = (hour >= 14 && hour <= 15);
        boolean isNight = hour >= 23 || hour <= 6;

        double occupancyPct = generateOccupancy(bus.vehicleType, isRushHour, isLunchHour, isNight);
        int passengerCount = calculatePassengerCount(bus.vehicleType, occupancyPct);

        // Generate next stop info
        String nextStop = generateNextStop(bus.line);
        int nextStopEta = 60 + random.nextInt(180); // 1-3 minutes

        // Generate delay based on time of day (more delays during rush hour)
        int delayMinutes = generateDelay(isRushHour, isLunchHour, isNight);

        // Determine bus status
        BusStatus status = determineBusStatus(isNight);

        return EmtBus.newBuilder()
            .setBusId(bus.id)
            .setTimestamp(timestamp)
            .setLine(bus.line)
            .setRouteName(bus.routeName)
            .setLatitude(bus.lat)
            .setLongitude(bus.lon)
            .setSpeed(bus.speed)
            .setHeading(bus.heading)
            .setOccupancyPct(occupancyPct)
            .setPassengerCount(passengerCount)
            .setNextStop(nextStop)
            .setNextStopEta(nextStopEta)
            .setDelayMinutes(delayMinutes)
            .setDistrict(bus.currentDistrict)
            .setStatus(status)
            .setVehicleType(bus.vehicleType)
            .build();
    }

    private void updateBusPosition(BusInfo bus) {
        // Simulate bus movement along route
        // Buses move in their heading direction, speed varies by status

        double movementSpeed = 0.0;

        // 30% chance of being stopped at a bus stop
        if (random.nextDouble() < 0.3) {
            movementSpeed = 0.0;
            bus.speed = 0.0;
        } else {
            // Moving: 10-40 km/h in city traffic
            movementSpeed = 15.0 + random.nextDouble() * 25.0;
            bus.speed = movementSpeed;
        }

        // Convert speed to lat/lon delta (very simplified)
        // 1 km ≈ 0.01 degrees at Madrid latitude
        double distance = (movementSpeed / 3600.0) * 5.0; // Distance in 5 seconds
        double deltaLat = distance * Math.cos(Math.toRadians(bus.heading)) * 0.01;
        double deltaLon = distance * Math.sin(Math.toRadians(bus.heading)) * 0.01;

        bus.lat += deltaLat;
        bus.lon += deltaLon;

        // Keep within Madrid bounds (40.3-40.5 lat, -3.9 to -3.5 lon)
        bus.lat = Math.max(40.3, Math.min(40.5, bus.lat));
        bus.lon = Math.max(-3.9, Math.min(-3.5, bus.lon));

        // Randomly change heading (simulate route turns)
        if (random.nextDouble() < 0.1) {
            bus.heading = (bus.heading + random.nextInt(90) - 45 + 360) % 360;
        }
    }

    private double generateOccupancy(VehicleType type, boolean rushHour, boolean lunchHour, boolean night) {
        double baseOccupancy;

        if (night) {
            baseOccupancy = 10.0 + random.nextDouble() * 15.0; // 10-25%
        } else if (rushHour) {
            baseOccupancy = 70.0 + random.nextDouble() * 30.0; // 70-100% (can exceed)
        } else if (lunchHour) {
            baseOccupancy = 50.0 + random.nextDouble() * 25.0; // 50-75%
        } else {
            baseOccupancy = 30.0 + random.nextDouble() * 35.0; // 30-65%
        }

        // Electric buses are more popular
        if (type == VehicleType.ELECTRIC && !night) {
            baseOccupancy *= 1.15;
        }

        return Math.min(120.0, baseOccupancy); // Can exceed 100% if overcrowded
    }

    private int calculatePassengerCount(VehicleType type, double occupancyPct) {
        int capacity = switch (type) {
            case STANDARD -> 80;
            case ARTICULATED -> 120;
            case ELECTRIC -> 90;
            case HYBRID -> 85;
        };

        return (int)((occupancyPct / 100.0) * capacity);
    }

    private String generateNextStop(String line) {
        // Sample bus stops for different lines
        Map<String, String[]> lineStops = new HashMap<>();
        lineStops.put("1", new String[]{"Pinar de Chamartín", "Arturo Soria", "Canillejas", "Las Rosas", "Portazgo"});
        lineStops.put("6", new String[]{"Moncloa", "Argüelles", "Gran Vía", "Atocha", "Plaza Elíptica"});
        lineStops.put("27", new String[]{"Plaza Castilla", "Nuevos Ministerios", "Alonso Martínez", "Cibeles", "Embajadores"});
        lineStops.put("146", new String[]{"Cuatro Caminos", "Estrecho", "Tetuán", "Puente de Vallecas", "Orcasitas"});
        lineStops.put("3", new String[]{"Puerta de Toledo", "Marqués de Vadillo", "Oporto", "Plaza Elíptica", "Villaverde Alto"});
        lineStops.put("74", new String[]{"Príncipe Pío", "Moncloa", "Bravo Murillo", "Plaza Castilla", "Barrio del Pilar"});

        String[] stops = lineStops.getOrDefault(line, new String[]{"Parada Central", "Parada Norte", "Parada Sur"});
        return stops[random.nextInt(stops.length)];
    }

    private int generateDelay(boolean rushHour, boolean lunchHour, boolean night) {
        if (night) {
            // Night: buses are usually on time or early
            return random.nextInt(4) - 2; // -2 to +1 minutes
        } else if (rushHour) {
            // Rush hour: significant delays due to traffic
            return random.nextInt(16) - 1; // -1 to +14 minutes (mostly delayed)
        } else if (lunchHour) {
            // Lunch hour: moderate delays
            return random.nextInt(10) - 2; // -2 to +7 minutes
        } else {
            // Normal hours: slight delays
            return random.nextInt(8) - 3; // -3 to +4 minutes
        }
    }

    private BusStatus determineBusStatus(boolean night) {
        // 2% chance of out of service
        if (random.nextDouble() < 0.02) {
            return random.nextBoolean() ? BusStatus.OUT_OF_SERVICE : BusStatus.MAINTENANCE;
        }

        // 20% chance of being at stop
        if (random.nextDouble() < 0.2) {
            return BusStatus.AT_STOP;
        }

        return BusStatus.IN_SERVICE;
    }
}
