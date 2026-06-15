package com.streetpulse.model;

public class PoliceIncident {

    private String id;
    private String category;       // human-readable label (e.g. "Violent Crime")
    private Double latitude;
    private Double longitude;
    private String streetName;
    private String month;
    private String outcomeStatus;
    private String rawCategory;    // original Police UK slug (e.g. "violent-crime")

    public PoliceIncident() {}

    public PoliceIncident(String id, String category, Double latitude, Double longitude,
                          String streetName, String month, String outcomeStatus, String rawCategory) {
        this.id = id;
        this.category = category;
        this.latitude = latitude;
        this.longitude = longitude;
        this.streetName = streetName;
        this.month = month;
        this.outcomeStatus = outcomeStatus;
        this.rawCategory = rawCategory;
    }

    public String getId()            { return id; }
    public void setId(String id)     { this.id = id; }

    public String getCategory()                  { return category; }
    public void setCategory(String category)     { this.category = category; }

    public Double getLatitude()                  { return latitude; }
    public void setLatitude(Double latitude)     { this.latitude = latitude; }

    public Double getLongitude()                 { return longitude; }
    public void setLongitude(Double longitude)   { this.longitude = longitude; }

    public String getStreetName()                { return streetName; }
    public void setStreetName(String streetName) { this.streetName = streetName; }

    public String getMonth()                     { return month; }
    public void setMonth(String month)           { this.month = month; }

    public String getOutcomeStatus()                     { return outcomeStatus; }
    public void setOutcomeStatus(String outcomeStatus)   { this.outcomeStatus = outcomeStatus; }

    public String getRawCategory()                   { return rawCategory; }
    public void setRawCategory(String rawCategory)   { this.rawCategory = rawCategory; }
}
