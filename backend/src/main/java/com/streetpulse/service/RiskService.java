package com.streetpulse.service;

import com.streetpulse.model.Incident;
import com.streetpulse.model.IncidentSeverity;
import com.streetpulse.model.PoliceIncident;
import com.streetpulse.model.RiskResult;
import com.streetpulse.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Spatiotemporal risk model (explainable baseline).
 *
 * <p>For any point — and optionally an hour of day — this estimates a 0–100 risk score by
 * summing the influence of nearby events. Each event's influence is the product of:
 * <ul>
 *   <li><b>severity</b> — how serious the event is;</li>
 *   <li><b>recency</b>  — recent events count for more (exponential decay);</li>
 *   <li><b>spatial proximity</b> — a Gaussian kernel over distance (kernel-density style);</li>
 *   <li><b>temporal proximity</b> — when an hour is given, community reports near that
 *       hour-of-day count for more (police data has no time-of-day, so it is unaffected).</li>
 * </ul>
 *
 * <p>The raw sum is normalised against a data-derived reference (the 90th percentile of raw
 * scores observed at real event locations) so that the busiest hotspots land near 100.
 *
 * <p>This is the explainable baseline for Phase 3's learned model — every number it returns
 * can be traced back to the events that caused it (see {@link RiskResult#getTopFactors()}).
 */
@Service
public class RiskService {

    private final IncidentRepository incidentRepository;
    private final PoliceApiService policeApiService;

    /** Spatial kernel bandwidth in metres — larger = smoother, wider influence. */
    @Value("${risk.bandwidth-metres:400}")
    private double bandwidthMetres;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final double EARTH_RADIUS_M = 6_371_000.0;
    private static final double HOUR_SIGMA = 3.0;     // temporal kernel width, in hours
    private static final double POLICE_WEIGHT = 0.8;  // dampen volume-heavy police data slightly
    private static final double NEARBY_RADIUS_M = 500; // for the "within 500m" reported counts

    // Cached normalisation reference, invalidated when the event count changes.
    private volatile double cachedReference = 0;
    private volatile int cachedReferenceCount = -1;

    public RiskService(IncidentRepository incidentRepository, PoliceApiService policeApiService) {
        this.incidentRepository = incidentRepository;
        this.policeApiService = policeApiService;
    }

    // ── Public API ──────────────────────────────────────────────────────────────

    public RiskResult computeRisk(double lat, double lng, Integer hour) {
        List<Event> events = buildEvents();
        double reference = referenceScore(events);

        Accumulation acc = scoreAt(lat, lng, hour, events);
        int score = normalise(acc.raw, reference);
        String level = level(score);

        List<String> topFactors = acc.contributions.stream()
            .sorted(Comparator.comparingDouble((Contribution c) -> c.weight).reversed())
            .limit(5)
            .map(c -> String.format("%s — ~%dm away", c.event.label, Math.round(c.distance / 10.0) * 10))
            .collect(java.util.stream.Collectors.toList());

        String hourPart = hour != null ? String.format(" at %02d:00", hour) : "";
        String dominant = acc.contributions.isEmpty()
            ? ""
            : " Dominant factor: " + acc.contributions.stream()
                .max(Comparator.comparingDouble(c -> c.weight)).get().event.label + ".";
        String explanation = String.format(
            "Risk %d/100 (%s)%s. %d community report%s and %d police crime%s within %dm.%s",
            score, level, hourPart,
            acc.nearbyReports, acc.nearbyReports == 1 ? "" : "s",
            acc.nearbyCrimes,  acc.nearbyCrimes == 1 ? "" : "s",
            (int) NEARBY_RADIUS_M, dominant);

        return new RiskResult(lat, lng, hour, score, level,
            acc.nearbyReports, acc.nearbyCrimes, topFactors, explanation);
    }

    // ── Event assembly ──────────────────────────────────────────────────────────

    private List<Event> buildEvents() {
        List<Event> events = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Incident i : incidentRepository.findAll()) {
            if (i.getLatitude() == null || i.getLongitude() == null) continue;
            long ageDays = ChronoUnit.DAYS.between(i.getReportedAt(), now);
            double recency = Math.exp(-Math.max(0, ageDays) / 45.0); // ~31-day half-life
            String label = i.getTitle() + " (" + i.getSeverity() + ")";
            events.add(new Event(i.getLatitude(), i.getLongitude(),
                severityWeight(i.getSeverity()), recency, i.getReportedAt().getHour(), false, label));
        }

        LocalDate thisMonth = LocalDate.now().withDayOfMonth(1);
        for (PoliceIncident p : policeApiService.fetchRecentCrimes()) {
            if (p.getLatitude() == null || p.getLongitude() == null) continue;
            double recency = 0.6; // default if month is missing or unparseable
            try {
                // Police month is "yyyy-MM"; treat it as the first of that month.
                LocalDate m = LocalDate.parse(p.getMonth() + "-01", DATE_FMT);
                long monthsAgo = ChronoUnit.MONTHS.between(m.withDayOfMonth(1), thisMonth);
                recency = Math.exp(-Math.max(0, monthsAgo) / 6.0);
            } catch (Exception ignored) { /* keep default */ }
            String label = p.getCategory() + (p.getMonth() != null ? " (" + p.getMonth() + ")" : "");
            events.add(new Event(p.getLatitude(), p.getLongitude(),
                policeSeverityWeight(p.getRawCategory()) * POLICE_WEIGHT, recency, null, true, label));
        }
        return events;
    }

    // ── Scoring ─────────────────────────────────────────────────────────────────

    private Accumulation scoreAt(double lat, double lng, Integer hour, List<Event> events) {
        double bw = bandwidthMetres;
        double cutoff = bw * 3.0; // beyond 3 bandwidths the Gaussian weight is negligible
        Accumulation acc = new Accumulation();

        for (Event e : events) {
            double d = haversine(lat, lng, e.lat, e.lng);
            if (d > cutoff) continue;
            double spatial = Math.exp(-(d * d) / (2 * bw * bw));
            double temporal = (hour != null && e.hour != null) ? hourKernel(hour, e.hour) : 1.0;
            double weight = e.severity * e.recency * spatial * temporal;
            acc.raw += weight;
            if (d <= NEARBY_RADIUS_M) {
                if (e.police) acc.nearbyCrimes++; else acc.nearbyReports++;
            }
            if (weight > 0.01) acc.contributions.add(new Contribution(e, weight, d));
        }
        return acc;
    }

    /** 90th-percentile raw score across real event locations — a stable, data-derived scale. */
    private double referenceScore(List<Event> events) {
        if (events.isEmpty()) return 0;
        if (cachedReferenceCount == events.size() && cachedReference > 0) return cachedReference;

        // Sample to keep the O(n^2) reference pass cheap on larger datasets.
        List<Event> sample = events;
        if (events.size() > 300) {
            sample = new ArrayList<>(events);
            java.util.Collections.shuffle(sample, new java.util.Random(42));
            sample = sample.subList(0, 300);
        }

        List<Double> raws = new ArrayList<>(sample.size());
        for (Event at : sample) {
            Accumulation a = scoreAt(at.lat, at.lng, null, events);
            raws.add(Math.max(0, a.raw - at.severity * at.recency)); // exclude the point's own self-influence
        }
        raws.sort(Comparator.naturalOrder());
        int idx = (int) Math.floor(0.90 * (raws.size() - 1));
        double ref = raws.get(idx);

        cachedReference = ref > 0 ? ref : 1.0;
        cachedReferenceCount = events.size();
        return cachedReference;
    }

    private int normalise(double raw, double reference) {
        if (reference <= 0) return 0;
        return (int) Math.min(100, Math.round(100.0 * raw / reference));
    }

    private String level(int score) {
        if (score < 34) return "LOW";
        if (score < 67) return "MODERATE";
        return "HIGH";
    }

    // ── Weights & kernels ─────────────────────────────────────────────────────────

    private double severityWeight(IncidentSeverity s) {
        return switch (s) {
            case HIGH -> 3.0;
            case MEDIUM -> 2.0;
            case LOW -> 1.0;
        };
    }

    private double policeSeverityWeight(String rawCategory) {
        if (rawCategory == null) return 1.0;
        return switch (rawCategory) {
            case "violent-crime", "robbery", "possession-of-weapons" -> 3.0;
            case "burglary", "vehicle-crime", "theft-from-the-person",
                 "criminal-damage-arson", "drugs" -> 2.0;
            default -> 1.0;
        };
    }

    /** Circular kernel over hour-of-day (0–23 wraps around midnight). */
    private double hourKernel(int h1, int h2) {
        int diff = Math.abs(h1 - h2);
        int circular = Math.min(diff, 24 - diff);
        return Math.exp(-(circular * circular) / (2 * HOUR_SIGMA * HOUR_SIGMA));
    }

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(a));
    }

    // ── Internal value holders ────────────────────────────────────────────────────

    private static final class Event {
        final double lat, lng, severity, recency;
        final Integer hour;       // hour-of-day for community reports; null for police
        final boolean police;
        final String label;
        Event(double lat, double lng, double severity, double recency,
              Integer hour, boolean police, String label) {
            this.lat = lat; this.lng = lng; this.severity = severity; this.recency = recency;
            this.hour = hour; this.police = police; this.label = label;
        }
    }

    private static final class Contribution {
        final Event event; final double weight; final double distance;
        Contribution(Event event, double weight, double distance) {
            this.event = event; this.weight = weight; this.distance = distance;
        }
    }

    private static final class Accumulation {
        double raw = 0;
        int nearbyReports = 0, nearbyCrimes = 0;
        final List<Contribution> contributions = new ArrayList<>();
    }
}
