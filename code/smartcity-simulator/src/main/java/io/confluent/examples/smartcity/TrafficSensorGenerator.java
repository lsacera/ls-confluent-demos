package io.confluent.examples.smartcity;

import java.util.*;

/**
 * Generates realistic traffic sensor data for Madrid monitoring
 */
public class TrafficSensorGenerator {
    private final List<SensorInfo> sensors;
    private final Random random = new Random();

    static class SensorInfo {
        String id;
        MadridDistrict district;
        String locationName;
        LocationType locationType;
        double lat;
        double lon;

        SensorInfo(String id, MadridDistrict district, String locationName,
                   LocationType locationType, double lat, double lon) {
            this.id = id;
            this.district = district;
            this.locationName = locationName;
            this.locationType = locationType;
            this.lat = lat;
            this.lon = lon;
        }
    }

    public TrafficSensorGenerator() {
        this.sensors = initializeSensors();
    }

    private List<SensorInfo> initializeSensors() {
        List<SensorInfo> sensorList = new ArrayList<>();

        // M-30 sensors (Madrid ring road)
        sensorList.add(new SensorInfo("TRAF-M30-001", MadridDistrict.Tetuan,
            "M-30 Norte - Salida 5", LocationType.M30, 40.4680, -3.6892));
        sensorList.add(new SensorInfo("TRAF-M30-002", MadridDistrict.Chamartin,
            "M-30 Este - Nudo Manoteras", LocationType.M30, 40.4789, -3.6543));
        sensorList.add(new SensorInfo("TRAF-M30-003", MadridDistrict.Moratalaz,
            "M-30 Sur - Salida Moratalaz", LocationType.M30, 40.4012, -3.6432));
        sensorList.add(new SensorInfo("TRAF-M30-004", MadridDistrict.Carabanchel,
            "M-30 Suroeste - Nudo Sur", LocationType.M30, 40.3876, -3.7123));
        sensorList.add(new SensorInfo("TRAF-M30-005", MadridDistrict.Moncloa_Aravaca,
            "M-30 Oeste - Puerta de Hierro", LocationType.M30, 40.4532, -3.7456));

        // Main avenues
        sensorList.add(new SensorInfo("TRAF-AV-001", MadridDistrict.Centro,
            "Gran Via - Callao", LocationType.MAIN_AVENUE, 40.4200, -3.7038));
        sensorList.add(new SensorInfo("TRAF-AV-002", MadridDistrict.Salamanca,
            "Paseo de la Castellana - Nuevos Ministerios", LocationType.MAIN_AVENUE, 40.4467, -3.6889));
        sensorList.add(new SensorInfo("TRAF-AV-003", MadridDistrict.Retiro,
            "Calle Alcalá - Puerta de Alcalá", LocationType.MAIN_AVENUE, 40.4203, -3.6886));
        sensorList.add(new SensorInfo("TRAF-AV-004", MadridDistrict.Chamberi,
            "Paseo del Prado - Cibeles", LocationType.MAIN_AVENUE, 40.4189, -3.6934));

        // Highway access points
        sensorList.add(new SensorInfo("TRAF-ACC-001", MadridDistrict.Fuencarral_El_Pardo,
            "Acceso A-1 Norte", LocationType.HIGHWAY_ACCESS, 40.5012, -3.6789));
        sensorList.add(new SensorInfo("TRAF-ACC-002", MadridDistrict.Barajas,
            "Acceso M-40 - Aeropuerto", LocationType.HIGHWAY_ACCESS, 40.4723, -3.5623));
        sensorList.add(new SensorInfo("TRAF-ACC-003", MadridDistrict.Villaverde,
            "Acceso A-4 Sur", LocationType.HIGHWAY_ACCESS, 40.3456, -3.6987));

        // Major intersections
        sensorList.add(new SensorInfo("TRAF-INT-001", MadridDistrict.Centro,
            "Plaza de España", LocationType.INTERSECTION, 40.4239, -3.7122));
        sensorList.add(new SensorInfo("TRAF-INT-002", MadridDistrict.Arganzuela,
            "Glorieta de Atocha", LocationType.INTERSECTION, 40.4067, -3.6919));
        sensorList.add(new SensorInfo("TRAF-INT-003", MadridDistrict.Latina,
            "Plaza de Castilla", LocationType.INTERSECTION, 40.4658, -3.6888));

        // Downtown areas
        sensorList.add(new SensorInfo("TRAF-DOWN-001", MadridDistrict.Centro,
            "Puerta del Sol", LocationType.DOWNTOWN, 40.4169, -3.7036));
        sensorList.add(new SensorInfo("TRAF-DOWN-002", MadridDistrict.Centro,
            "Plaza Mayor", LocationType.DOWNTOWN, 40.4155, -3.7074));

        return sensorList;
    }

    public List<SensorInfo> getSensors() {
        return sensors;
    }

    public TrafficSensor generateData(SensorInfo sensor) {
        long timestamp = System.currentTimeMillis();
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);

        // Simulate rush hour patterns (7-10 AM, 2-3 PM lunch, 6-9 PM evening)
        boolean isRushHour = (hour >= 7 && hour <= 10) || (hour >= 18 && hour <= 21);
        boolean isLunchHour = (hour >= 14 && hour <= 15);
        boolean isMidnight = hour >= 0 && hour <= 6;

        // Base traffic parameters depending on location type
        int baseVehicleCount = getBaseVehicleCount(sensor.locationType, isRushHour, isLunchHour, isMidnight);
        double baseSpeed = getBaseSpeed(sensor.locationType, isRushHour, isLunchHour, isMidnight);
        double baseOccupancy = getBaseOccupancy(sensor.locationType, isRushHour, isLunchHour, isMidnight);

        // Add random variation (+/- 20%)
        int vehicleCount = addVariation(baseVehicleCount, 0.2);
        double avgSpeed = addVariation(baseSpeed, 0.2);
        double occupancyPct = Math.min(100.0, addVariation(baseOccupancy, 0.2));

        // Determine traffic status based on speed and occupancy
        TrafficStatus status = determineTrafficStatus(avgSpeed, occupancyPct);

        // Occasional sensor offline (1% chance)
        if (random.nextDouble() < 0.01) {
            status = TrafficStatus.OFFLINE;
            avgSpeed = 0.0;
            vehicleCount = 0;
            occupancyPct = 0.0;
        }

        return TrafficSensor.newBuilder()
            .setSensorId(sensor.id)
            .setTimestamp(timestamp)
            .setDistrict(sensor.district)
            .setLocationName(sensor.locationName)
            .setLocationType(sensor.locationType)
            .setLatitude(sensor.lat)
            .setLongitude(sensor.lon)
            .setVehicleCount(vehicleCount)
            .setAvgSpeed(avgSpeed)
            .setOccupancyPct(occupancyPct)
            .setStatus(status)
            .build();
    }

    private int getBaseVehicleCount(LocationType type, boolean rushHour, boolean lunchHour, boolean midnight) {
        int base = switch (type) {
            case M30 -> 120;
            case MAIN_AVENUE -> 80;
            case HIGHWAY_ACCESS -> 100;
            case INTERSECTION -> 60;
            case DOWNTOWN -> 40;
        };

        if (midnight) return (int)(base * 0.2);
        if (rushHour) return (int)(base * 1.5);
        if (lunchHour) return (int)(base * 1.2); // Mini peak during lunch
        return base;
    }

    private double getBaseSpeed(LocationType type, boolean rushHour, boolean lunchHour, boolean midnight) {
        double base = switch (type) {
            case M30 -> 40.0;
            case MAIN_AVENUE -> 30.0;
            case HIGHWAY_ACCESS -> 45.0;
            case INTERSECTION -> 20.0;
            case DOWNTOWN -> 15.0;
        };

        if (midnight) return Math.min(60.0, base * 1.4);
        if (rushHour) return base * 0.5; // Heavy congestion in rush hour
        if (lunchHour) return base * 0.7; // Moderate congestion during lunch
        return base;
    }

    private double getBaseOccupancy(LocationType type, boolean rushHour, boolean lunchHour, boolean midnight) {
        double base = switch (type) {
            case M30 -> 45.0;
            case MAIN_AVENUE -> 55.0;
            case HIGHWAY_ACCESS -> 50.0;
            case INTERSECTION -> 65.0;
            case DOWNTOWN -> 70.0;
        };

        if (midnight) return base * 0.3;
        if (rushHour) return Math.min(95.0, base * 1.6);
        if (lunchHour) return Math.min(85.0, base * 1.3);
        return base;
    }

    private TrafficStatus determineTrafficStatus(double speed, double occupancy) {
        if (speed < 10 || occupancy > 90) return TrafficStatus.BLOCKED;
        if (speed < 30 || occupancy > 75) return TrafficStatus.CONGESTED;
        if (speed < 50 || occupancy > 60) return TrafficStatus.MODERATE;
        return TrafficStatus.FLUID;
    }

    private int addVariation(int base, double factor) {
        double variation = 1.0 + (random.nextDouble() * 2 - 1) * factor;
        return Math.max(0, (int)(base * variation));
    }

    private double addVariation(double base, double factor) {
        double variation = 1.0 + (random.nextDouble() * 2 - 1) * factor;
        return Math.max(0.0, base * variation);
    }
}
