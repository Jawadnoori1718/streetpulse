package com.streetpulse.controller;

import com.streetpulse.model.PoliceIncident;
import com.streetpulse.service.PoliceApiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/police")
public class PoliceController {

    private final PoliceApiService policeApiService;

    public PoliceController(PoliceApiService policeApiService) {
        this.policeApiService = policeApiService;
    }

    @GetMapping("/crimes")
    public ResponseEntity<List<PoliceIncident>> getCrimes(
            @RequestParam(required = false) String date) {

        if (date == null || date.isBlank()) {
            date = java.time.LocalDate.now().minusMonths(2)
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM"));
        }
        return ResponseEntity.ok(policeApiService.fetchCrimes(date));
    }

    @GetMapping("/crimes/recent")
    public ResponseEntity<List<PoliceIncident>> getRecentCrimes() {
        return ResponseEntity.ok(policeApiService.fetchRecentCrimes());
    }
}
