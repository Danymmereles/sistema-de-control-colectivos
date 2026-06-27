package com.colectivos.model;

import java.util.ArrayList;
import java.util.List;

public class Route {
    private String id;
    private String name;
    private List<Stop> stops = new ArrayList<>();
    private double totalDistanceKm;
    private double estimatedTotalMinutes;

    public Route() {}

    public Route(String id, String name, List<Stop> stops) {
        this.id = id;
        this.name = name;
        this.stops = stops;
        this.totalDistanceKm = stops.stream()
                .mapToDouble(Stop::getDistanceFromPreviousKm).sum();
        this.estimatedTotalMinutes = stops.stream()
                .mapToDouble(Stop::getEstimatedMinutesFromPrevious).sum();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<Stop> getStops() { return stops; }
    public void setStops(List<Stop> stops) { this.stops = stops; }

    public double getTotalDistanceKm() { return totalDistanceKm; }
    public void setTotalDistanceKm(double d) { this.totalDistanceKm = d; }

    public double getEstimatedTotalMinutes() { return estimatedTotalMinutes; }
    public void setEstimatedTotalMinutes(double t) { this.estimatedTotalMinutes = t; }
}
