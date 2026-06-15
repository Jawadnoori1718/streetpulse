package com.streetpulse.service;

import com.streetpulse.model.PoliceIncident;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PoliceApiService {

    // Polygon covering the core Uxbridge area (≈ 5.2 sq miles — within the 10 sq mile API limit)
    // Bounds: N=51.558, S=51.528, W=-0.507, E=-0.447
    private static final String UXBRIDGE_POLY =
        "51.558,-0.507:51.558,-0.447:51.528,-0.447:51.528,-0.507";

    private static final String BASE_URL =
        "https://data.police.uk/api/crimes-street/all-crime";

    private final RestTemplate restTemplate;

    public PoliceApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<PoliceIncident> fetchCrimes(String date) {
        String url = BASE_URL + "?poly=" + UXBRIDGE_POLY + "&date=" + date;
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> raw = restTemplate.getForObject(url, List.class);
            if (raw == null) return Collections.emptyList();
            return raw.stream()
                .map(this::mapToIncident)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("[StreetPulse] Police API error for " + date + ": " + e.getMessage());
            return Collections.emptyList();
        }
    }

    /** Merge last 3 available months (Police UK has ~2 month lag), deduplicate by id. */
    public List<PoliceIncident> fetchRecentCrimes() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        LocalDate now = LocalDate.now();

        Map<String, PoliceIncident> merged = new LinkedHashMap<>();
        for (int i = 1; i <= 3; i++) {
            String month = now.minusMonths(i).format(fmt);
            for (PoliceIncident pi : fetchCrimes(month)) {
                merged.putIfAbsent(pi.getId(), pi);
            }
        }
        return new ArrayList<>(merged.values());
    }

    @SuppressWarnings("unchecked")
    private PoliceIncident mapToIncident(Map<String, Object> raw) {
        try {
            String id          = String.valueOf(raw.get("id"));
            String rawCategory = (String) raw.get("category");
            String category    = formatCategory(rawCategory);

            Map<String, Object> location = (Map<String, Object>) raw.get("location");
            Double lat = null, lng = null;
            String streetName = null;
            if (location != null) {
                lat = parseDouble(location.get("latitude"));
                lng = parseDouble(location.get("longitude"));
                Map<String, Object> street = (Map<String, Object>) location.get("street");
                if (street != null) streetName = (String) street.get("name");
            }

            String month = (String) raw.get("month");

            String outcomeStatus = null;
            Map<String, Object> outcome = (Map<String, Object>) raw.get("outcome_status");
            if (outcome != null) outcomeStatus = (String) outcome.get("category");

            return new PoliceIncident(id, category, lat, lng, streetName, month, outcomeStatus, rawCategory);
        } catch (Exception e) {
            return null;
        }
    }

    /** Convert Police UK hyphenated slug to a human-readable label. */
    private String formatCategory(String raw) {
        if (raw == null) return "Other";
        return switch (raw) {
            case "anti-social-behaviour"  -> "Anti-social Behaviour";
            case "bicycle-theft"          -> "Bicycle Theft";
            case "burglary"               -> "Burglary";
            case "criminal-damage-arson"  -> "Criminal Damage & Arson";
            case "drugs"                  -> "Drugs";
            case "other-crime"            -> "Other Crime";
            case "other-theft"            -> "Other Theft";
            case "possession-of-weapons"  -> "Weapons Possession";
            case "public-order"           -> "Public Order";
            case "robbery"                -> "Robbery";
            case "shoplifting"            -> "Shoplifting";
            case "theft-from-the-person"  -> "Theft from Person";
            case "vehicle-crime"          -> "Vehicle Crime";
            case "violent-crime"          -> "Violent Crime";
            case "stalking-harassment"    -> "Stalking & Harassment";
            default -> {
                String s = raw.replace("-", " ");
                yield s.isEmpty() ? "Other" : Character.toUpperCase(s.charAt(0)) + s.substring(1);
            }
        };
    }

    private Double parseDouble(Object val) {
        if (val == null) return null;
        try { return Double.parseDouble(val.toString()); }
        catch (NumberFormatException e) { return null; }
    }
}
