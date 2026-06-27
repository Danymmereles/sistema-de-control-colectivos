package com.colectivos.model;

import java.util.ArrayList;
import java.util.List;

public class JourneyState {
    private JourneyStatus status = JourneyStatus.WAITING;
    private String routeId;
    private String routeName;
    private int currentStopIndex = 0;
    private double currentPositionKm = 0;
    private double currentVelocityKmh = 0;
    private double elapsedSimulatedMinutes = 0;
    private double expectedPositionKm = 0;
    private double delayMinutes = 0;
    private ControlSignal controlSignal = ControlSignal.OK;
    private List<Event> appliedEvents = new ArrayList<>();
    private List<SystemLog> logs = new ArrayList<>();

    public JourneyStatus getStatus() { return status; }
    public void setStatus(JourneyStatus status) { this.status = status; }

    public String getRouteId() { return routeId; }
    public void setRouteId(String routeId) { this.routeId = routeId; }

    public String getRouteName() { return routeName; }
    public void setRouteName(String routeName) { this.routeName = routeName; }

    public int getCurrentStopIndex() { return currentStopIndex; }
    public void setCurrentStopIndex(int i) { this.currentStopIndex = i; }

    public double getCurrentPositionKm() { return currentPositionKm; }
    public void setCurrentPositionKm(double p) { this.currentPositionKm = p; }

    public double getCurrentVelocityKmh() { return currentVelocityKmh; }
    public void setCurrentVelocityKmh(double v) { this.currentVelocityKmh = v; }

    public double getElapsedSimulatedMinutes() { return elapsedSimulatedMinutes; }
    public void setElapsedSimulatedMinutes(double t) { this.elapsedSimulatedMinutes = t; }

    public double getExpectedPositionKm() { return expectedPositionKm; }
    public void setExpectedPositionKm(double p) { this.expectedPositionKm = p; }

    public double getDelayMinutes() { return delayMinutes; }
    public void setDelayMinutes(double d) { this.delayMinutes = d; }

    public ControlSignal getControlSignal() { return controlSignal; }
    public void setControlSignal(ControlSignal s) { this.controlSignal = s; }

    public List<Event> getAppliedEvents() { return appliedEvents; }
    public void setAppliedEvents(List<Event> e) { this.appliedEvents = e; }

    public List<SystemLog> getLogs() { return logs; }
    public void setLogs(List<SystemLog> logs) { this.logs = logs; }
}
