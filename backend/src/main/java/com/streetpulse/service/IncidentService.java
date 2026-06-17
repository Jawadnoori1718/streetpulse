package com.streetpulse.service;

import com.streetpulse.model.*;
import com.streetpulse.repository.IncidentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);

    private final IncidentRepository incidentRepository;
    private final TriageService triageService;

    @Autowired
    public IncidentService(IncidentRepository incidentRepository, TriageService triageService) {
        this.incidentRepository = incidentRepository;
        this.triageService = triageService;
    }

    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }

    public Optional<Incident> getIncidentById(Long id) {
        return incidentRepository.findById(id);
    }

    public Incident createIncident(Incident incident) {
        incident.setReportedAt(LocalDateTime.now());
        incident.setUpvotes(0);

        // ── Agentic triage ───────────────────────────────────────────────
        boolean escalated = triageService.escalateSeverityIfDangerous(incident);

        Optional<Incident> duplicate = triageService.findDuplicate(incident);
        if (duplicate.isPresent()) {
            // Merge: treat the new submission as a confirmation of the existing report.
            Incident existing = duplicate.get();
            existing.setUpvotes(existing.getUpvotes() + 1);
            Incident merged = incidentRepository.save(existing);
            log.info("Triage: merged duplicate report into incident {} (now {} upvotes)",
                    merged.getId(), merged.getUpvotes());
            return merged;
        }

        Incident saved = incidentRepository.save(incident);
        log.info("New incident reported{}: [{}] {} at ({}, {})",
                escalated ? " (severity escalated by triage)" : "",
                saved.getSeverity(), saved.getTitle(),
                saved.getLatitude(), saved.getLongitude());
        return saved;
    }

    public Incident upvoteIncident(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found: " + id));
        incident.setUpvotes(incident.getUpvotes() + 1);
        return incidentRepository.save(incident);
    }

    public List<Incident> getByCategory(IncidentCategory category) {
        return incidentRepository.findByCategory(category);
    }

    public List<Incident> getBySeverity(IncidentSeverity severity) {
        return incidentRepository.findBySeverity(severity);
    }

    public List<Incident> getRecentIncidents() {
        return incidentRepository.findTop20ByOrderByReportedAtDesc();
    }

    public IncidentStats getStats() {
        LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
        return new IncidentStats(
                incidentRepository.count(),
                incidentRepository.countByCategory(IncidentCategory.LIGHTING),
                incidentRepository.countByCategory(IncidentCategory.HAZARD),
                incidentRepository.countByCategory(IncidentCategory.SUSPICIOUS),
                incidentRepository.countBySeverity(IncidentSeverity.HIGH),
                incidentRepository.countBySeverity(IncidentSeverity.MEDIUM),
                incidentRepository.countBySeverity(IncidentSeverity.LOW),
                incidentRepository.findMostActiveArea(),
                incidentRepository.findByReportedAtAfter(yesterday).size()
        );
    }
}
