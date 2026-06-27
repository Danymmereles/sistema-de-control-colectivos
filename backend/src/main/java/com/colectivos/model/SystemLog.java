package com.colectivos.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class SystemLog {
    private String id;
    private LocalDateTime timestamp;
    private String level;      // INFO | WARNING | ERROR
    private String component;  // CONTROLLER | ACTUATOR | PROCESS | MEASUREMENT
    private String message;

    public SystemLog() {}

    public SystemLog(String level, String component, String message) {
        this.id = UUID.randomUUID().toString();
        this.timestamp = LocalDateTime.now();
        this.level = level;
        this.component = component;
        this.message = message;
    }

    public String getId() { return id; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getLevel() { return level; }
    public String getComponent() { return component; }
    public String getMessage() { return message; }

    public void setId(String id) { this.id = id; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public void setLevel(String level) { this.level = level; }
    public void setComponent(String component) { this.component = component; }
    public void setMessage(String message) { this.message = message; }
}
