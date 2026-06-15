package com.streetpulse.service;

import com.streetpulse.model.PoliceIncident;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
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

    /** How many months of history to merge. Each month is one upstream API call. */
    @Value("${police.history.months:12}")
    private int historyMonths;

    /** How long the merged result stays cached before a refresh is allowed. */
    @Value("${police.cache.ttl-minutes:360}")
    private long cacheTtlMinutes;

    // Simple time-boxed in-memory cache — avoids re-fetching 12 months on every request.
    private volatile List<PoliceIncident> cachedRecent = Collections.emptyList();
    private volatile long cachedAtMillis = 0L;

    public PoliceApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /** Warm the cache in the background on startup so the first user request is fast. */
    @PostConstruct
    public void warmCacheAsync() {
        Thread t = new Thread(() -> {
            try {
                fetchRecentCrimes();
                System.out.println("[StreetPulse] Police data cache warmed (" + cachedRecent.size()
                    + " crimes over " + historyMonths + " months).");
            } catch (Exception e) {
                System.err.println("[StreetPulse] Police cache warm failed: " + e.getMessage());
            }
        }, "police-cache-warmer");
        t.setDaemon(true);
        t.start();
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

    /**
     * Merge the last {@code historyMonths} available months (Police UK has a ~2 month lag),
     * deduplicated by id. Results are cached for {@code cacheTtlMinutes} to avoid hammering
     * the upstream API on every request.
     */
    public List<PoliceIncident> fetchRecentCrimes() {
        long ageMillis = System.currentTimeMillis() - cachedAtMillis;
        if (!cachedRecent.isEmpty() && ageMillis < cacheTtlMinutes * 60_000L) {
            return cachedRecent;
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        LocalDate now = LocalDate.now();

        Map<String, PoliceIncident> merged = new LinkedHashMap<>();
        int months = Math.max(1, historyMonths);
        // Start at month -2 (data lag) and walk back through the requested history window.
        for (int i = 2; i < 2 + months; i++) {
            String month = now.minusMonths(i).format(fmt);
            for (PoliceIncident pi : fetchCrimes(month)) {
                merged.putIfAbsent(pi.getId(), pi);
            }
        }

        List<PoliceIncident> result = new ArrayList<>(merged.values());
        // Only replace a populated cache if the fresh fetch actually returned data,
        // so a transient upstream outage doesn't wipe good cached data.
        if (!result.isEmpty() || cachedRecent.isEmpty()) {
            cachedRecent = result;
            cachedAtMillis = System.currentTimeMillis();
        }
        return cachedRecent;
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
