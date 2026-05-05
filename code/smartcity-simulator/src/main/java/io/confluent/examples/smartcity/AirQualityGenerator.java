package io.confluent.examples.smartcity;

import java.util.*;

/**
 * Generates realistic air quality data for Madrid monitoring stations
 */
public class AirQualityGenerator {
    private final List<StationInfo> stations;
    private final Random random = new Random();

    static class StationInfo {
        String id;
        String district;
        String locationName;
        double lat;
        double lon;
        boolean isUrbanCore; // Higher pollution in city center

        StationInfo(String id, String district, String locationName,
                   double lat, double lon, boolean isUrbanCore) {
            this.id = id;
            this.district = district;
            this.locationName = locationName;
            this.lat = lat;
            this.lon = lon;
            this.isUrbanCore = isUrbanCore;
        }
    }

    public AirQualityGenerator() {
        this.stations = initializeStations();
    }

    private List<StationInfo> initializeStations() {
        List<StationInfo> stationList = new ArrayList<>();

        // Urban core stations (higher pollution)
        stationList.add(new StationInfo("AIR-CENTRO-001", "Centro",
            "Plaza del Carmen", 40.4197, -3.7033, true));
        stationList.add(new StationInfo("AIR-CENTRO-002", "Centro",
            "Plaza de España", 40.4239, -3.7122, true));
        stationList.add(new StationInfo("AIR-SALAMANCA-001", "Salamanca",
            "Serrano - Goya", 40.4258, -3.6782, true));
        stationList.add(new StationInfo("AIR-CHAMBERI-001", "Chamberi",
            "Paseo de la Castellana", 40.4398, -3.6889, true));

        // Mid-level pollution areas
        stationList.add(new StationInfo("AIR-ARGANZUELA-001", "Arganzuela",
            "Paseo de las Delicias", 40.3988, -3.6954, false));
        stationList.add(new StationInfo("AIR-TETUAN-001", "Tetuan",
            "Bravo Murillo", 40.4587, -3.6987, false));
        stationList.add(new StationInfo("AIR-CARABANCHEL-001", "Carabanchel",
            "General Ricardos", 40.3876, -3.7234, false));

        // Parks and green areas (lower pollution)
        stationList.add(new StationInfo("AIR-RETIRO-001", "Retiro",
            "Parque del Retiro", 40.4153, -3.6844, false));
        stationList.add(new StationInfo("AIR-MONCLOA-001", "Moncloa_Aravaca",
            "Casa de Campo", 40.4323, -3.7556, false));
        stationList.add(new StationInfo("AIR-FUENCARRAL-001", "Fuencarral_El_Pardo",
            "Monte de El Pardo", 40.5123, -3.7789, false));

        // Peripheral areas
        stationList.add(new StationInfo("AIR-BARAJAS-001", "Barajas",
            "Alameda de Osuna", 40.4523, -3.5789, false));
        stationList.add(new StationInfo("AIR-VILLAVERDE-001", "Villaverde",
            "San Cristóbal", 40.3456, -3.7123, false));

        return stationList;
    }

    public List<StationInfo> getStations() {
        return stations;
    }

    public AirQualityStation generateData(StationInfo station) {
        long timestamp = System.currentTimeMillis();
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);

        // Pollution increases during rush hours and decreases at night
        boolean isRushHour = (hour >= 7 && hour <= 10) || (hour >= 18 && hour <= 21);
        boolean isLunchHour = (hour >= 14 && hour <= 15);
        boolean isNight = hour >= 22 || hour <= 6;

        // Base pollution levels
        double basePollutionFactor = station.isUrbanCore ? 1.5 : 1.0;
        if (isRushHour) basePollutionFactor *= 1.4;
        if (isLunchHour) basePollutionFactor *= 1.2;
        if (isNight) basePollutionFactor *= 0.6;

        // Generate pollutant concentrations
        double no2 = generateNO2(basePollutionFactor);
        double pm25 = generatePM25(basePollutionFactor);
        double pm10 = generatePM10(basePollutionFactor);
        double o3 = generateO3(basePollutionFactor, hour);
        double co = generateCO(basePollutionFactor);

        // Calculate AQI based on worst pollutant
        int aqi = calculateAQI(no2, pm25, pm10, o3, co);
        AirQualityLevel qualityLevel = determineQualityLevel(aqi);

        // 2% chance of station issues
        StationStatus status = StationStatus.ONLINE;
        if (random.nextDouble() < 0.02) {
            status = random.nextBoolean() ? StationStatus.MAINTENANCE : StationStatus.ERROR;
        }

        return AirQualityStation.newBuilder()
            .setStationId(station.id)
            .setTimestamp(timestamp)
            .setDistrict(station.district)
            .setLocationName(station.locationName)
            .setLatitude(station.lat)
            .setLongitude(station.lon)
            .setNo2(no2)
            .setPm25(pm25)
            .setPm10(pm10)
            .setO3(o3)
            .setCo(co)
            .setAqi(aqi)
            .setQualityLevel(qualityLevel)
            .setStatus(status)
            .build();
    }

    private double generateNO2(double factor) {
        // Normal range: 20-40 µg/m³, limit: 40, bad: >100
        double base = 25.0 + random.nextGaussian() * 10.0;
        return Math.max(5.0, Math.min(150.0, base * factor));
    }

    private double generatePM25(double factor) {
        // Good: <12, moderate: 12-35, bad: >35
        double base = 15.0 + random.nextGaussian() * 8.0;
        return Math.max(3.0, Math.min(80.0, base * factor));
    }

    private double generatePM10(double factor) {
        // Good: <20, moderate: 20-50, bad: >50
        double base = 25.0 + random.nextGaussian() * 12.0;
        return Math.max(5.0, Math.min(120.0, base * factor));
    }

    private double generateO3(double factor, int hour) {
        // Ozone peaks in afternoon sun (12-16h), lower at night
        double base = 45.0 + random.nextGaussian() * 15.0;
        double timeFactor = (hour >= 12 && hour <= 16) ? 1.4 : 0.8;
        return Math.max(10.0, Math.min(180.0, base * factor * timeFactor));
    }

    private double generateCO(double factor) {
        // Normal: 0.3-0.8 mg/m³
        double base = 0.5 + random.nextGaussian() * 0.2;
        return Math.max(0.1, Math.min(3.0, base * factor));
    }

    private int calculateAQI(double no2, double pm25, double pm10, double o3, double co) {
        // Simplified AQI calculation based on worst pollutant
        int aqiNO2 = (int)((no2 / 40.0) * 100);
        int aqiPM25 = (int)((pm25 / 12.0) * 50);
        int aqiPM10 = (int)((pm10 / 20.0) * 50);
        int aqiO3 = (int)((o3 / 120.0) * 100);
        int aqiCO = (int)((co / 0.5) * 50);

        int worstAQI = Math.max(aqiNO2, Math.max(aqiPM25, Math.max(aqiPM10, Math.max(aqiO3, aqiCO))));
        return Math.min(300, Math.max(0, worstAQI));
    }

    private AirQualityLevel determineQualityLevel(int aqi) {
        if (aqi <= 50) return AirQualityLevel.GOOD;
        if (aqi <= 100) return AirQualityLevel.MODERATE;
        if (aqi <= 150) return AirQualityLevel.UNHEALTHY_SENSITIVE;
        if (aqi <= 200) return AirQualityLevel.UNHEALTHY;
        if (aqi <= 300) return AirQualityLevel.VERY_UNHEALTHY;
        return AirQualityLevel.HAZARDOUS;
    }
}
