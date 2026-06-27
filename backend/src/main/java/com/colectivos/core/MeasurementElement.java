package com.colectivos.core;

import org.springframework.stereotype.Component;

/**
 * MODEL — Elemento de Medición.
 * Recibe los datos del RouteProcess (posición, velocidad, timestamp),
 * calcula el estado real del colectivo considerando el tiempo transcurrido
 * desde que el proceso generó esos datos, y los entrega al SystemController.
 *
 * Ciclo mínimo: 10 segundos reales (configurado en JourneyEngine).
 */
@Component
public class MeasurementElement {

    private long lastMeasurementTimeMs = 0;

    public void reset() {
        lastMeasurementTimeMs = System.currentTimeMillis();
    }

    /**
     * Mide el estado actual extrapolando desde los datos del proceso.
     *
     * @param tick datos del último tick del RouteProcess
     * @param speedMultiplier multiplicador de tiempo de simulación
     * @return estado medido real del sistema
     */
    public MeasurementData measure(ProcessTickData tick, int speedMultiplier) {
        long now = System.currentTimeMillis();

        // Δt real desde que el proceso generó su dato hasta ahora
        double deltaRealMs = now - tick.getTimestampMs();
        // Convertir a minutos simulados
        double deltaSimMinutes = deltaRealMs * speedMultiplier / 60_000.0;

        // Extrapolar posición real: donde estaría el colectivo ahora según su última velocidad
        double realPositionKm = tick.getPositionKm() + tick.getVelocityKmh() * (deltaSimMinutes / 60.0);

        // Tiempo total simulado acumulado
        double totalSimulatedMinutes = tick.getSimulatedElapsedMinutes() + deltaSimMinutes;

        lastMeasurementTimeMs = now;

        return new MeasurementData(realPositionKm, tick.getVelocityKmh(), totalSimulatedMinutes);
    }

    public long getLastMeasurementTimeMs() { return lastMeasurementTimeMs; }
}
