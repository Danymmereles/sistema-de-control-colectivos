package com.colectivos.presenter;

import com.colectivos.model.Route;
import org.springframework.stereotype.Repository;

import java.util.*;

/**
 * PRESENTER — Repositorio en memoria de rutas disponibles.
 * Escalable: reemplazar por JPA Repository sin cambiar la interfaz pública.
 */
@Repository
public class RouteRepository {

    private final Map<String, Route> store = new LinkedHashMap<>();

    public void save(Route route) {
        store.put(route.getId(), route);
    }

    public Optional<Route> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<Route> findAll() {
        return new ArrayList<>(store.values());
    }

    public void delete(String id) {
        store.remove(id);
    }
}
