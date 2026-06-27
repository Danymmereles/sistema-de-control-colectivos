package com.colectivos.presenter;

import com.colectivos.core.JourneyEngine;
import com.colectivos.model.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * PRESENTER — Controlador REST.
 * Traduce las acciones del View (React) en llamadas al Model (JourneyEngine, RouteRepository).
 * No contiene lógica de negocio.
 */
@RestController
@RequestMapping("/api")
public class RestApiController {

    private final JourneyEngine journeyEngine;
    private final RouteRepository routeRepository;

    public RestApiController(JourneyEngine journeyEngine, RouteRepository routeRepository) {
        this.journeyEngine = journeyEngine;
        this.routeRepository = routeRepository;
    }

    // ─── Rutas ───────────────────────────────────────────────────────────────

    @GetMapping("/routes")
    public List<Route> getRoutes() {
        return routeRepository.findAll();
    }

    @PostMapping("/routes")
    public ResponseEntity<Route> createRoute(@RequestBody Route route) {
        if (route.getId() == null || route.getId().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        routeRepository.save(route);
        return ResponseEntity.ok(route);
    }

    // ─── Viaje ───────────────────────────────────────────────────────────────

    @PostMapping("/journey/start")
    public ResponseEntity<Map<String, String>> startJourney(@RequestBody ControlPanelConfig config) {
        if (config.getRouteId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "routeId es requerido"));
        }
        return routeRepository.findById(config.getRouteId())
                .map(route -> {
                    journeyEngine.start(config, route);
                    return ResponseEntity.ok(Map.of("status", "started", "routeId", route.getId()));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "Ruta no encontrada: " + config.getRouteId())));
    }

    @PostMapping("/journey/stop")
    public ResponseEntity<Map<String, String>> stopJourney() {
        journeyEngine.stop();
        return ResponseEntity.ok(Map.of("status", "stopped"));
    }

    @PutMapping("/journey/config")
    public ResponseEntity<Map<String, String>> updateConfig(@RequestBody ControlPanelConfig config) {
        journeyEngine.updateConfig(config);
        return ResponseEntity.ok(Map.of("status", "config_queued"));
    }

    @GetMapping("/journey/state")
    public JourneyState getState() {
        return journeyEngine.getCurrentState();
    }

    @GetMapping("/journey/logs")
    public List<SystemLog> getLogs() {
        return journeyEngine.getAllLogs();
    }
}
