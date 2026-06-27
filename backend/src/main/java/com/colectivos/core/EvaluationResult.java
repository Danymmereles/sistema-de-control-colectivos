package com.colectivos.core;

import com.colectivos.model.ControlSignal;

/** Resultado de la evaluación del SystemController enviado al BusActuator. */
public class EvaluationResult {
    private final ControlSignal signal;
    private final double delayMinutes;
    private final double expectedPositionKm;
    private final double realPositionKm;

    public EvaluationResult(ControlSignal signal, double delayMinutes,
                            double expectedPositionKm, double realPositionKm) {
        this.signal = signal;
        this.delayMinutes = delayMinutes;
        this.expectedPositionKm = expectedPositionKm;
        this.realPositionKm = realPositionKm;
    }

    public ControlSignal getSignal() { return signal; }
    public double getDelayMinutes() { return delayMinutes; }
    public double getExpectedPositionKm() { return expectedPositionKm; }
    public double getRealPositionKm() { return realPositionKm; }
}
