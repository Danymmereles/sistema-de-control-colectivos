package com.colectivos.core;

/** Datos calculados por MeasurementElement y enviados al SystemController. */
public class MeasurementData {
    private final double realPositionKm;
    private final double currentVelocityKmh;
    private final double totalSimulatedMinutes;

    public MeasurementData(double realPositionKm, double currentVelocityKmh, double totalSimulatedMinutes) {
        this.realPositionKm = realPositionKm;
        this.currentVelocityKmh = currentVelocityKmh;
        this.totalSimulatedMinutes = totalSimulatedMinutes;
    }

    public double getRealPositionKm() { return realPositionKm; }
    public double getCurrentVelocityKmh() { return currentVelocityKmh; }
    public double getTotalSimulatedMinutes() { return totalSimulatedMinutes; }
}
