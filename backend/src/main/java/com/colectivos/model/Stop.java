package com.colectivos.model;

public class Stop {
    private String name;
    private double distanceFromPreviousKm;
    private double estimatedMinutesFromPrevious;

    public Stop() {}

    public Stop(String name, double distanceFromPreviousKm, double estimatedMinutesFromPrevious) {
        this.name = name;
        this.distanceFromPreviousKm = distanceFromPreviousKm;
        this.estimatedMinutesFromPrevious = estimatedMinutesFromPrevious;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getDistanceFromPreviousKm() { return distanceFromPreviousKm; }
    public void setDistanceFromPreviousKm(double d) { this.distanceFromPreviousKm = d; }

    public double getEstimatedMinutesFromPrevious() { return estimatedMinutesFromPrevious; }
    public void setEstimatedMinutesFromPrevious(double t) { this.estimatedMinutesFromPrevious = t; }
}
