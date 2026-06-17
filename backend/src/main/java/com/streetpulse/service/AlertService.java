package com.streetpulse.service;

import com.streetpulse.model.Alert;
import com.streetpulse.model.Incident;
import com.streetpulse.model.IncidentSeverity;
import com.streetpulse.repository.IncidentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Builds the live alerts feed — the most recent high-priority activity the community
 * should know about right now.
 */
@Service
public class AlertService {

    private static final int RECENT_HOURS = 24;
    private static final int MAX_ALERTS = 5;

    private final IncidentRepository incidentRepository;

    public AlertService(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    public List<Alert> getActiveAlerts() {
        LocalDateTime since = LocalDateTime.now().minusHours(RECENT_HOURS);

        List<Incident> recentHigh = incidentRepository.findByReportedAtAfter(since).stream()
            .filter(i -> i.getSeverity() == IncidentSeverity.HIGH)
            .sorted(Comparator.comparing(Incident::getReportedAt).reversed())
            .limit(MAX_ALERTS)
            .toList();

        List<Alert> alerts = new ArrayList<>();
        for (Incident i : recentHigh) {
            String area = i.getArea() != null ? i.getArea() : "West London";
            alerts.add(new Alert("HIGH", i.getTitle(),
                "High-severity report in " + area, i.getArea(),
                i.getLatitude(), i.getLongitude(), i.getReportedAt()));
        }

        if (alerts.isEmpty()) {
            String hotspot = incidentRepository.findMostActiveArea();
            String msg = hotspot != null
                ? "No high-priority alerts in the last 24 hours. Most active area: " + hotspot + "."
                : "No high-priority alerts in the last 24 hours.";
            alerts.add(new Alert("INFO", "All clear", msg, hotspot, null, null, null));
        }
        return alerts;
    }
}
