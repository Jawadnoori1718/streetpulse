package com.streetpulse.controller;

import com.streetpulse.model.RiskResult;
import com.streetpulse.service.RiskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Spatiotemporal risk scoring.
 *
 * <p>Example: {@code GET /api/risk?lat=51.5462&lng=-0.4784&hour=23}
 */
@RestController
@RequestMapping("/api/risk")
public class RiskController {

    private final RiskService riskService;

    public RiskController(RiskService riskService) {
        this.riskService = riskService;
    }

    @GetMapping
    public ResponseEntity<?> risk(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(required = false) Integer hour) {

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return ResponseEntity.badRequest().body(
                java.util.Map.of("error", "lat must be -90..90 and lng must be -180..180"));
        }
        if (hour != null && (hour < 0 || hour > 23)) {
            return ResponseEntity.badRequest().body(
                java.util.Map.of("error", "hour must be 0..23"));
        }

        RiskResult result = riskService.computeRisk(lat, lng, hour);
        return ResponseEntity.ok(result);
    }
}
