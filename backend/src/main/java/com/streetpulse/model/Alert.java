package com.streetpulse.model;

import java.time.LocalDateTime;

/** A live safety alert surfaced to the community (e.g. a recent high-severity report nearby). */
public class Alert {

    private final String level;   // HIGH | INFO
    private final String title;
    private final String message;
    private final String area;
    private final Double latitude;
    private final Double longitude;
    private final LocalDateTime reportedAt;

    public Alert(String level, String title, String message, String area,
                 Double latitude, Double longitude, LocalDateTime reportedAt) {
        this.level = level;
        this.title = title;
        this.message = message;
        this.area = area;
        this.latitude = latitude;
        this.longitude = longitude;
        this.reportedAt = reportedAt;
    }

    public String getLevel()             { return level; }
    public String getTitle()             { return title; }
    public String getMessage()           { return message; }
    public String getArea()              { return area; }
    public Double getLatitude()          { return latitude; }
    public Double getLongitude()         { return longitude; }
    public LocalDateTime getReportedAt() { return reportedAt; }
}
