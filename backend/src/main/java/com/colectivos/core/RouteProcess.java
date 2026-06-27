package com.colectivos.core;

import com.colectivos.model.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * MODEL — simula el recorrido del colectivo.
 * En cada tick avanza la posición según la velocidad efectiva,
 * detecta y aplica perturbaciones (eventos), y reporta el estado al MeasurementElement.
 */
@Component
public class RouteProcess {

    private double currentPositionKm = 0;
    private double baseCruiseVelocityKmh = 0;
    private double velocityModifier = 1.0;
    private double eventEndSimMinutes = -1;
    private double pauseUntilSimMinutes = -1;
    private long lastTickTimeMs = 0;
    private double simulatedElapsedMinutes = 0;
    private List<Event> pendingEvents = new ArrayList<>();
    private List<Event> appliedEvents = new ArrayList<>();

    /** Reinicia el proceso para un nuevo viaje. */
    public void reset(ControlPanelConfig config, Route route) {
        currentPositionKm = 0;
        baseCruiseVelocityKmh = computeCruiseVelocityKmh(config);
        velocityModifier = 1.0;
        eventEndSimMinutes = -1;
        pauseUntilSimMinutes = -1;
        lastTickTimeMs = System.currentTimeMillis();
        simulatedElapsedMinutes = 0;
        pendingEvents = new ArrayList<>(config.getEvents() != null ? config.getEvents() : new ArrayList<>());
        appliedEvents = new ArrayList<>();
    }

    /**
     * Avanza la simulación un tick y retorna el estado actual.
     * Llamado por JourneyEngine cada 10 segundos reales.
     */
    public ProcessTickData tick(ControlPanelConfig config, Route route) {
        long now = System.currentTimeMillis();
        double deltaRealMs = now - lastTickTimeMs;
        double deltaSimMinutes = deltaRealMs * config.getSimulationSpeedMultiplier() / 60_000.0;
        lastTickTimeMs = now;
        simulatedElapsedMinutes += deltaSimMinutes;

        double effectiveVelocity = computeEffectiveVelocityAtTime(simulatedElapsedMinutes, config);

        // Aplicar pausa si hay un evento DELAY o DETOUR activo
        if (pauseUntilSimMinutes > 0 && simulatedElapsedMinutes < pauseUntilSimMinutes) {
            effectiveVelocity = 0;
        } else {
            if (pauseUntilSimMinutes > 0) pauseUntilSimMinutes = -1;
        }

        // Aplicar modificador de velocidad si hay evento TRAFFIC o PASSENGERS activo
        if (eventEndSimMinutes > 0 && simulatedElapsedMinutes < eventEndSimMinutes) {
            effectiveVelocity *= velocityModifier;
        } else {
            if (eventEndSimMinutes > 0) {
                velocityModifier = 1.0;
                eventEndSimMinutes = -1;
            }
        }

        // Actualizar posición
        double deltaKm = effectiveVelocity * (deltaSimMinutes / 60.0);
        currentPositionKm = Math.max(0, currentPositionKm + deltaKm);

        // Detectar y aplicar eventos según la parada actual
        int stopIdx = computeCurrentStopIndex(currentPositionKm, route);
        checkAndApplyEvents(stopIdx, route);

        return new ProcessTickData(currentPositionKm, effectiveVelocity, now, simulatedElapsedMinutes);
    }

    /**
     * Calcula la velocidad de crucero objetivo según la opción de carga seleccionada.
     */
    public double computeCruiseVelocityKmh(ControlPanelConfig config) {
        return switch (config.getLoadingOption()) {
            case ACCEL_VELOCITY -> config.getExpectedVelocityKmh();
            case ACCEL_TIME -> {
                double vMs = config.getAccelerationMs2() * config.getApplicationTimeSeconds();
                yield Math.min(vMs * 3.6, 120.0);
            }
            case DIST_VELOCITY -> config.getAverageVelocityKmh();
        };
    }

    /**
     * Velocidad efectiva considerando la fase de aceleración.
     * En la opción DIST_VELOCITY se asume velocidad constante desde el inicio.
     */
    private double computeEffectiveVelocityAtTime(double simMinutes, ControlPanelConfig config) {
        if (config.getLoadingOption() == LoadingOption.DIST_VELOCITY) {
            return baseCruiseVelocityKmh;
        }
        // Fase de aceleración: a [m/s²] → a*3.6 [km/h/s] → en sim: a*3.6 km/h por sim-min
        double aKmhPerSimMin = config.getAccelerationMs2() * 3.6;
        double accelDurationMin = aKmhPerSimMin > 0 ? baseCruiseVelocityKmh / aKmhPerSimMin : 0;
        if (simMinutes < accelDurationMin) {
            return aKmhPerSimMin * simMinutes;
        }
        return baseCruiseVelocityKmh;
    }

    /** Determina en qué parada está el colectivo según su posición. */
    private int computeCurrentStopIndex(double positionKm, Route route) {
        double cumulative = 0;
        List<Stop> stops = route.getStops();
        for (int i = 0; i < stops.size(); i++) {
            cumulative += stops.get(i).getDistanceFromPreviousKm();
            if (positionKm <= cumulative) return i;
        }
        return stops.size() - 1;
    }

    /** Verifica si hay eventos pendientes en la parada actual y los aplica. */
    private void checkAndApplyEvents(int stopIdx, Route route) {
        if (stopIdx < 0 || stopIdx >= route.getStops().size()) return;
        String currentStop = route.getStops().get(stopIdx).getName();

        List<Event> toApply = pendingEvents.stream()
                .filter(e -> !e.isApplied() && currentStop.equals(e.getTriggerAtStop()))
                .collect(Collectors.toList());

        for (Event event : toApply) {
            applyEvent(event);
            event.setApplied(true);
            event.setAppliedAt(LocalDateTime.now());
            appliedEvents.add(event);
        }
        pendingEvents.removeIf(Event::isApplied);
    }

    private void applyEvent(Event event) {
        switch (event.getType()) {
            case DELAY -> pauseUntilSimMinutes = simulatedElapsedMinutes + event.getDelayMinutes();
            case DETOUR -> pauseUntilSimMinutes = simulatedElapsedMinutes + event.getExtraMinutes();
            case TRAFFIC, PASSENGERS -> {
                velocityModifier = Math.max(0.1, 1.0 - (event.getSpeedReductionPercent() / 100.0));
                eventEndSimMinutes = simulatedElapsedMinutes + event.getDurationMinutes();
            }
        }
    }

    public List<Event> getAppliedEvents() { return new ArrayList<>(appliedEvents); }
    public double getCurrentPositionKm() { return currentPositionKm; }
    public double getSimulatedElapsedMinutes() { return simulatedElapsedMinutes; }
}
