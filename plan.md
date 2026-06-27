# Plan — Sistema de Colectivos Argentinos (React + Java)
**Trabajo de Cátedra — Mereles y Soto**

---

## Decisiones de diseño documentadas

### Tiempo de simulación
El elemento de medición requiere mínimo **10 segundos reales** entre envíos de información. Los recorridos pueden durar horas.

**Decisión**: Implementar un **multiplicador de velocidad de simulación** configurable desde el panel (1x a 600x). Default: **60x** (1 segundo real = 1 minuto simulado). Con 60x, un recorrido de 2 horas tarda 2 minutos reales. El multiplicador es ajustable desde el panel de control.

### Persistencia
Actualmente en memoria. Para escalabilidad futura se usa **H2 con almacenamiento en archivo** (`colectivos.mv.db`). No requiere servidor externo. Migrar a PostgreSQL solo requiere cambiar el datasource en `application.properties`.

### Generación del estado real
El **Proceso** simula la conducción, detecta incidencias y le pasa al **Elemento de Medición**: velocidad actual, timestamp y posición. El Elemento de Medición calcula cuánto tiempo transcurrió desde la última medición (`Δt = ahora - timestamp_última_medición`) y deriva los valores actuales antes de enviarlos al Controlador.

---

## Arquitectura MVP

El sistema sigue el patrón **Model–View–Presenter**:

```
┌──────────────────────────────────────────────────────────────┐
│  VIEW (React Frontend)                                       │
│  - ControlPanel: emite acciones, no tiene lógica de negocio  │
│  - Visualizer: renderiza el estado que recibe, sin lógica    │
└───────────────────────┬──────────────────────────────────────┘
                        │ REST + WebSocket (STOMP)
┌───────────────────────▼──────────────────────────────────────┐
│  PRESENTER (Spring Controllers + Hooks React)                │
│  - RestApiController: traduce acciones del View a Model      │
│  - WebSocketController: empuja estado formateado al View     │
│  - Hooks React (useWebSocket, useSystemState): reciben datos │
│    del Presenter y los adaptan para los componentes View     │
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│  MODEL (Lógica de negocio Java)                              │
│  - SystemController: compara esperado vs real, emite señal   │
│  - BusActuator: decide acción según señal del controlador    │
│  - RouteProcess: simula recorrido, aplica eventos            │
│  - MeasurementElement: mide y calcula estado real            │
│  - Entities: Route, Stop, Event, JourneyState, SystemLog     │
└──────────────────────────────────────────────────────────────┘
```

### Separación de responsabilidades MVP

| Capa | Componente | Responsabilidad |
|------|-----------|----------------|
| View | `ControlPanel.jsx` | Muestra campos, emite evento "Aceptar" al Presenter |
| View | `SystemVisualizer.jsx` | Renderiza el estado que recibe del Presenter |
| View | `LogPanel.jsx` | Lista los logs que le pasa el Presenter |
| Presenter | `RestApiController.java` | Recibe acción del View, delega al Model |
| Presenter | `WebSocketController.java` | Escucha al Model, formatea y empuja al View |
| Presenter | `useWebSocket.js` | Recibe datos del Presenter Java, los distribuye |
| Presenter | `useSystemState.js` | Mantiene el estado de pantalla derivado del Model |
| Model | `SystemController.java` | Lógica de control: comparación + banda de error |
| Model | `BusActuator.java` | Lógica de actuación según señal |
| Model | `RouteProcess.java` | Lógica de simulación del recorrido |
| Model | `MeasurementElement.java` | Lógica de medición y cálculo de estado real |

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|--------------|
| Backend | Java 17 + Spring Boot 3.x | Estructura clara, familiar |
| WebSocket | Spring WebSocket + STOMP | Push en tiempo real al front |
| Persistencia | H2 file-based | Sin servidor externo, escalable |
| Frontend | React 18 + Vite | Rápido, componentes claros |
| Estilos | Tailwind CSS | UI funcional sin setup complejo |
| Estado global | Zustand | Separa config pendiente vs aplicada |
| HTTP client | Axios | Llamadas REST |

---

## Estructura de directorios

```
TdC - Mereles y Soto/
├── plan.md                                    ← este archivo
├── backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/colectivos/
│           │   ├── ColectivosApplication.java          ← Main
│           │   │
│           │   ├── model/                              ← MODEL: entidades
│           │   │   ├── Route.java
│           │   │   ├── Stop.java
│           │   │   ├── Event.java
│           │   │   ├── EventType.java                  ← DELAY | DETOUR | TRAFFIC | PASSENGERS
│           │   │   ├── LoadingOption.java              ← ACCEL_VELOCITY | ACCEL_TIME | DIST_VELOCITY
│           │   │   ├── ControlSignal.java              ← OK | DELAYED | CRITICAL
│           │   │   ├── JourneyStatus.java              ← WAITING | RUNNING | COMPLETED | FAILED | STOPPED
│           │   │   ├── JourneyState.java
│           │   │   ├── ControlPanelConfig.java
│           │   │   └── SystemLog.java
│           │   │
│           │   ├── core/                               ← MODEL: lógica de negocio
│           │   │   ├── SystemController.java           ← compara esperado vs real, emite señal
│           │   │   ├── BusActuator.java                ← actúa según señal del controlador
│           │   │   ├── RouteProcess.java               ← simula recorrido, aplica eventos
│           │   │   ├── MeasurementElement.java         ← mide y calcula estado real
│           │   │   └── JourneyEngine.java              ← orquesta el bucle de control
│           │   │
│           │   ├── presenter/                          ← PRESENTER: traduce Model ↔ View
│           │   │   ├── RestApiController.java          ← endpoints REST
│           │   │   └── WebSocketController.java        ← push STOMP al frontend
│           │   │
│           │   └── config/
│           │       ├── WebSocketConfig.java
│           │       └── DataSeeder.java                 ← carga rutas de ejemplo al iniciar
│           └── resources/
│               └── application.properties
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        │
        ├── presenter/                                  ← PRESENTER: hooks que adaptan datos para el View
        │   ├── useWebSocket.js                         ← conexión STOMP, distribuye mensajes
        │   └── useSystemState.js                       ← estado de pantalla derivado del Model
        │
        ├── store/
        │   └── systemStore.js                          ← Zustand: config draft vs active
        │
        ├── services/
        │   └── api.js                                  ← llamadas REST al Presenter Java
        │
        └── view/                                       ← VIEW: solo renderiza, cero lógica de negocio
            ├── ControlPanel/
            │   ├── ControlPanel.jsx                    ← wrapper con botón "Aceptar"
            │   ├── RouteSelector.jsx
            │   ├── LoadingOptions.jsx                  ← 3 opciones con sus campos
            │   ├── ErrorBandConfig.jsx
            │   └── EventLoader.jsx                     ← carga de perturbaciones
            └── Visualizer/
                ├── SystemVisualizer.jsx                ← contenedor, siempre activo
                ├── RouteProgress.jsx                   ← barra de progreso con paradas
                ├── StatusCards.jsx                     ← velocidad, posición, tiempo, demora
                ├── ControllerStatus.jsx                ← señal OK / ACTUANDO / CRÍTICO
                └── LogPanel.jsx                        ← registro de perturbaciones y fallas
```

---

## Modelos de datos (Model)

### Route
```java
String id
String name          // "Línea 60 - Palermo → Constitución"
List<Stop> stops
double totalDistanceKm
double estimatedTotalMinutes
```

### Stop
```java
String name                           // "Plaza Italia"
double distanceFromPreviousKm
double estimatedMinutesFromPrevious
```

### ControlPanelConfig
```java
String routeId
LoadingOption loadingOption           // ACCEL_VELOCITY | ACCEL_TIME | DIST_VELOCITY

// Opción 1 — aceleración + velocidad esperada
double accelerationMs2
double expectedVelocityKmh

// Opción 2 — aceleración + tiempo de aplicación
double applicationTimeSeconds

// Opción 3 — distancia + velocidad promedio
double distanceKm
double averageVelocityKmh

// Bandas de error
double acceptableDelayMinutes         // dentro: señal OK
double maxRecoverableDelayMinutes     // fuera: señal CRITICAL, viaje termina

// Eventos programados
List<Event> events

// Velocidad simulación
int simulationSpeedMultiplier         // 1–600, default 60
```

### Event
```java
String id
EventType type          // DELAY | DETOUR | TRAFFIC | PASSENGERS
String triggerAtStop    // nombre de parada donde se activa

// DELAY
double delayMinutes

// DETOUR
double extraDistanceKm
double extraMinutes

// TRAFFIC
double durationMinutes
double speedReductionPercent

// PASSENGERS
double speedReductionPercent
double durationMinutes

boolean applied
LocalDateTime appliedAt
```

### JourneyState
```java
JourneyStatus status               // WAITING | RUNNING | COMPLETED | FAILED | STOPPED
int currentStopIndex
double currentPositionKm
double currentVelocityKmh
double elapsedSimulatedMinutes
double expectedPositionKm          // según plan original
double delayMinutes                // positivo = atrasado, negativo = adelantado
ControlSignal controlSignal        // OK | DELAYED | CRITICAL
List<Event> appliedEvents
List<SystemLog> logs
```

---

## Flujo del bucle de control (JourneyEngine)

```
[INICIO] Usuario pulsa "Iniciar" → REST POST /api/journey/start
         JourneyEngine arranca ScheduledExecutorService cada 10 seg reales

┌─────────────────────── CICLO (cada 10 seg reales) ───────────────────────┐
│                                                                           │
│  1. RouteProcess.tick()                                                   │
│     - Calcula posición/velocidad según tiempo simulado transcurrido       │
│     - Verifica si hay evento en la parada actual → aplica perturbación    │
│     - Retorna: { velocidadActual, timestamp, posiciónActual }             │
│                                                                           │
│  2. MeasurementElement.measure(datos del proceso)                         │
│     - Δt = System.currentTimeMillis() - timestamp_última_medición         │
│     - posiciónReal = posiciónAnterior + velocidad × Δt × multiplier       │
│     - Retorna: JourneyState actualizado                                   │
│                                                                           │
│  3. SystemController.evaluate(JourneyState)                               │
│     - Calcula posiciónEsperada según plan original + tiempo simulado      │
│     - demora = (posiciónEsperada - posiciónReal) / velocidadPromedio      │
│     - |demora| ≤ acceptable  → señal OK                                   │
│     - acceptable < |demora| ≤ maxRecoverable → señal DELAYED              │
│     - |demora| > maxRecoverable → señal CRITICAL                          │
│                                                                           │
│  4. BusActuator.act(señal)                                                │
│     - OK: log INFO "dentro de banda"                                      │
│     - DELAYED: log WARNING "acción correctiva: ajustar velocidad"         │
│     - CRITICAL: log ERROR "demora irrecuperable", terminar viaje          │
│                                                                           │
│  5. WebSocketController.push(JourneyState)                                │
│     → /topic/journey/state  (estado completo)                             │
│     → /topic/journey/signal (señal de control)                            │
│     → /topic/journey/logs   (nuevos logs)                                 │
│                                                                           │
│  6. ¿Estado == COMPLETED o FAILED? → detener executor → FIN               │
│     Si no → esperar 10 segundos → repetir                                 │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Condiciones de terminación

| Condición | Estado final |
|-----------|-------------|
| `currentPositionKm >= totalDistanceKm` | `COMPLETED` |
| `delayMinutes > maxRecoverableDelayMinutes` | `FAILED` |
| Señal `CRITICAL` del controlador | `FAILED` |
| Usuario pulsa "Detener" | `STOPPED` |

---

## Panel de Control — comportamiento MVP

- El **View** (`ControlPanel.jsx`) mantiene un estado **draft** local (Zustand).
- Los cambios en el panel **no afectan el sistema** hasta que el usuario pulsa **"Aceptar"**.
- Al pulsar "Aceptar": el **Presenter** (`useSystemState.js`) envía `PUT /api/journey/config` al Presenter Java.
- El **Presenter Java** (`RestApiController`) delega al **Model** (`JourneyEngine`) que aplica la config en el próximo ciclo.
- El **Visualizador** lee el estado que llega por WebSocket y sigue renderizando sin interrupciones.

---

## Endpoints REST (Presenter Java → Model)

| Método | Endpoint | Descripción |
|--------|---------|------------|
| GET | `/api/routes` | Lista rutas disponibles |
| POST | `/api/routes` | Crear ruta |
| POST | `/api/journey/start` | Inicia recorrido |
| POST | `/api/journey/stop` | Detiene recorrido |
| PUT | `/api/journey/config` | Aplica nueva config del panel |
| GET | `/api/journey/state` | Snapshot del estado actual |
| GET | `/api/journey/logs` | Historial completo de logs |

## WebSocket STOMP (Presenter Java → View)

| Topic | Contenido | Frecuencia |
|-------|----------|-----------|
| `/topic/journey/state` | JourneyState completo | Cada ciclo (10 seg) |
| `/topic/journey/signal` | ControlSignal actual | Cada ciclo |
| `/topic/journey/logs` | Nuevo SystemLog | Al generarse |

---

## Rutas de ejemplo (DataSeeder)

```
Línea 60 — Palermo → Constitución (12 km, 43 min estimados)
  Palermo         →  2.0 km, 5 min
  Santa Fe        →  3.0 km, 8 min
  Corrientes      →  3.0 km, 8 min
  9 de Julio      →  2.0 km, 7 min
  Constitución    →  2.0 km, 6 min  [fin]  ← total 12 km, 34 min

Línea 12 — Retiro → La Boca (10 km, 33 min estimados)
  Retiro          →  3.0 km, 6 min
  Lavalle         →  4.0 km, 11 min
  San Telmo       →  3.0 km, 10 min
  La Boca         →              [fin]
```

---

## Fases de implementación

### Fase 1 — Backend: Model core
- [ ] Setup Spring Boot 3 + WebSocket + H2
- [ ] Todos los modelos (`model/`)
- [ ] `RouteProcess` — tick básico (sin eventos)
- [ ] `MeasurementElement` — cálculo Δt y posición real
- [ ] `SystemController` — comparación + bandas de error
- [ ] `BusActuator` — logs según señal
- [ ] `JourneyEngine` — bucle con `ScheduledExecutorService`
- [ ] `DataSeeder` — rutas de ejemplo

### Fase 2 — Backend: Presenter Java
- [ ] `RestApiController` — todos los endpoints
- [ ] `WebSocketConfig` — configuración STOMP
- [ ] `WebSocketController` — push de estado al front

### Fase 3 — Backend: Eventos y perturbaciones
- [ ] `RouteProcess` — aplicación de eventos (DELAY, DETOUR, TRAFFIC, PASSENGERS)
- [ ] Reajuste del plan esperado al recibir un DETOUR
- [ ] Hot-reload de config en `JourneyEngine`

### Fase 4 — Frontend: Presenter JS
- [ ] Setup React + Vite + Tailwind + Zustand
- [ ] `api.js` — llamadas REST
- [ ] `useWebSocket.js` — conexión STOMP
- [ ] `useSystemState.js` — distribución de estado
- [ ] `systemStore.js` — draft vs active config

### Fase 5 — Frontend: View
- [ ] `ControlPanel` con estado draft y botón "Aceptar"
- [ ] `RouteSelector`, `LoadingOptions`, `ErrorBandConfig`, `EventLoader`
- [ ] `SystemVisualizer` — siempre activo
- [ ] `RouteProgress`, `StatusCards`, `ControllerStatus`, `LogPanel`

### Fase 6 — Integración y polish
- [ ] Prueba completa del flujo feliz
- [ ] Prueba de eventos y perturbaciones
- [ ] Prueba de condición CRITICAL y terminación
- [ ] Validaciones en panel de control
- [ ] Estilos finales
