package com.streetpulse.model;

import jakarta.validation.constraints.*;

public class CreateIncidentRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 120)
    private String title;

    @Size(max = 500)
    private String description;

    @NotNull
    private IncidentCategory category;

    @NotNull
    private IncidentSeverity severity;

    @NotNull
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private Double latitude;

    @NotNull
    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private Double longitude;

    @Size(max = 80)
    private String area;

    @Email
    @Size(max = 254)
    private String reporterEmail;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public IncidentCategory getCategory() { return category; }
    public void setCategory(IncidentCategory category) { this.category = category; }

    public IncidentSeverity getSeverity() { return severity; }
    public void setSeverity(IncidentSeverity severity) { this.severity = severity; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getReporterEmail() { return reporterEmail; }
    public void setReporterEmail(String reporterEmail) { this.reporterEmail = reporterEmail; }
}
