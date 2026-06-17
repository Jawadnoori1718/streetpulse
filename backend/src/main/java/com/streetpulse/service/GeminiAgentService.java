package com.streetpulse.service;

import com.streetpulse.model.Incident;
import com.streetpulse.model.IncidentCategory;
import com.streetpulse.model.IncidentSeverity;
import com.streetpulse.model.PoliceIncident;
import com.streetpulse.model.RiskResult;
import com.streetpulse.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * The StreetPulse AI agent, powered by Google Gemini's <em>free</em> tier.
 *
 * <p>Unlike a plain chatbot, this is a genuine tool-using agent: Gemini decides which of the
 * registered functions to call (search incidents, score risk, summarise police data, fetch
 * stats), this service executes them against real data, feeds the results back, and loops until
 * Gemini produces a grounded final answer.
 *
 * <p>Requires only a free {@code GEMINI_API_KEY}. With no key, callers fall back to the
 * data-driven analysis — so the assistant always works, at zero cost.
 */
@Service
public class GeminiAgentService {

    private static final String[] MODELS = { "gemini-2.0-flash", "gemini-1.5-flash" };
    private static final int MAX_STEPS = 6;

    private static final String SYSTEM_PROMPT = """
        You are StreetPulse's AI safety agent for Uxbridge and West London.
        You help residents understand local safety using real data.

        Use the provided functions to look things up before answering — community incident
        reports, official Police UK crime data, summary statistics, and the predictive risk
        score for a location and time. Ground every answer in what the functions return: cite
        specific numbers, area names, and incident types you actually retrieved.

        For a route or area question, check the risk score and nearby incidents. Uxbridge town
        centre is approximately latitude 51.5462, longitude -0.4784.

        Be concise (under 180 words), practical, and reassuring but honest.
        """;

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final IncidentRepository incidentRepository;
    private final RiskService riskService;
    private final PoliceApiService policeApiService;

    public GeminiAgentService(RestTemplate restTemplate,
                              IncidentRepository incidentRepository,
                              RiskService riskService,
                              PoliceApiService policeApiService) {
        this.restTemplate = restTemplate;
        this.incidentRepository = incidentRepository;
        this.riskService = riskService;
        this.policeApiService = policeApiService;
    }

    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Run one agent turn: Gemini may call functions several times, then return a grounded answer.
     * @throws IllegalStateException if no API key is configured.
     */
    public String chat(String userMessage) {
        if (!isAvailable()) {
            throw new IllegalStateException("Gemini API key not configured");
        }

        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(content("user", List.of(Map.of("text", userMessage))));

        for (int step = 0; step < MAX_STEPS; step++) {
            Map<String, Object> modelContent = callGemini(contents);
            if (modelContent == null) return ""; // surface failure → caller falls back

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts =
                (List<Map<String, Object>>) modelContent.getOrDefault("parts", List.of());

            List<Map<String, Object>> calls = parts.stream()
                .filter(p -> p.get("functionCall") != null)
                .toList();

            if (!calls.isEmpty()) {
                contents.add(modelContent); // record the model's function-call turn
                List<Map<String, Object>> responseParts = new ArrayList<>();
                for (Map<String, Object> p : calls) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> fc = (Map<String, Object>) p.get("functionCall");
                    String name = String.valueOf(fc.get("name"));
                    @SuppressWarnings("unchecked")
                    Map<String, Object> args = (Map<String, Object>) fc.getOrDefault("args", Map.of());
                    String result = executeTool(name, args);
                    responseParts.add(Map.of("functionResponse",
                        Map.of("name", name, "response", Map.of("result", result))));
                }
                contents.add(content("function", responseParts));
                continue;
            }

            String text = parts.stream()
                .filter(p -> p.get("text") != null)
                .map(p -> String.valueOf(p.get("text")))
                .collect(Collectors.joining());
            if (!text.isBlank()) return text.trim();
            break;
        }
        return "";
    }

    // ── Gemini call ───────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> callGemini(List<Map<String, Object>> contents) {
        Map<String, Object> body = new HashMap<>();
        body.put("system_instruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT))));
        body.put("contents", contents);
        body.put("tools", List.of(Map.of("function_declarations", toolDeclarations())));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        for (String model : MODELS) {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent?key=" + apiKey;
            try {
                Map<String, Object> resp = (Map<String, Object>) restTemplate
                    .postForEntity(url, entity, Map.class).getBody();
                if (resp == null) continue;
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) resp.get("candidates");
                if (candidates == null || candidates.isEmpty()) continue;
                Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                if (contentMap != null) return contentMap;
            } catch (Exception e) {
                System.err.println("[StreetPulse] Gemini agent (" + model + ") error: " + e.getMessage());
            }
        }
        return null;
    }

    // ── Function (tool) declarations ──────────────────────────────────────────────

    private List<Map<String, Object>> toolDeclarations() {
        return List.of(
            decl("search_incidents",
                "Search community-reported incidents, optionally filtered by area, category, or severity.",
                objectSchema(Map.of(
                    "area", Map.of("type", "STRING", "description", "Area name, e.g. 'Uxbridge High Street'. Optional."),
                    "category", Map.of("type", "STRING", "description", "LIGHTING, HAZARD, SUSPICIOUS, VANDALISM, ANTISOCIAL, PARKING, NOISE, DRUG, VEHICLE, or THEFT. Optional."),
                    "severity", Map.of("type", "STRING", "description", "LOW, MEDIUM, or HIGH. Optional.")
                ), List.of())),
            decl("get_risk_score",
                "Get the predicted safety risk score (0-100) for a point and optional hour of day.",
                objectSchema(Map.of(
                    "latitude", Map.of("type", "NUMBER", "description", "Latitude, e.g. 51.5462"),
                    "longitude", Map.of("type", "NUMBER", "description", "Longitude, e.g. -0.4784"),
                    "hour", Map.of("type", "INTEGER", "description", "Hour of day 0-23. Optional.")
                ), List.of("latitude", "longitude"))),
            decl("get_police_crimes",
                "Summarise recent official Police UK crimes for the Uxbridge area (last 12 months).",
                objectSchema(Map.of(
                    "limit", Map.of("type", "INTEGER", "description", "Max example crimes to include. Optional.")
                ), List.of())),
            decl("get_stats",
                "Get summary statistics for all community incident reports.",
                objectSchema(Map.of(), List.of()))
        );
    }

    private Map<String, Object> decl(String name, String description, Map<String, Object> parameters) {
        return Map.of("name", name, "description", description, "parameters", parameters);
    }

    private Map<String, Object> objectSchema(Map<String, Object> properties, List<String> required) {
        Map<String, Object> schema = new HashMap<>();
        schema.put("type", "OBJECT");
        schema.put("properties", properties);
        if (!required.isEmpty()) schema.put("required", required);
        return schema;
    }

    private Map<String, Object> content(String role, List<Map<String, Object>> parts) {
        return Map.of("role", role, "parts", parts);
    }

    // ── Tool execution (against real data) ────────────────────────────────────────

    private String executeTool(String name, Map<String, Object> args) {
        try {
            return switch (name) {
                case "search_incidents" -> searchIncidents(
                    str(args.get("area")), str(args.get("category")), str(args.get("severity")));
                case "get_risk_score" -> getRiskScore(
                    dbl(args.get("latitude")), dbl(args.get("longitude")), intg(args.get("hour")));
                case "get_police_crimes" -> getPoliceCrimes(intg(args.get("limit")));
                case "get_stats" -> getStats();
                default -> "Unknown function: " + name;
            };
        } catch (Exception e) {
            return "Error running " + name + ": " + e.getMessage();
        }
    }

    private String searchIncidents(String area, String category, String severity) {
        List<Incident> all = incidentRepository.findAll();
        String a = area == null ? "" : area.trim().toLowerCase();
        IncidentCategory cat = parseCategory(category);
        IncidentSeverity sev = parseSeverity(severity);

        List<Incident> matches = all.stream()
            .filter(i -> a.isEmpty() || (i.getArea() != null && i.getArea().toLowerCase().contains(a))
                || i.getTitle().toLowerCase().contains(a))
            .filter(i -> cat == null || i.getCategory() == cat)
            .filter(i -> sev == null || i.getSeverity() == sev)
            .sorted(Comparator.comparing(Incident::getReportedAt).reversed())
            .limit(10)
            .toList();

        if (matches.isEmpty()) return "No matching community reports found.";
        return matches.stream()
            .map(i -> String.format("- [%s/%s] %s — %s (%d day(s) ago, %d upvotes)",
                i.getSeverity(), i.getCategory(), i.getTitle(),
                i.getArea() != null ? i.getArea() : "West London",
                ChronoUnit.DAYS.between(i.getReportedAt(), LocalDateTime.now()), i.getUpvotes()))
            .collect(Collectors.joining("\n"));
    }

    private String getRiskScore(Double lat, Double lng, Integer hour) {
        if (lat == null || lng == null) return "Error: latitude and longitude are required.";
        Integer h = (hour != null && hour >= 0 && hour <= 23) ? hour : null;
        RiskResult r = riskService.computeRisk(lat, lng, h);
        String factors = r.getTopFactors().isEmpty() ? "" : "\nNearby: " + String.join("; ", r.getTopFactors());
        return r.getExplanation() + factors;
    }

    private String getPoliceCrimes(Integer limit) {
        List<PoliceIncident> crimes = policeApiService.fetchRecentCrimes();
        if (crimes.isEmpty()) return "No Police UK data is currently available.";

        Map<String, Long> byCat = crimes.stream()
            .collect(Collectors.groupingBy(PoliceIncident::getCategory, LinkedHashMap::new, Collectors.counting()));
        String breakdown = byCat.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(8)
            .map(e -> e.getKey() + ": " + e.getValue())
            .collect(Collectors.joining(", "));

        int lim = (limit != null && limit > 0) ? Math.min(limit, 20) : 8;
        String examples = crimes.stream().limit(lim)
            .map(c -> "- " + c.getCategory() + " on "
                + (c.getStreetName() != null ? c.getStreetName() : "a nearby street")
                + " (" + c.getMonth() + ")")
            .collect(Collectors.joining("\n"));

        return "Total police crimes (12 mo): " + crimes.size()
            + "\nBy type: " + breakdown + "\nExamples:\n" + examples;
    }

    private String getStats() {
        List<Incident> all = incidentRepository.findAll();
        if (all.isEmpty()) return "No community reports yet.";

        long high = all.stream().filter(i -> i.getSeverity() == IncidentSeverity.HIGH).count();
        long med = all.stream().filter(i -> i.getSeverity() == IncidentSeverity.MEDIUM).count();
        long low = all.stream().filter(i -> i.getSeverity() == IncidentSeverity.LOW).count();
        long recent = all.stream()
            .filter(i -> ChronoUnit.DAYS.between(i.getReportedAt(), LocalDateTime.now()) <= 7).count();

        String topCategory = all.stream()
            .collect(Collectors.groupingBy(Incident::getCategory, Collectors.counting()))
            .entrySet().stream().max(Map.Entry.comparingByValue())
            .map(e -> e.getKey().name()).orElse("N/A");

        String topArea = all.stream()
            .filter(i -> i.getArea() != null)
            .collect(Collectors.groupingBy(Incident::getArea, Collectors.counting()))
            .entrySet().stream().max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey).orElse("N/A");

        return String.format(
            "Total reports: %d (High: %d, Medium: %d, Low: %d). Reported in last 7 days: %d. "
            + "Most common type: %s. Most active area: %s.",
            all.size(), high, med, low, recent, topCategory, topArea);
    }

    // ── Arg coercion & parsing ────────────────────────────────────────────────────

    private static String str(Object o) { return o == null ? null : o.toString(); }

    private static Double dbl(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        try { return o == null ? null : Double.parseDouble(o.toString()); }
        catch (NumberFormatException e) { return null; }
    }

    private static Integer intg(Object o) {
        if (o instanceof Number n) return n.intValue();
        try { return o == null ? null : Integer.parseInt(o.toString()); }
        catch (NumberFormatException e) { return null; }
    }

    private static IncidentCategory parseCategory(String s) {
        if (s == null || s.isBlank()) return null;
        try { return IncidentCategory.valueOf(s.trim().toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }

    private static IncidentSeverity parseSeverity(String s) {
        if (s == null || s.isBlank()) return null;
        try { return IncidentSeverity.valueOf(s.trim().toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }
}
