package com.streetpulse.controller;

import com.streetpulse.model.CreateIncidentRequest;
import com.streetpulse.model.Incident;
import com.streetpulse.model.IncidentCategory;
import com.streetpulse.model.IncidentSeverity;
import com.streetpulse.model.IncidentStats;
import com.streetpulse.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    @Autowired
    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents(
            @RequestParam(required = false) IncidentCategory category,
            @RequestParam(required = false) IncidentSeverity severity) {

        List<Incident> incidents;
        if (category != null) {
            incidents = incidentService.getByCategory(category);
        } else if (severity != null) {
            incidents = incidentService.getBySeverity(severity);
        } else {
            incidents = incidentService.getAllIncidents();
        }
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Incident>> getRecentIncidents() {
        return ResponseEntity.ok(incidentService.getRecentIncidents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncidentById(@PathVariable Long id) {
        return incidentService.getIncidentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Incident> createIncident(@Valid @RequestBody CreateIncidentRequest req) {
        Incident incident = new Incident();
        incident.setTitle(req.getTitle());
        incident.setDescription(req.getDescription());
        incident.setCategory(req.getCategory());
        incident.setSeverity(req.getSeverity());
        incident.setLatitude(req.getLatitude());
        incident.setLongitude(req.getLongitude());
        incident.setArea(req.getArea());
        incident.setReporterEmail(req.getReporterEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentService.createIncident(incident));
    }

    @PatchMapping("/{id}/upvote")
    public ResponseEntity<Incident> upvoteIncident(@PathVariable Long id) {
        return ResponseEntity.ok(incidentService.upvoteIncident(id));
    }

    @GetMapping("/analytics")
    public ResponseEntity<IncidentStats> getAnalytics() {
        return ResponseEntity.ok(incidentService.getStats());
    }
}
