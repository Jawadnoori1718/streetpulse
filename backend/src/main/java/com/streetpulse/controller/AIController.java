package com.streetpulse.controller;

import com.streetpulse.model.Incident;
import com.streetpulse.model.IncidentCategory;
import com.streetpulse.model.IncidentSeverity;
import com.streetpulse.model.PoliceIncident;
import com.streetpulse.repository.IncidentRepository;
import com.streetpulse.service.GeminiAgentService;
import com.streetpulse.service.PoliceApiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;
    private final IncidentRepository incidentRepository;
    private final PoliceApiService policeApiService;
    private final GeminiAgentService agentService;

    public AIController(RestTemplate restTemplate,
                        IncidentRepository incidentRepository,
                        PoliceApiService policeApiService,
                        GeminiAgentService agentService) {
        this.restTemplate = restTemplate;
        this.incidentRepository = incidentRepository;
        this.policeApiService = policeApiService;
        this.agentService = agentService;
    }

    @PostConstruct
    public void init() {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            System.out.println("[StreetPulse] Gemini key not set — data-driven fallback will be used.");
        } else {
            System.out.println("[StreetPulse] Gemini key loaded (length=" + geminiApiKey.length() + ").");
        }
    }

    @PostMapping("/analyse")
    public ResponseEntity<Map<String, String>> analyseRoute(@RequestBody Map<String, String> request) {
        String userPrompt = request.get("prompt");

        if (userPrompt == null || userPrompt.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Prompt is required"));
        }

        // ── 1. Build rich context from real data ─────────────────
        String dataContext = buildDataContext(userPrompt);

        // ── 2. Try Gemini if key is configured ───────────────────
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            String[] models = { "gemini-2.0-flash", "gemini-1.5-flash" };
            for (String model : models) {
                try {
                    String result = callGemini(model, userPrompt, dataContext);
                    System.out.println("[StreetPulse] Gemini (" + model + ") OK.");
                    return ResponseEntity.ok(Map.of("analysis", result));
                } catch (HttpClientErrorException e) {
                    System.err.println("[StreetPulse] Gemini (" + model + ") HTTP " + e.getStatusCode());
                    if (e.getStatusCode().value() != 404) break;
                } catch (Exception e) {
                    System.err.println("[StreetPulse] Gemini (" + model + ") error: " + e.getMessage());
                    break;
                }
            }
            System.out.println("[StreetPulse] Gemini unavailable — falling back to data-driven analysis.");
        }

        // ── 3. Data-driven fallback ───────────────────────────────
        try {
            return ResponseEntity.ok(Map.of("analysis", generateDataDrivenAnalysis(userPrompt)));
        } catch (Exception e) {
            System.err.println("[StreetPulse] Data analysis error: " + e.getMessage());
            return ResponseEntity.ok(Map.of("analysis", generateStaticFallback()));
        }
    }

    /**
     * Agentic endpoint: a Claude agent that uses tools to query real data before answering.
     * Falls back to the data-driven analysis when no Anthropic key is configured or the call fails.
     */
    @PostMapping("/agent")
    public ResponseEntity<Map<String, String>> agent(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        if (message == null || message.isBlank()) {
            message = request.get("prompt"); // accept either key
        }
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message is required"));
        }

        if (agentService.isAvailable()) {
            try {
                String reply = agentService.chat(message);
                if (reply != null && !reply.isBlank()) {
                    return ResponseEntity.ok(Map.of("reply", reply, "mode", "agent"));
                }
            } catch (Exception e) {
                System.err.println("[StreetPulse] Agent error, falling back: " + e.getMessage());
            }
        }

        // Fallback — keeps the assistant useful with no Anthropic key.
        try {
            return ResponseEntity.ok(Map.of("reply", generateDataDrivenAnalysis(message), "mode", "fallback"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("reply", generateStaticFallback(), "mode", "fallback"));
        }
    }

    // ── Build real-data context for Gemini prompt ──────────────────────────────

    private String buildDataContext(String userPrompt) {
        List<Incident> all = incidentRepository.findAll();
        if (all.isEmpty()) return "";

        Set<String> stopWords = Set.of("from", "to", "the", "and", "for", "that",
            "this", "with", "about", "what", "where", "walk", "walking", "cycling",
            "safe", "safety", "area", "areas", "night", "dark", "late", "after", "near");

        List<String> keywords = Arrays.stream(userPrompt.toLowerCase().split("[\\s,;.!?'\"]+"))
            .filter(w -> w.length() >= 4 && !stopWords.contains(w))
            .distinct()
            .collect(Collectors.toList());

        List<Incident> relevant = all.stream()
            .filter(i -> {
                String haystack = ((i.getArea() != null ? i.getArea() : "") + " " + i.getTitle()).toLowerCase();
                return keywords.stream().anyMatch(haystack::contains);
            })
            .sorted(Comparator.comparing(Incident::getReportedAt).reversed())
            .limit(8)
            .collect(Collectors.toList());

        StringBuilder ctx = new StringBuilder();
        ctx.append("=== COMMUNITY INCIDENT DATA ===\n");
        if (relevant.isEmpty()) {
            ctx.append("No specific community reports match this location query.\n");
        } else {
            for (Incident inc : relevant) {
                long daysAgo = ChronoUnit.DAYS.between(inc.getReportedAt(), LocalDateTime.now());
                ctx.append(String.format("[%s][%s]: %s (%s, %d day%s ago)\n",
                    inc.getSeverity(), inc.getCategory(),
                    inc.getTitle(),
                    inc.getArea() != null ? inc.getArea() : "West London",
                    daysAgo, daysAgo == 1 ? "" : "s"));
            }
        }

        // Add Police UK data
        List<PoliceIncident> policeCrimes = policeApiService.fetchRecentCrimes();
        if (!policeCrimes.isEmpty()) {
            ctx.append("\n=== POLICE UK OPEN DATA (last 3 months) ===\n");
            policeCrimes.stream().limit(5).forEach(pc ->
                ctx.append(String.format("- %s on %s (%s)\n",
                    pc.getCategory(),
                    pc.getStreetName() != null ? pc.getStreetName() : "nearby street",
                    pc.getMonth()))
            );
        }

        return ctx.toString();
    }

    // ── Gemini API call ────────────────────────────────────────────────────

    private String callGemini(String model, String userPrompt, String dataContext) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
            + model + ":generateContent?key=" + geminiApiKey;

        String systemContext =
            "You are StreetPulse's urban safety assistant for Uxbridge and West London. " +
            "You have access to real community incident reports and Police UK open data shown below. " +
            "When given a route or location query, provide: " +
            "1. A brief overall safety assessment (2-3 sentences) referencing the actual data. " +
            "2. Key risks from the data. " +
            "3. 2-3 practical safety tips. " +
            "Keep your response under 220 words. Be specific, using area names and incident types from the data. " +
            "Be reassuring but honest.\n\n" + dataContext;

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", systemContext + "\n\nUser query: " + userPrompt))
            ))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) restTemplate
            .postForEntity(url, entity, Map.class)
            .getBody();

        if (body == null) throw new RuntimeException("Empty response from Gemini");

        var candidates = (List<?>) body.get("candidates");
        if (candidates == null || candidates.isEmpty())
            throw new RuntimeException("No candidates in response: " + body);

        var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
        var parts   = (List<?>) content.get("parts");
        return (String) ((Map<?, ?>) parts.get(0)).get("text");
    }

    // ── Smart data-driven analysis ─────────────────────────────────────────

    private String generateDataDrivenAnalysis(String userPrompt) {
        List<Incident> all = incidentRepository.findAll();
        if (all.isEmpty()) return generateStaticFallback();

        Set<String> stopWords = Set.of("from", "to", "the", "and", "for", "that",
            "this", "with", "about", "what", "where", "walk", "walking", "cycling",
            "safe", "safety", "area", "areas", "night", "dark", "late", "after", "near");

        List<String> keywords = Arrays.stream(userPrompt.toLowerCase().split("[\\s,;.!?'\"]+"))
            .filter(w -> w.length() >= 4 && !stopWords.contains(w))
            .distinct()
            .collect(Collectors.toList());

        List<Incident> relevant = all.stream()
            .filter(i -> {
                String haystack = ((i.getArea() != null ? i.getArea() : "") + " " + i.getTitle()).toLowerCase();
                return keywords.stream().anyMatch(haystack::contains);
            })
            .sorted(Comparator.comparing(Incident::getReportedAt).reversed())
            .limit(6)
            .collect(Collectors.toList());

        long highTotal   = all.stream().filter(i -> i.getSeverity() == IncidentSeverity.HIGH).count();
        long medTotal    = all.stream().filter(i -> i.getSeverity() == IncidentSeverity.MEDIUM).count();
        long recentTotal = incidentRepository.findByReportedAtAfter(LocalDateTime.now().minusDays(7)).size();

        Map<IncidentCategory, Long> catCounts = all.stream()
            .collect(Collectors.groupingBy(Incident::getCategory, Collectors.counting()));
        String topCategory = catCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(e -> e.getKey().name().toLowerCase())
            .orElse("general");

        StringBuilder sb = new StringBuilder();
        sb.append("Safety Analysis — StreetPulse Community Intelligence\n");
        sb.append("─────────────────────────────────────────────────────\n\n");

        if (!relevant.isEmpty()) {
            long highNearby = relevant.stream().filter(i -> i.getSeverity() == IncidentSeverity.HIGH).count();
            long medNearby  = relevant.stream().filter(i -> i.getSeverity() == IncidentSeverity.MEDIUM).count();

            sb.append("Community reports matching your query (").append(relevant.size()).append(" found):\n\n");
            for (Incident inc : relevant) {
                String when = inc.getReportedAt().format(DateTimeFormatter.ofPattern("d MMM, HH:mm"));
                sb.append("  - ").append(inc.getTitle())
                  .append("  [").append(inc.getSeverity()).append("]");
                if (inc.getArea() != null) sb.append(" — ").append(inc.getArea());
                sb.append(" (").append(when).append(")\n");
            }
            sb.append("\n");

            if (highNearby >= 2) {
                sb.append("Overall assessment: EXERCISE CAUTION. There are ")
                  .append(highNearby).append(" high-severity reports in this area. ")
                  .append("Consider taking a main road route and travelling with others after dark.\n\n");
            } else if (highNearby == 1) {
                sb.append("Overall assessment: MODERATE CAUTION advised. One high-severity ")
                  .append("incident has been reported nearby. Stay on main, well-lit streets.\n\n");
            } else if (medNearby > 0) {
                sb.append("Overall assessment: GENERALLY SAFE with some medium-priority issues noted. ")
                  .append("Standard precautions apply — stay aware of your surroundings.\n\n");
            } else {
                sb.append("Overall assessment: LOW RISK based on current community data. ")
                  .append("No high-severity incidents reported in this area recently.\n\n");
            }
        } else {
            sb.append("No specific community reports match your area query.\n\n");
            sb.append("Overall assessment: West London is generally well-monitored by this community. ")
              .append("Check the live map for the most up-to-date incident pins on your route.\n\n");
        }

        sb.append("West London snapshot (").append(all.size()).append(" total reports):\n");
        sb.append("  - High severity: ").append(highTotal).append(" incidents\n");
        sb.append("  - Medium severity: ").append(medTotal).append(" incidents\n");
        sb.append("  - Reported in last 7 days: ").append(recentTotal).append("\n");
        sb.append("  - Most common issue type: ").append(topCategory).append("\n\n");

        sb.append("Safety tips:\n");
        sb.append("  - Use the live map to check real-time incidents on your exact route\n");
        sb.append("  - Stick to main, well-lit roads after dark — especially near ").append(topCategory).append(" hotspots\n");
        sb.append("  - Share your location with a trusted contact before travelling late\n");
        sb.append("  - Report anything suspicious via the Report button to help the community");

        return sb.toString();
    }

    private String generateStaticFallback() {
        return "Safety Assessment for West London:\n\n" +
               "The StreetPulse community actively monitors this area. " +
               "Exercise standard caution, particularly after dark near transport hubs.\n\n" +
               "Tips:\n" +
               "- Check the live map for current incident pins\n" +
               "- Use well-lit main roads after dark\n" +
               "- Share your location with a trusted contact";
    }
}
