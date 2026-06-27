package com.colectivos.core;

import com.colectivos.model.ControlSignal;
import com.colectivos.model.SystemLog;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * MODEL — Actuador del Sistema.
 * Recibe la señal del SystemController y decide la acción a tomar.
 * Genera los logs correspondientes para cada tipo de señal.
 *
 * - OK:       registra que el sistema está dentro de banda.
 * - DELAYED:  registra la acción correctiva (el RouteProcess ajustará velocidad en el próximo tick).
 * - CRITICAL: registra el fallo irrecuperable y señala que el viaje debe terminar.
 */
@Component
public class BusActuator {

    private List<SystemLog> pendingLogs = new ArrayList<>();
    private boolean shouldTerminate = false;
    private double velocityBoostPercent = 0;

    public void reset() {
        pendingLogs.clear();
        shouldTerminate = false;
        velocityBoostPercent = 0;
    }

    /**
     * Actúa según la señal recibida del controlador.
     * @return logs generados en esta actuación
     */
    public List<SystemLog> act(EvaluationResult result) {
        List<SystemLog> logs = new ArrayList<>();
        shouldTerminate = false;
        velocityBoostPercent = 0;

        switch (result.getSignal()) {
            case OK -> {
                logs.add(new SystemLog("INFO", "ACTUATOR",
                        String.format("Sistema dentro de banda. Demora: %.1f min. Posición real: %.2f km / esperada: %.2f km.",
                                result.getDelayMinutes(), result.getRealPositionKm(), result.getExpectedPositionKm())));
            }
            case DELAYED -> {
                velocityBoostPercent = 10;
                logs.add(new SystemLog("WARNING", "ACTUATOR",
                        String.format("Sistema FUERA DE BANDA. Demora: %.1f min. Acción: aumentar velocidad %.0f%%. " +
                                        "Posición real: %.2f km / esperada: %.2f km.",
                                result.getDelayMinutes(), velocityBoostPercent,
                                result.getRealPositionKm(), result.getExpectedPositionKm())));
            }
            case CRITICAL -> {
                shouldTerminate = true;
                logs.add(new SystemLog("ERROR", "ACTUATOR",
                        String.format("DEMORA IRRECUPERABLE. Demora: %.1f min excede el máximo tolerable. " +
                                        "Posición real: %.2f km / esperada: %.2f km. Viaje terminado.",
                                result.getDelayMinutes(), result.getRealPositionKm(), result.getExpectedPositionKm())));
            }
        }

        pendingLogs.addAll(logs);
        return logs;
    }

    public boolean isShouldTerminate() { return shouldTerminate; }
    public double getVelocityBoostPercent() { return velocityBoostPercent; }

    public List<SystemLog> getPendingLogs() {
        List<SystemLog> copy = new ArrayList<>(pendingLogs);
        pendingLogs.clear();
        return copy;
    }
}
