package com.streetpulse.service;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.helpers.BetaToolRunner;
import com.anthropic.models.beta.messages.BetaMessage;
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.fasterxml.jackson.annotation.JsonClassDescription;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.streetpulse.model.Incident;
import com.streetpulse.model.IncidentCategory;
import com.streetpulse.model.IncidentSeverity;
import com.streetpulse.model.PoliceIncident;
import com.streetpulse.model.RiskResult;
import com.streetpulse.repository.IncidentRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * The StreetPulse AI agent — a Claude-powered assistant that doesn't just chat, but
 * <em>acts</em>: it calls tools to query real community reports, official Police UK data,
 * summary statistics, and the predictive risk model before answering.
 *
 * <p>Requires an {@code ANTHROPIC_API_KEY}. When the key is absent, {@link #isAvailable()}
 * returns false and callers fall back to the existing data-driven analysis — so the app keeps
 * working (and costs nothing) until an agent key is configured.
 */
@Service
public class AgentService {

    private static final String MODEL = "claude-opus-4-8";

    private static final String SYSTEM_PROMPT = """
        You are StreetPulse's AI safety agent for Uxbridge and West London.
        You help residents understand local safety using real data.

        Before answering, use the provided tools to look things up — community incident
        reports, official Police UK crime data, summary statistics, and the predictive
        risk score for a location and time. Ground every answer in tool results: cite
        specific numbers, area names, and incident types you actually retrieved.

        For a route or area question, it is good practice to check the risk score and the
        nearby incidents. Uxbridge town centre is approximately latitude 51.5462,
        longitude -0.4784.

        Be concise (under 180 words), practical, and reassuring but honest. Respond with a
        final answer only — no meta-commentary about your process.
        """;

    @Value("${anthropic.api.key:}")
    private String apiKey;

    private final IncidentRepository incidentRepository;
    private final RiskService riskService;
    private final PoliceApiService policeApiService;

    private volatile AnthropicClient client;

    public AgentService(IncidentRepository incidentRepository,
                        RiskService riskService,
                        PoliceApiService policeApiService) {
        this.incidentRepository = incidentRepository;
        this.riskService = riskService;
        this.policeApiService = policeApiService;
    }

    @PostConstruct
    void init() {
        // The SDK instantiates tool classes by reflection, so they reach Spring beans
        // through these static references rather than constructor injection.
        AgentTools.incidents = incidentRepository;
        AgentTools.risk = riskService;
        AgentTools.police = policeApiService;
        if (apiKey == null || apiKey.isBlank()) {
            System.out.println("[StreetPulse] Anthropic key not set — AI agent disabled, data-driven fallback will be used.");
        } else {
            System.out.println("[StreetPulse] Anthropic key loaded — AI agent enabled (" + MODEL + ").");
        }
    }

    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Run one agent turn: Claude may call tools several times, then return a grounded answer.
     * @throws IllegalStateException if no API key is configured.
     */
    public String chat(String userMessage) {
        if (!isAvailable()) {
            throw new IllegalStateException("Anthropic API key not configured");
        }
        BetaToolRunner runner = client().beta().messages().toolRunner(
            MessageCreateParams.builder()
                .model(MODEL)
                .maxTokens(1500L)
                .putAdditionalHeader("anthropic-beta", "structured-outputs-2025-11-13")
                .system(SYSTEM_PROMPT)
                .addTool(SearchIncidents.class)
                .addTool(GetRiskScore.class)
                .addTool(GetPoliceCrimes.class)
                .addTool(GetStats.class)
                .addUserMessage(userMessage)
                .build());

        String lastText = "";
        for (BetaMessage message : runner) {
            StringBuilder sb = new StringBuilder();
            message.content().forEach(block -> block.text().ifPresent(t -> sb.append(t.text())));
            if (!sb.isEmpty()) {
                lastText = sb.toString().trim();
            }
        }
        return lastText;
    }

    private AnthropicClient client() {
        AnthropicClient c = client;
        if (c == null) {
            synchronized (this) {
                c = client;
                if (c == null) {
                    c = AnthropicOkHttpClient.builder().apiKey(apiKey).build();
                    client = c;
                }
            }
        }
        return c;
    }

    // ── Static bridge so reflection-instantiated tools can reach Spring beans ──────

    static final class AgentTools {
        static IncidentRepository incidents;
        static RiskService risk;
        static PoliceApiService police;

        static long daysAgo(LocalDateTime t) {
            return java.time.temporal.ChronoUnit.DAYS.between(t, LocalDateTime.now());
        }
    }

    // ── Tools (each implements Supplier<String>; public fields are the JSON inputs) ──

    @JsonClassDescription("Search community-reported incidents. Optionally filter by area name, category, or severity. Returns a compact list of the most recent matches.")
    public static class SearchIncidents implements Supplier<String> {
        @JsonPropertyDescription("Area name to filter by, e.g. 'Uxbridge High Street'. Leave empty for all areas.")
        public String area;
        @JsonPropertyDescription("Category filter: LIGHTING, HAZARD, SUSPICIOUS, VANDALISM, ANTISOCIAL, PARKING, NOISE, DRUG, VEHICLE, or THEFT. Optional.")
        public String category;
        @JsonPropertyDescription("Severity filter: LOW, MEDIUM, or HIGH. Optional.")
        public String severity;

        @Override
        public String get() {
            List<Incident> all = AgentTools.incidents.findAll();
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
                    AgentTools.daysAgo(i.getReportedAt()), i.getUpvotes()))
                .collect(Collectors.joining("\n"));
        }
    }

    @JsonClassDescription("Get the predicted safety risk score (0-100, explainable) for a specific point, and optionally an hour of day.")
    public static class GetRiskScore implements Supplier<String> {
        @JsonPropertyDescription("Latitude, e.g. 51.5462")
        public Double latitude;
        @JsonPropertyDescription("Longitude, e.g. -0.4784")
        public Double longitude;
        @JsonPropertyDescription("Hour of day, 0-23. Optional.")
        public Integer hour;

        @Override
        public String get() {
            if (latitude == null || longitude == null) {
                return "Error: latitude and longitude are required.";
            }
            Integer h = (hour != null && hour >= 0 && hour <= 23) ? hour : null;
            RiskResult r = AgentTools.risk.computeRisk(latitude, longitude, h);
            String factors = r.getTopFactors().isEmpty() ? "" : "\nNearby: " + String.join("; ", r.getTopFactors());
            return r.getExplanation() + factors;
        }
    }

    @JsonClassDescription("Get a summary of recent official Police UK crimes for the Uxbridge area (last 12 months): counts by crime type plus a few examples.")
    public static class GetPoliceCrimes implements Supplier<String> {
        @JsonPropertyDescription("Maximum example crimes to include (default 8).")
        public Integer limit;

        @Override
        public String get() {
            List<PoliceIncident> crimes = AgentTools.police.fetchRecentCrimes();
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
    }

    @JsonClassDescription("Get summary statistics for all community incident reports: totals, severity breakdown, recent activity, and the most active area.")
    public static class GetStats implements Supplier<String> {
        @Override
        public String get() {
            List<Incident> all = AgentTools.incidents.findAll();
            if (all.isEmpty()) return "No community reports yet.";

            long high = all.stream().filter(i -> i.getSeverity() == IncidentSeverity.HIGH).count();
            long med = all.stream().filter(i -> i.getSeverity() == IncidentSeverity.MEDIUM).count();
            long low = all.stream().filter(i -> i.getSeverity() == IncidentSeverity.LOW).count();
            long recent = all.stream()
                .filter(i -> AgentTools.daysAgo(i.getReportedAt()) <= 7).count();

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
    }

    // ── Parsing helpers ───────────────────────────────────────────────────────────

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
