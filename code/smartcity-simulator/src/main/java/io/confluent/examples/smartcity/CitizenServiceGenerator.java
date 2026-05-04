package io.confluent.examples.smartcity;

import java.util.*;
import java.text.SimpleDateFormat;

/**
 * Generates realistic citizen service requests (Avisos Madrid - línea 010)
 */
public class CitizenServiceGenerator {
    private final Random random = new Random();
    private final Map<String, ServiceTicket> activeTickets = new HashMap<>();
    private int ticketCounter = 1;

    static class ServiceTicket {
        String ticketId;
        long createdAt;
        String district;
        String address;
        double lat;
        double lon;
        ServiceCategory category;
        String subcategory;
        String description;
        Priority priority;
        ServiceStatus status;
        int slaHours;
        Long updatedAt;
        Long resolvedAt;
    }

    private static final String[] MADRID_DISTRICTS = {
        "Centro", "Arganzuela", "Retiro", "Salamanca", "Chamartin",
        "Tetuan", "Chamberi", "Fuencarral_El_Pardo", "Moncloa_Aravaca",
        "Latina", "Carabanchel", "Usera", "Puente_de_Vallecas", "Moratalaz",
        "Ciudad_Lineal", "Hortaleza", "Villaverde", "Villa_de_Vallecas",
        "Vicalvaro", "San_Blas_Canillejas", "Barajas"
    };

    private static final Map<ServiceCategory, String[]> SUBCATEGORIES = new HashMap<>() {{
        put(ServiceCategory.ALUMBRADO_PUBLICO, new String[]{
            "Farola apagada", "Farola intermitente", "Bombilla fundida", "Poste dañado"
        });
        put(ServiceCategory.LIMPIEZA_BASURA, new String[]{
            "Contenedor lleno", "Contenedor dañado", "Basura acumulada", "Falta de limpieza"
        });
        put(ServiceCategory.BACHES_PAVIMENTO, new String[]{
            "Bache en calzada", "Acera rota", "Pavimento levantado", "Socavón"
        });
        put(ServiceCategory.PARQUES_JARDINES, new String[]{
            "Árbol caído", "Ramas peligrosas", "Zona verde descuidada", "Fuente sin agua"
        });
        put(ServiceCategory.MOBILIARIO_URBANO, new String[]{
            "Banco roto", "Papelera dañada", "Señal de tráfico caída", "Valla deteriorada"
        });
        put(ServiceCategory.OTROS, new String[]{
            "Grafiti", "Ruido excesivo", "Ocupación vía pública", "Otros"
        });
    }};

    public CitizenService generateNewService() {
        long now = System.currentTimeMillis();
        String ticketId = generateTicketId(now);

        // Select random category and subcategory
        ServiceCategory category = randomCategory();
        String subcategory = randomSubcategory(category);

        // Select random location
        String district = MADRID_DISTRICTS[random.nextInt(MADRID_DISTRICTS.length)];
        String address = generateAddress(district);
        double[] coords = generateCoordinates();

        // Determine priority based on category and time
        Priority priority = determinePriority(category, subcategory);

        // Calculate SLA hours based on priority
        int slaHours = calculateSLA(priority);

        // Generate description
        String description = generateDescription(category, subcategory, address);

        // Create ticket record
        ServiceTicket ticket = new ServiceTicket();
        ticket.ticketId = ticketId;
        ticket.createdAt = now;
        ticket.district = district;
        ticket.address = address;
        ticket.lat = coords[0];
        ticket.lon = coords[1];
        ticket.category = category;
        ticket.subcategory = subcategory;
        ticket.description = description;
        ticket.priority = priority;
        ticket.status = ServiceStatus.ABIERTO;
        ticket.slaHours = slaHours;

        // Store ticket for future updates
        activeTickets.put(ticketId, ticket);

        return buildCitizenService(ticket);
    }

    public List<CitizenService> updateExistingServices() {
        List<CitizenService> updates = new ArrayList<>();
        long now = System.currentTimeMillis();

        // Update 50% of active tickets each interval (faster progression)
        List<String> ticketIds = new ArrayList<>(activeTickets.keySet());
        Collections.shuffle(ticketIds);

        int updateCount = Math.max(1, ticketIds.size() / 2);
        for (int i = 0; i < Math.min(updateCount, ticketIds.size()); i++) {
            ServiceTicket ticket = activeTickets.get(ticketIds.get(i));

            // Progress ticket through workflow
            ServiceStatus newStatus = progressStatus(ticket.status, ticket.createdAt, now, ticket.slaHours);

            if (newStatus != ticket.status) {
                ticket.status = newStatus;
                ticket.updatedAt = now;

                if (newStatus == ServiceStatus.RESUELTO || newStatus == ServiceStatus.CERRADO) {
                    ticket.resolvedAt = now;
                }

                updates.add(buildCitizenService(ticket));

                // Remove closed/rejected tickets after sending update
                if (newStatus == ServiceStatus.CERRADO || newStatus == ServiceStatus.RECHAZADO) {
                    activeTickets.remove(ticket.ticketId);
                }
            }
        }

        return updates;
    }

    private String generateTicketId(long timestamp) {
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MMdd");
        String datePart = df.format(new Date(timestamp));
        return String.format("AVM-%s-%04d", datePart, ticketCounter++);
    }

    private ServiceCategory randomCategory() {
        ServiceCategory[] categories = ServiceCategory.values();
        // Weight towards common categories
        int rand = random.nextInt(100);
        if (rand < 30) return ServiceCategory.LIMPIEZA_BASURA;
        if (rand < 50) return ServiceCategory.ALUMBRADO_PUBLICO;
        if (rand < 70) return ServiceCategory.BACHES_PAVIMENTO;
        if (rand < 85) return ServiceCategory.MOBILIARIO_URBANO;
        if (rand < 95) return ServiceCategory.PARQUES_JARDINES;
        return ServiceCategory.OTROS;
    }

    private String randomSubcategory(ServiceCategory category) {
        String[] subs = SUBCATEGORIES.get(category);
        return subs[random.nextInt(subs.length)];
    }

    private String generateAddress(String district) {
        String[] streetTypes = {"Calle", "Avenida", "Plaza", "Paseo"};
        String[] streetNames = {"Mayor", "Gran Vía", "Alcalá", "Serrano", "Goya",
            "Bravo Murillo", "General Ricardos", "Embajadores", "Toledo", "Atocha"};

        String streetType = streetTypes[random.nextInt(streetTypes.length)];
        String streetName = streetNames[random.nextInt(streetNames.length)];
        int number = 1 + random.nextInt(150);

        return String.format("%s %s, %d", streetType, streetName, number);
    }

    private double[] generateCoordinates() {
        // Madrid coordinates: lat 40.3-40.5, lon -3.9 to -3.5
        double lat = 40.3 + random.nextDouble() * 0.2;
        double lon = -3.9 + random.nextDouble() * 0.4;
        return new double[]{lat, lon};
    }

    private Priority determinePriority(ServiceCategory category, String subcategory) {
        // Urgent: safety hazards
        if (subcategory.contains("Socavón") || subcategory.contains("Árbol caído") ||
            subcategory.contains("Poste dañado")) {
            return Priority.URGENTE;
        }

        // High: impact on daily life
        if (category == ServiceCategory.BACHES_PAVIMENTO ||
            subcategory.contains("Contenedor lleno")) {
            return Priority.ALTA;
        }

        // Medium: moderate impact
        if (category == ServiceCategory.ALUMBRADO_PUBLICO ||
            category == ServiceCategory.LIMPIEZA_BASURA) {
            return Priority.MEDIA;
        }

        // Low: cosmetic or minor issues
        return Priority.BAJA;
    }

    private int calculateSLA(Priority priority) {
        return switch (priority) {
            case URGENTE -> 4;    // 4 hours
            case ALTA -> 24;      // 24 hours
            case MEDIA -> 72;     // 3 days
            case BAJA -> 168;     // 7 days
        };
    }

    private String generateDescription(ServiceCategory category, String subcategory, String address) {
        String[] templates = {
            "Se reporta %s en %s. Requiere atención.",
            "Ciudadano informa de %s en la ubicación %s.",
            "Aviso: %s detectado en %s. Solicitud de reparación.",
            "Incidencia reportada: %s en %s."
        };

        String template = templates[random.nextInt(templates.length)];
        return String.format(template, subcategory.toLowerCase(), address);
    }

    private ServiceStatus progressStatus(ServiceStatus current, long createdAt, long now, int slaHours) {
        long ageMinutes = (now - createdAt) / (1000 * 60);

        // Faster progression - tickets resolve within minutes instead of hours
        double progressChance = Math.min(0.8, ageMinutes / 30.0); // Progress faster, max 80% chance

        if (random.nextDouble() > progressChance) {
            return current; // No change
        }

        return switch (current) {
            case ABIERTO -> {
                // 5% chance of rejection
                if (random.nextDouble() < 0.05) yield ServiceStatus.RECHAZADO;
                yield ServiceStatus.EN_PROCESO;
            }
            case EN_PROCESO -> {
                // 80% to validation, 20% stay in process
                if (random.nextDouble() < 0.8) yield ServiceStatus.PENDIENTE_VALIDACION;
                yield ServiceStatus.EN_PROCESO;
            }
            case PENDIENTE_VALIDACION -> {
                // 90% resolve, 10% back to process
                if (random.nextDouble() < 0.9) yield ServiceStatus.RESUELTO;
                yield ServiceStatus.EN_PROCESO;
            }
            case RESUELTO -> {
                // After resolution, close after short period (10 minutes)
                if (ageMinutes > 10) yield ServiceStatus.CERRADO;
                yield ServiceStatus.RESUELTO;
            }
            default -> current;
        };
    }

    private CitizenService buildCitizenService(ServiceTicket ticket) {
        // Generate realistic (masked) citizen contact info for some tickets
        String email = random.nextDouble() < 0.7 ? generateEmail() : null;
        String phone = random.nextDouble() < 0.6 ? generatePhone() : null;

        return CitizenService.newBuilder()
            .setTicketId(ticket.ticketId)
            .setCreatedAt(ticket.createdAt)
            .setUpdatedAt(ticket.updatedAt)
            .setResolvedAt(ticket.resolvedAt)
            .setDistrict(ticket.district)
            .setAddress(ticket.address)
            .setLatitude(ticket.lat)
            .setLongitude(ticket.lon)
            .setCategory(ticket.category)
            .setSubcategory(ticket.subcategory)
            .setDescription(ticket.description)
            .setPriority(ticket.priority)
            .setStatus(ticket.status)
            .setSlaHours(ticket.slaHours)
            .setCitizenEmail(email)
            .setCitizenPhone(phone)
            .build();
    }

    private String generateEmail() {
        String[] domains = {"gmail.com", "hotmail.com", "yahoo.es", "outlook.com"};
        return String.format("ciudadano%d@%s",
            1000 + random.nextInt(9000),
            domains[random.nextInt(domains.length)]);
    }

    private String generatePhone() {
        return String.format("6%d-%03d-%03d",
            random.nextInt(10),
            random.nextInt(1000),
            random.nextInt(1000));
    }
}
