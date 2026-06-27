package com.colectivos.core;

/** Datos que RouteProcess entrega al MeasurementElement en cada tick. */
public class ProcessTickData {
    private final double positionKm;
    private final double velocityKmh;
    private final long timestampMs;
    private final double simulatedElapsedMinutes;

    public ProcessTickData(double positionKm, double velocityKmh, long timestampMs, double simulatedElapsedMinutes) {
        this.positionKm = positionKm;
        this.velocityKmh = velocityKmh;
        this.timestampMs = timestampMs;
        this.simulatedElapsedMinutes = simulatedElapsedMinutes;
    }

    public double getPositionKm() { return positionKm; }
    public double getVelocityKmh() { return velocityKmh; }
    public long getTimestampMs() { return timestampMs; }
    public double getSimulatedElapsedMinutes() { return simulatedElapsedMinutes; }
}
