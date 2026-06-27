package com.colectivos.model;

import java.util.ArrayList;
import java.util.List;

public class ControlPanelConfig {
    private String routeId;
    private LoadingOption loadingOption = LoadingOption.DIST_VELOCITY;

    // Opción 1: ACCEL_VELOCITY
    private double accelerationMs2 = 1.0;
    private double expectedVelocityKmh = 40.0;

    // Opción 2: ACCEL_TIME
    private double applicationTimeSeconds = 30.0;

    // Opción 3: DIST_VELOCITY
    private double distanceKm = 0.0;
    private double averageVelocityKmh = 40.0;

    // Bandas de error (en minutos de demora)
    private double acceptableDelayMinutes = 3.0;
    private double maxRecoverableDelayMinutes = 10.0;

    // Eventos programados
    private List<Event> events = new ArrayList<>();

    // Multiplicador de velocidad de simulación (1x = tiempo real, 60x = 1 seg real = 1 min simulado)
    private int simulationSpeedMultiplier = 60;

    public String getRouteId() { return routeId; }
    public void setRouteId(String routeId) { this.routeId = routeId; }

    public LoadingOption getLoadingOption() { return loadingOption; }
    public void setLoadingOption(LoadingOption loadingOption) { this.loadingOption = loadingOption; }

    public double getAccelerationMs2() { return accelerationMs2; }
    public void setAccelerationMs2(double accelerationMs2) { this.accelerationMs2 = accelerationMs2; }

    public double getExpectedVelocityKmh() { return expectedVelocityKmh; }
    public void setExpectedVelocityKmh(double expectedVelocityKmh) { this.expectedVelocityKmh = expectedVelocityKmh; }

    public double getApplicationTimeSeconds() { return applicationTimeSeconds; }
    public void setApplicationTimeSeconds(double applicationTimeSeconds) { this.applicationTimeSeconds = applicationTimeSeconds; }

    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }

    public double getAverageVelocityKmh() { return averageVelocityKmh; }
    public void setAverageVelocityKmh(double averageVelocityKmh) { this.averageVelocityKmh = averageVelocityKmh; }

    public double getAcceptableDelayMinutes() { return acceptableDelayMinutes; }
    public void setAcceptableDelayMinutes(double acceptableDelayMinutes) { this.acceptableDelayMinutes = acceptableDelayMinutes; }

    public double getMaxRecoverableDelayMinutes() { return maxRecoverableDelayMinutes; }
    public void setMaxRecoverableDelayMinutes(double maxRecoverableDelayMinutes) { this.maxRecoverableDelayMinutes = maxRecoverableDelayMinutes; }

    public List<Event> getEvents() { return events; }
    public void setEvents(List<Event> events) { this.events = events; }

    public int getSimulationSpeedMultiplier() { return simulationSpeedMultiplier; }
    public void setSimulationSpeedMultiplier(int simulationSpeedMultiplier) { this.simulationSpeedMultiplier = simulationSpeedMultiplier; }
}
