package com.colectivos.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Event {
    private String id;
    private EventType type;
    private String triggerAtStop;

    // DELAY
    private double delayMinutes;

    // DETOUR
    private double extraDistanceKm;
    private double extraMinutes;

    // TRAFFIC / PASSENGERS
    private double durationMinutes;
    private double speedReductionPercent;

    private boolean applied;
    private LocalDateTime appliedAt;

    public Event() {
        this.id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public EventType getType() { return type; }
    public void setType(EventType type) { this.type = type; }

    public String getTriggerAtStop() { return triggerAtStop; }
    public void setTriggerAtStop(String triggerAtStop) { this.triggerAtStop = triggerAtStop; }

    public double getDelayMinutes() { return delayMinutes; }
    public void setDelayMinutes(double delayMinutes) { this.delayMinutes = delayMinutes; }

    public double getExtraDistanceKm() { return extraDistanceKm; }
    public void setExtraDistanceKm(double extraDistanceKm) { this.extraDistanceKm = extraDistanceKm; }

    public double getExtraMinutes() { return extraMinutes; }
    public void setExtraMinutes(double extraMinutes) { this.extraMinutes = extraMinutes; }

    public double getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(double durationMinutes) { this.durationMinutes = durationMinutes; }

    public double getSpeedReductionPercent() { return speedReductionPercent; }
    public void setSpeedReductionPercent(double speedReductionPercent) { this.speedReductionPercent = speedReductionPercent; }

    public boolean isApplied() { return applied; }
    public void setApplied(boolean applied) { this.applied = applied; }

    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }
}
