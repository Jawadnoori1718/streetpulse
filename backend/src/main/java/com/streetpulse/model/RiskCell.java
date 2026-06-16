package com.streetpulse.model;

/** A single scored point in the risk grid — the unit the heat-map is drawn from. */
public class RiskCell {

    private final double latitude;
    private final double longitude;
    private final int score; // 0–100

    public RiskCell(double latitude, double longitude, int score) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.score = score;
    }

    public double getLatitude()  { return latitude; }
    public double getLongitude() { return longitude; }
    public int getScore()        { return score; }
}
