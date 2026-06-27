package com.colectivos.core;

import com.colectivos.model.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * MODEL — Motor del bucle de control.
 * Orquesta el ciclo: RouteProcess → MeasurementElement → SystemController → BusActuator.
 * Corre en un ScheduledExecutorService cada 10 segundos reales.
 * Empuja el estado actualizado al frontend vía WebSocket (SimpMessagingTemplate).
 */
@Component
public class JourneyEngine {

    private static final int CYCLE_INTERVAL_SECONDS = 10;

    private final RouteProcess routeProcess;
    private final MeasurementElement measurementElement;
    private final SystemController systemController;
    private final BusActuator busActuator;
    private final SimpMessagingTemplate messaging;

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private ScheduledFuture<?> runningTask;

    private JourneyState currentState = new JourneyState();
    private ControlPanelConfig activeConfig;
    private Route activeRoute;
    private volatile ControlPanelConfig pendingConfigUpdate = null;

    // Acumulador de todos los logs del viaje
    private final List<SystemLog> allLogs = new ArrayList<>();

    public JourneyEngine(RouteProcess routeProcess,
                         MeasurementElement measurementElement,
                         SystemController systemController,
                         BusActuator busActuator,
                         SimpMessagingTemplate messaging) {
        this.routeProcess = routeProcess;
        this.measurementElement = measurementElement;
        this.systemController = systemController;
        this.busActuator = busActuator;
        this.messaging = messaging;
    }

    // ─── API pública ──────────────────────────────────────────────────────────

    public synchronized void start(ControlPanelConfig config, Route route) {
        if (runningTask != null && !runningTask.isDone()) return;

        activeConfig = config;
        activeRoute = route;
        allLogs.clear();

        routeProcess.reset(config, route);
        measurementElement.reset();
        busActuator.reset();

        currentState = new JourneyState();
        currentState.setStatus(JourneyStatus.RUNNING);
        currentState.setRouteId(route.getId());
        currentState.setRouteName(route.getName());

        SystemLog startLog = new SystemLog("INFO", "ENGINE",
                "Viaje iniciado. Ruta: " + route.getName() +
                        " | Opción de carga: " + config.getLoadingOption() +
                        " | Velocidad sim: " + config.getSimulationSpeedMultiplier() + "x");
        addLog(startLog);
        pushState();

        runningTask = scheduler.scheduleAtFixedRate(this::cycle, 0, CYCLE_INTERVAL_SECONDS, TimeUnit.SECONDS);
    }

    public synchronized void stop() {
        if (runningTask != null) runningTask.cancel(false);
        currentState.setStatus(JourneyStatus.STOPPED);
        addLog(new SystemLog("INFO", "ENGINE", "Viaje detenido manualmente."));
        pushState();
    }

    /** Encola una actualización de configuración para aplicar en el próximo ciclo. */
    public void updateConfig(ControlPanelConfig newConfig) {
        pendingConfigUpdate = newConfig;
    }

    public JourneyState getCurrentState() { return currentState; }
    public List<SystemLog> getAllLogs() { return new ArrayList<>(allLogs); }

    // ─── Ciclo de control ─────────────────────────────────────────────────────

    private void cycle() {
        try {
            applyPendingConfigIfAny();

            // 1. RouteProcess → tick
            ProcessTickData tickData = routeProcess.tick(activeConfig, activeRoute);

            // 2. MeasurementElement → mide estado real
            MeasurementData measured = measurementElement.measure(tickData, activeConfig.getSimulationSpeedMultiplier());

            // 3. SystemController → evalúa esperado vs real
            EvaluationResult evaluation = systemController.evaluate(measured, activeConfig, activeRoute);

            // 4. BusActuator → actúa según señal
            List<SystemLog> cycleLogs = busActuator.act(evaluation);
            cycleLogs.forEach(this::addLog);

            // 5. Actualizar estado
            updateJourneyState(measured, evaluation);

            // 6. Verificar terminación
            if (busActuator.isShouldTerminate()) {
                currentState.setStatus(JourneyStatus.FAILED);
                stopInternal();
            } else if (measured.getRealPositionKm() >= activeRoute.getTotalDistanceKm()) {
                currentState.setStatus(JourneyStatus.COMPLETED);
                addLog(new SystemLog("INFO", "ENGINE", "Recorrido completado exitosamente."));
                stopInternal();
            }

            // 7. Push al frontend
            pushState();

        } catch (Exception e) {
            addLog(new SystemLog("ERROR", "ENGINE", "Error en ciclo de control: " + e.getMessage()));
            pushState();
        }
    }

    private void applyPendingConfigIfAny() {
        ControlPanelConfig pending = pendingConfigUpdate;
        if (pending != null) {
            pendingConfigUpdate = null;
            activeConfig = pending;
            addLog(new SystemLog("INFO", "ENGINE",
                    "Configuración del panel aplicada. Banda aceptable: " +
                            pending.getAcceptableDelayMinutes() + " min | Máxima: " +
                            pending.getMaxRecoverableDelayMinutes() + " min"));
        }
    }

    private void updateJourneyState(MeasurementData measured, EvaluationResult evaluation) {
        currentState.setCurrentPositionKm(Math.min(measured.getRealPositionKm(), activeRoute.getTotalDistanceKm()));
        currentState.setCurrentVelocityKmh(measured.getCurrentVelocityKmh());
        currentState.setElapsedSimulatedMinutes(measured.getTotalSimulatedMinutes());
        currentState.setExpectedPositionKm(evaluation.getExpectedPositionKm());
        currentState.setDelayMinutes(evaluation.getDelayMinutes());
        currentState.setControlSignal(evaluation.getSignal());
        currentState.setAppliedEvents(routeProcess.getAppliedEvents());
        currentState.setLogs(new ArrayList<>(allLogs));

        // Actualizar índice de parada
        int stopIdx = computeStopIndex(measured.getRealPositionKm());
        currentState.setCurrentStopIndex(stopIdx);
    }

    private int computeStopIndex(double posKm) {
        double cumulative = 0;
        List<Stop> stops = activeRoute.getStops();
        for (int i = 0; i < stops.size(); i++) {
            cumulative += stops.get(i).getDistanceFromPreviousKm();
            if (posKm <= cumulative) return i;
        }
        return stops.size() - 1;
    }

    private void addLog(SystemLog log) {
        allLogs.add(log);
        // Push log inmediato para que el frontend lo muestre sin esperar el próximo ciclo
        messaging.convertAndSend("/topic/journey/logs", log);
    }

    private void stopInternal() {
        if (runningTask != null) runningTask.cancel(false);
    }

    private void pushState() {
        messaging.convertAndSend("/topic/journey/state", currentState);
        messaging.convertAndSend("/topic/journey/signal",
                Map.of("signal", currentState.getControlSignal().name(),
                        "delayMinutes", currentState.getDelayMinutes()));
    }
}
