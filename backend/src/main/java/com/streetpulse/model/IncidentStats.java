package com.streetpulse.model;

public class IncidentStats {
    private long totalIncidents;
    private long lightingCount;
    private long hazardCount;
    private long suspiciousCount;
    private long highSeverityCount;
    private long mediumSeverityCount;
    private long lowSeverityCount;
    private String mostActiveArea;
    private long last24HoursCount;

    public IncidentStats(long totalIncidents, long lightingCount, long hazardCount,
                         long suspiciousCount, long highSeverityCount, long mediumSeverityCount,
                         long lowSeverityCount, String mostActiveArea, long last24HoursCount) {
        this.totalIncidents = totalIncidents;
        this.lightingCount = lightingCount;
        this.hazardCount = hazardCount;
        this.suspiciousCount = suspiciousCount;
        this.highSeverityCount = highSeverityCount;
        this.mediumSeverityCount = mediumSeverityCount;
        this.lowSeverityCount = lowSeverityCount;
        this.mostActiveArea = mostActiveArea;
        this.last24HoursCount = last24HoursCount;
    }

    public long getTotalIncidents() { return totalIncidents; }
    public long getLightingCount() { return lightingCount; }
    public long getHazardCount() { return hazardCount; }
    public long getSuspiciousCount() { return suspiciousCount; }
    public long getHighSeverityCount() { return highSeverityCount; }
    public long getMediumSeverityCount() { return mediumSeverityCount; }
    public long getLowSeverityCount() { return lowSeverityCount; }
    public String getMostActiveArea() { return mostActiveArea; }
    public long getLast24HoursCount() { return last24HoursCount; }
}
