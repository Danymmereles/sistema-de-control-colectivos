package com.colectivos.core;

import com.colectivos.model.*;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * MODEL — Controlador del Sistema.
 * Compara la posición esperada (según el plan) contra la posición real (medida).
 * Aplica la banda de error y emite una señal de control al BusActuator.
 *
 * Bandas:
 *  - |demora| ≤ acceptableDelayMinutes  → OK
 *  - acceptableDelay < |demora| ≤ maxRecoverable → DELAYED
 *  - |demora| > maxRecoverable          → CRITICAL
 */
@Component
public class SystemController {

    /**
     * Evalúa el estado medido contra el plan y emite una señal de control.
     */
    public EvaluationResult evaluate(MeasurementData measured, ControlPanelConfig config, Route route) {
        double expectedPos = computeExpectedPosition(measured.getTotalSimulatedMinutes(), route);
        double avgVelocityKmh = computeAverageVelocity(route);

        // Demora en minutos: positivo = atrasado, negativo = adelantado
        double delayMinutes = 0;
        if (avgVelocityKmh > 0) {
            delayMinutes = (expectedPos - measured.getRealPositionKm()) / avgVelocityKmh * 60.0;
        }

        ControlSignal signal;
        if (Math.abs(delayMinutes) <= config.getAcceptableDelayMinutes()) {
            signal = ControlSignal.OK;
        } else if (Math.abs(delayMinutes) <= config.getMaxRecoverableDelayMinutes()) {
            signal = ControlSignal.DELAYED;
        } else {
            signal = ControlSignal.CRITICAL;
        }

        return new EvaluationResult(signal, delayMinutes, expectedPos, measured.getRealPositionKm());
    }

    /**
     * Posición esperada en el recorrido para un tiempo simulado dado.
     * Interpola linealmente entre paradas según sus tiempos estimados.
     */
    private double computeExpectedPosition(double simulatedMinutes, Route route) {
        if (simulatedMinutes <= 0) return 0;
        double cumulativeTime = 0;
        double cumulativeDistance = 0;
        List<Stop> stops = route.getStops();
        for (Stop stop : stops) {
            if (stop.getEstimatedMinutesFromPrevious() <= 0) continue;
            double segEnd = cumulativeTime + stop.getEstimatedMinutesFromPrevious();
            if (simulatedMinutes <= segEnd) {
                double fraction = (simulatedMinutes - cumulativeTime) / stop.getEstimatedMinutesFromPrevious();
                return cumulativeDistance + fraction * stop.getDistanceFromPreviousKm();
            }
            cumulativeTime = segEnd;
            cumulativeDistance += stop.getDistanceFromPreviousKm();
        }
        return route.getTotalDistanceKm();
    }

    private double computeAverageVelocity(Route route) {
        if (route.getEstimatedTotalMinutes() <= 0) return 0;
        return route.getTotalDistanceKm() / route.getEstimatedTotalMinutes() * 60.0;
    }
}
