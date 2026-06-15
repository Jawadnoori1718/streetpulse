package com.streetpulse.model;

import java.util.List;

/**
 * The output of the spatiotemporal risk model for a single point in space and time.
 *
 * <p>Deliberately explainable: alongside the headline {@code score} it carries the
 * factors that produced it, so the number can always be justified.
 */
public class RiskResult {

    private final double latitude;
    private final double longitude;
    private final Integer hour;          // hour-of-day the score was computed for (nullable)
    private final int score;             // 0–100
    private final String level;          // LOW | MODERATE | HIGH
    private final int nearbyReports;     // community reports within the influence radius
    private final int nearbyCrimes;      // police crimes within the influence radius
    private final List<String> topFactors;   // human-readable contributing events
    private final String explanation;        // one-line summary

    public RiskResult(double latitude, double longitude, Integer hour, int score, String level,
                      int nearbyReports, int nearbyCrimes, List<String> topFactors, String explanation) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.hour = hour;
        this.score = score;
        this.level = level;
        this.nearbyReports = nearbyReports;
        this.nearbyCrimes = nearbyCrimes;
        this.topFactors = topFactors;
        this.explanation = explanation;
    }

    public double getLatitude()       { return latitude; }
    public double getLongitude()      { return longitude; }
    public Integer getHour()          { return hour; }
    public int getScore()             { return score; }
    public String getLevel()          { return level; }
    public int getNearbyReports()     { return nearbyReports; }
    public int getNearbyCrimes()      { return nearbyCrimes; }
    public List<String> getTopFactors() { return topFactors; }
    public String getExplanation()    { return explanation; }
}
