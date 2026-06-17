package com.streetpulse.service;

import com.streetpulse.model.Incident;
import com.streetpulse.model.IncidentSeverity;
import com.streetpulse.repository.IncidentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Agentic report triage: runs automatically when a new report is submitted to keep the
 * community data clean and accurate.
 *
 * <ul>
 *   <li><b>Severity escalation</b> — forces HIGH severity when the text clearly describes
 *       dangerous activity (weapons, assault, being followed), regardless of what the
 *       reporter selected.</li>
 *   <li><b>De-duplication</b> — detects a near-identical recent report nearby so the same
 *       issue isn't logged twice; the caller merges into the existing one instead.</li>
 * </ul>
 */
@Service
public class TriageService {

    private static final double DUPLICATE_RADIUS_M = 150;   // "same place"
    private static final int DUPLICATE_WINDOW_HOURS = 48;   // "around the same time"
    private static final double EARTH_RADIUS_M = 6_371_000.0;

    private static final Set<String> DANGER_WORDS = Set.of(
        "knife", "weapon", "gun", "firearm", "machete", "assault", "attack", "attacked",
        "robbery", "robbed", "mugged", "mugging", "stabbed", "stabbing", "followed",
        "stalker", "stalking", "threatened", "threat", "violence", "violent", "fight", "fighting");

    private final IncidentRepository incidentRepository;

    public TriageService(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    /** Force HIGH severity when the text describes clearly dangerous activity. Returns true if changed. */
    public boolean escalateSeverityIfDangerous(Incident incident) {
        if (incident.getSeverity() == IncidentSeverity.HIGH) return false;
        String text = ((incident.getTitle() == null ? "" : incident.getTitle()) + " "
            + (incident.getDescription() == null ? "" : incident.getDescription())).toLowerCase();
        for (String word : DANGER_WORDS) {
            if (text.contains(word)) {
                incident.setSeverity(IncidentSeverity.HIGH);
                return true;
            }
        }
        return false;
    }

    /** Find a near-duplicate: same category, within ~150m, reported in the last 48h. */
    public Optional<Incident> findDuplicate(Incident incident) {
        if (incident.getLatitude() == null || incident.getLongitude() == null) return Optional.empty();
        List<Incident> recent = incidentRepository.findByReportedAtAfter(
            LocalDateTime.now().minusHours(DUPLICATE_WINDOW_HOURS));
        return recent.stream()
            .filter(i -> i.getId() != null)
            .filter(i -> i.getCategory() == incident.getCategory())
            .filter(i -> i.getLatitude() != null && i.getLongitude() != null)
            .filter(i -> haversine(incident.getLatitude(), incident.getLongitude(),
                i.getLatitude(), i.getLongitude()) <= DUPLICATE_RADIUS_M)
            .findFirst();
    }

    private static double haversine(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(a));
    }
}
