import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

// --- Recorridos predefinidos ---
// velocity    = velocidad promedio / crucero (≈30 km/h)
// maxVelocity = velocidad máxima del recorrido (tope)
const LINES = [
  { id: '60', name: 'Línea 60', distanceKm: 15, velocity: 30, maxVelocity: 60 },
  { id: '152', name: 'Línea 152', distanceKm: 20, velocity: 30, maxVelocity: 55 },
  { id: '10', name: 'Línea 10', distanceKm: 12, velocity: 30, maxVelocity: 65 },
].map(l => ({ ...l, timeMin: (l.distanceKm / l.velocity) * 60 }));

export const SITUATION_CONFIG = {
  blue: { message: 'Adelantado al horario. Desacelerar para mantener frecuencia', color: '#3B82F6' },
  green: { message: 'Frecuencia y tiempo correctos', color: '#22C55E' },
  yellow: { message: 'Atraso leve. El controlador exige aceleración', color: '#EAB308' },
  orange: { message: 'Atraso crítico. Compensando al máximo posible', color: '#F97316' },
  red: { message: 'Servicio incumplido (fuera del umbral)', color: '#EF4444' },
};

export function formatTime(seconds) {
  if (seconds == null || !isFinite(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtDelay(sec) {
  if (sec == null || !isFinite(sec)) return '--';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// --- Parámetros Físicos y de Control (F = m * a) ---
const BUS_MASS_KG = 12000;         // Masa del colectivo en kg
const MAX_ACCEL_MS2 = 2.5;         // Límite físico de aceleración/frenado (confort pasajero)
const MAX_FORCE_N = BUS_MASS_KG * MAX_ACCEL_MS2;

// --- Subida/bajada de pasajeros ---
const PAX_BOARDING_SEC = 10;
const PLANNED_AVG_PAX = 3;
const STOP_OVERHEAD_SEC = 60;

// --- Tolerancias de Control (5 Minutos) ---
const GRACE_PERIOD = 60;           // 1 min de margen de error del tráfico antes de multa
const STOP_TOLERANCE = 300;        // 5 min: atraso por parada que finaliza la simulación
const MAX_ACCUMULATED_DELAY = 300; // 5 min: atraso acumulado máximo
const FINE_PER_30S = 500;          // $500 cada 30s de demora sobre la tolerancia

// --- Velocidad: advertencia y falla ---
const THROTTLE_TARGET_FACTOR = 1.0;  // Target regulado por el controlador
const SPEED_FAILURE_FACTOR = 1.2;    // Falla si excede el límite máximo por más del 20%
const STOP_DECEL_ZONE_KM = 0.07;

function computePlannedTime(line, stops) {
  const totalStops = stops.length + 1;
  const boardingTime = PLANNED_AVG_PAX * PAX_BOARDING_SEC * totalStops;
  const overhead = STOP_OVERHEAD_SEC * totalStops;
  return line.timeMin * 60 + boardingTime + overhead;
}

const initialState = {
  status: 'idle',
  line: null,
  stops: [],
  timeScale: 5,
  kv: 0.8, // Ganancia Proporcional (Kp)
  simTime: 0,
  position: 0,
  velocity: 0,
  acceleration: 0,
  throttle: 50,
  totalDistance: 0,
  fine: 0,
  accumulatedDelay: 0,
  situation: 'green',
  redTimer: 0,
  endReason: null,
  currentStopIndex: 0,
  isAtStop: false,
  stopWaitRemaining: 0,
  stopPassengers: 0,
  visitedStops: [],
  fineExemptRemaining: 0,
  passengerPerturbation: { active: false, stopsRemaining: 0 },
  speedWarned: false,
  events: [],
};

function computeTick(s, dt_real, dt_sim) {
  const logs = [];
  const newSimTime = s.simTime + dt_sim;
  const plannedTime = computePlannedTime(s.line, s.stops);
  const totalStops = s.stops.length + 1;
  const timePerStop = plannedTime / totalStops;
  const maxVel = s.line.maxVelocity;

  let { isAtStop, stopWaitRemaining, currentStopIndex, stopPassengers, fineExemptRemaining,
    passengerPerturbation, fine, accumulatedDelay, visitedStops, events, position, velocity } = s;

  // --- CONTROLADOR: TARGET VELOCITY ---
  // Inicia asumiendo que debe ir a la velocidad promedio/crucero para mantener frecuencia
  let targetVelocity = s.line.velocity * (s.throttle / 50);
  if (targetVelocity > maxVel) targetVelocity = maxVel; // Techo de seguridad legal

  const hasFailure = events.some(e => e.active && (e.type === 'engine_failure' || e.type === 'technical_problems'));
  if (hasFailure) targetVelocity = 0;

  // --- STOP LOGIC ---
  if (isAtStop) {
    stopWaitRemaining -= dt_sim;
    targetVelocity = 0;
    if (stopWaitRemaining <= 0) {
      const plannedArrival = (currentStopIndex + 1) * timePerStop;
      const delay = newSimTime - plannedArrival;
      let stopFine = 0;
      const exempt = fineExemptRemaining > 0;

      // Multa si supera la tolerancia
      if (delay > GRACE_PERIOD && !exempt) stopFine = Math.ceil((delay - GRACE_PERIOD) / 30) * FINE_PER_30S;
      fine += stopFine;
      if (exempt) fineExemptRemaining = Math.max(0, fineExemptRemaining - 1);
      accumulatedDelay += Math.max(0, delay);

      visitedStops = [...visitedStops, { index: currentStopIndex, plannedArrival, actualArrival: newSimTime, delay, fine: stopFine, exempt, passengers: stopPassengers }];
      logs.push({ message: `🚏 Parada ${currentStopIndex + 1} — ${stopPassengers} pax${exempt ? ' (exenta)' : stopFine > 0 ? ` — Multa: $${stopFine}` : ' a tiempo'}`, type: exempt ? 'info' : stopFine > 0 ? 'warning' : 'success', time: newSimTime, id: Date.now() + Math.random() });

      if (delay > STOP_TOLERANCE) {
        const failureFine = (totalStops - currentStopIndex) * Math.ceil(STOP_TOLERANCE / 30) * FINE_PER_30S;
        logs.push({ message: `❌ SERVICIO INCUMPLIDO — Atraso supera los 5 min. Multa a paradas restantes: $${failureFine}`, type: 'error', time: newSimTime, id: Date.now() + Math.random() });
        return { state: { ...s, status: 'finished', endReason: 'Demora excedió 5 minutos', simTime: newSimTime, position, velocity: 0, acceleration: 0, fine: fine + failureFine, accumulatedDelay, visitedStops, events }, logs, chartPoint: null };
      }

      isAtStop = false;
      currentStopIndex += 1;
      stopPassengers = 0;
      stopWaitRemaining = 0;
    }
  } else {
    const nextStopKm = currentStopIndex < s.stops.length ? s.stops[currentStopIndex] : s.totalDistance;

    // CORRECCIÓN 1: Tolerancia de llegada (15 metros = 0.015 km)
    if (position >= nextStopKm - 0.015) {
      position = nextStopKm; // Snap a la parada para evitar errores matemáticos

      const isDestination = currentStopIndex >= s.stops.length;
      if (isDestination) {
        const plannedArrival = plannedTime;
        const delay = newSimTime - plannedArrival;
        let stopFine = 0;
        const exempt = fineExemptRemaining > 0;
        if (delay > GRACE_PERIOD && !exempt) stopFine = Math.ceil((delay - GRACE_PERIOD) / 30) * FINE_PER_30S;
        fine += stopFine;
        accumulatedDelay += Math.max(0, delay);
        visitedStops = [...visitedStops, { index: currentStopIndex, plannedArrival, actualArrival: newSimTime, delay, fine: stopFine, exempt }];

        if (delay > STOP_TOLERANCE) {
          logs.push({ message: `❌ SERVICIO INCUMPLIDO — Atraso supera los 5 min al destino`, type: 'error', time: newSimTime, id: Date.now() + Math.random() });
          return { state: { ...s, status: 'finished', endReason: 'Atraso superior a 5 min', simTime: newSimTime, position: s.totalDistance, velocity: 0, acceleration: 0, fine, accumulatedDelay, visitedStops, events }, logs, chartPoint: null };
        }
        logs.push({ message: `✅ Destino alcanzado${stopFine > 0 ? ` — Multa: $${stopFine}` : ' a tiempo'}`, type: stopFine > 0 ? 'warning' : 'success', time: newSimTime, id: Date.now() + Math.random() });
        return { state: { ...s, status: 'finished', endReason: 'Destino alcanzado', simTime: newSimTime, position: s.totalDistance, velocity: 0, acceleration: 0, fine, accumulatedDelay, visitedStops, events }, logs, chartPoint: null };
      }

      let passengers = Math.floor(Math.random() * 6); // 0..5 pax
      if (passengerPerturbation.active && passengerPerturbation.stopsRemaining > 0) {
        passengers = Math.min(passengers * 2, 10);
        const nsr = passengerPerturbation.stopsRemaining - 1;
        passengerPerturbation = { active: nsr > 0, stopsRemaining: Math.max(0, nsr) };
      }
      if (passengers === 0) {
        currentStopIndex += 1;
      } else {
        isAtStop = true;
        stopPassengers = passengers;
        stopWaitRemaining = passengers * PAX_BOARDING_SEC;
        targetVelocity = 0;
        logs.push({ message: `🚏 Parada ${currentStopIndex + 1} — ${passengers} pax (${stopWaitRemaining}s)`, type: 'info', time: newSimTime, id: Date.now() + Math.random() });
      }
    } else {
      const distToStop = nextStopKm - position;
      const v_ms = velocity / 3.6;
      const stoppingDist_km = (v_ms * v_ms) / (2 * MAX_ACCEL_MS2) / 1000;

      if (distToStop < STOP_DECEL_ZONE_KM) {
        // CORRECCIÓN 2: Nunca pedir 0 de velocidad absoluto en la zona de frenado para que llegue a tocar la parada.
        // Mantiene un mínimo de 5% de empuje hasta entrar en los 15 metros.
        const ratio = Math.max(0.05, distToStop / STOP_DECEL_ZONE_KM);
        targetVelocity = Math.min(targetVelocity, s.line.velocity * ratio);
      }

      // Frena a cero solo si físicamente se va a pasar de la parada
      if (distToStop <= stoppingDist_km && stoppingDist_km > 0.005) {
        targetVelocity = 0;
      }
    }
  }

  // --- CONTROLADOR PROPORCIONAL Y FÍSICA (Segunda Ley de Newton: F = m * a) ---
  // El error es la diferencia entre la velocidad deseada para cumplir la frecuencia y la actual
  const targetVelocity_ms = targetVelocity / 3.6;
  const currentVelocity_ms = velocity / 3.6;
  const errorVelocidad = targetVelocity_ms - currentVelocity_ms;

  // Fuerza Proporcional (Kp = s.kv * factor constante)
  const Kp = 5000 * s.kv;
  let fuerzaAplicada = Kp * errorVelocidad;

  // Saturación de la fuerza para no superar los límites físicos del motor/frenos
  if (fuerzaAplicada > MAX_FORCE_N) fuerzaAplicada = MAX_FORCE_N;
  if (fuerzaAplicada < -MAX_FORCE_N) fuerzaAplicada = -MAX_FORCE_N;

  // a = F / m
  const newAcceleration_ms2 = fuerzaAplicada / BUS_MASS_KG;
  const actualDeltaV_ms = newAcceleration_ms2 * dt_sim;

  const newVelocity = Math.max(0, velocity + (actualDeltaV_ms * 3.6));
  const newAcceleration = dt_sim > 0 ? newAcceleration_ms2 : 0;

  // --- UPDATE DE POSICIÓN ---
  const newPos = position + (newVelocity * dt_sim / 3600);

  // --- CONTROL DE FALLAS (Límite máximo) ---
  if (newVelocity > maxVel * SPEED_FAILURE_FACTOR && !hasFailure) {
    const failureType = 'engine_failure';
    const label = 'FALLA EN EL MOTOR POR EXCESO DE VELOCIDAD';
    const remainingStops = totalStops - currentStopIndex;
    const failureFine = remainingStops * Math.ceil(STOP_TOLERANCE / 30) * FINE_PER_30S;
    logs.push({ message: `⚠️ ${label} — Multa: $${failureFine}`, type: 'error', time: newSimTime, id: Date.now() + Math.random() });
    return {
      state: { ...s, status: 'finished', endReason: label, simTime: newSimTime, position: newPos, velocity: 0, acceleration: 0, fine: fine + failureFine, events: [...events, { id: Date.now() + Math.random(), type: failureType, label, active: true, permanent: true }], currentStopIndex, isAtStop, situation: 'red' },
      logs, chartPoint: null,
    };
  }

// --- SITUATION Y ESTABILIDAD DE ESTIMACIÓN ---
  const nextFineStopIdx = Math.min(currentStopIndex + fineExemptRemaining, s.stops.length);
  const nextFineStopKm = nextFineStopIdx < s.stops.length ? s.stops[nextFineStopIdx] : s.totalDistance;
  const plannedArrivalFine = (nextFineStopIdx + 1) * timePerStop;
  const remainingDistFine = Math.max(0, nextFineStopKm - newPos);

  const estimatedArrivalFine = newSimTime + stopWaitRemaining + (remainingDistFine / s.line.velocity) * 3600;
  const estimatedDelay = estimatedArrivalFine - plannedArrivalFine;

  let newSituation = 'green';
  // Si el delay es negativo y supera el minuto de gracia, va muy rápido
  if (estimatedDelay < -GRACE_PERIOD) newSituation = 'blue';
  // Si está dentro del +/- 1 minuto, va perfecto
  else if (estimatedDelay < GRACE_PERIOD) newSituation = 'green';
  else if (estimatedDelay < (STOP_TOLERANCE / 2)) newSituation = 'yellow';
  else if (estimatedDelay < STOP_TOLERANCE) newSituation = 'orange';
  else newSituation = 'red';
  // --- CHART DATA ---
  const originalDistance = s.line.distanceKm;
  const plannedPosition = (newSimTime / plannedTime) * originalDistance;
  const remainingDistTotal = Math.max(0, s.totalDistance - newPos);
  const estimatedArrivalTotal = newSimTime + stopWaitRemaining + (remainingDistTotal / s.line.velocity) * 3600;

  const chartPoint = {
    time: newSimTime,
    position: newPos,
    plannedPosition,
    positionError: Math.abs(plannedPosition - newPos),
    estimatedArrival: estimatedArrivalTotal,
    plannedArrival: plannedTime,
    timeError: Math.abs(estimatedArrivalTotal - plannedTime),
    nextStop: nextFineStopIdx + 1,
  };

  return {
    state: { ...s, simTime: newSimTime, position: newPos, velocity: newVelocity, acceleration: newAcceleration, isAtStop, stopWaitRemaining, currentStopIndex, stopPassengers, fineExemptRemaining, passengerPerturbation, fine, accumulatedDelay, visitedStops, events, situation: newSituation, speedWarned: false },
    logs, chartPoint,
  };
}

const SimulationContext = createContext(null);

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}

export function SimulationProvider({ children }) {
  const [sim, setSim] = useState(initialState);
  const [log, setLog] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [panelOpen, setPanelOpen] = useState(true);
  const simRef = useRef(sim);
  simRef.current = sim;
  const tickCount = useRef(0);

  const addLog = useCallback((message, type = 'info', time = null) => {
    setLog(prev => [...prev.slice(-100), { message, type, time: time ?? simRef.current.simTime, id: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const s = simRef.current;
      if (s.status !== 'running') return;
      const dt_real = 0.1;
      const dt_sim = dt_real * s.timeScale;
      const result = computeTick(s, dt_real, dt_sim);
      setSim(result.state);
      if (result.logs.length > 0) setLog(prev => [...prev.slice(-100), ...result.logs]);
      tickCount.current++;
      if (tickCount.current % 3 === 0 && result.chartPoint) {
        setChartData(prev => {
          const next = [...prev, result.chartPoint];
          return next.length > 150 ? next.slice(-150) : next;
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const selectLine = useCallback((ln) => {
    setSim(prev => prev.status !== 'idle' ? prev : ({
      ...prev, line: ln, stops: [ln.distanceKm / 4, ln.distanceKm / 2, ln.distanceKm * 3 / 4],
    }));
  }, []);

  const start = useCallback(() => {
    setSim(prev => {
      if (!prev.line || prev.stops.length < 3) return prev;
      addLog(`▶️ Simulación iniciada — ${prev.line.name} (${prev.line.distanceKm} km, Planificado: ${Math.round(computePlannedTime(prev.line, prev.stops)/60)} min)`, 'info', 0);
      return { ...prev, status: 'running', simTime: 0, position: 0, velocity: 0, acceleration: 0, throttle: 50, totalDistance: prev.line.distanceKm, fine: 0, accumulatedDelay: 0, situation: 'green', currentStopIndex: 0, isAtStop: false, stopWaitRemaining: 0, visitedStops: [], events: [] };
    });
    setLog([]);
    setChartData([]);
    tickCount.current = 0;
  }, [addLog]);

  const pause = useCallback(() => { setSim(prev => ({ ...prev, status: 'paused' })); addLog('⏸️ Simulación pausada', 'info'); }, [addLog]);
  const resume = useCallback(() => { setSim(prev => ({ ...prev, status: 'running' })); addLog('▶️ Simulación reanudada', 'info'); }, [addLog]);
  const reset = useCallback(() => { setSim({ ...initialState, timeScale: simRef.current.timeScale, kv: simRef.current.kv }); setLog([]); setChartData([]); tickCount.current = 0; }, []);
  const accelerate = useCallback(() => { setSim(prev => ({ ...prev, throttle: Math.min(100, prev.throttle + 10) })); }, []);
  const brake = useCallback(() => { setSim(prev => ({ ...prev, throttle: Math.max(0, prev.throttle - 10) })); }, []);
  const setTimeScale = useCallback((ts) => { setSim(prev => ({ ...prev, timeScale: ts })); }, []);
  const setKv = useCallback((v) => { setSim(prev => ({ ...prev, kv: v })); }, []);
  const setThrottle = useCallback((v) => { setSim(prev => ({ ...prev, throttle: Math.max(0, Math.min(100, v)) })); }, []);

  const addStops = useCallback((count) => {
    setSim(prev => {
      if (prev.status !== 'idle' || !prev.line) return prev;
      const newCount = prev.stops.length + count;
      const dist = prev.line.distanceKm;
      const newStops = Array.from({ length: newCount }, (_, i) => dist * (i + 1) / (newCount + 1));
      addLog(`🚏 ${count} parada(s) agregada(s)`, 'info', 0);
      return { ...prev, stops: newStops };
    });
  }, [addLog]);

  const removeStop = useCallback((km) => {
    setSim(prev => {
      if (prev.status !== 'idle' || prev.stops.length <= 3) return prev;
      return { ...prev, stops: prev.stops.filter(s => s !== km) };
    });
  }, []);

  const injectPerturbation = useCallback((type) => {
    setSim(prev => {
      if (prev.status !== 'running') return prev;
      let meters;
      if (type === 'choque' || type === 'corte') meters = 300;
      else if (type === 'manifestacion') meters = (Math.floor(Math.random() * 5) + 1) * 200 + 100;
      else return prev;
      const km = meters / 1000;
      const exemptStops = Math.floor(meters / 300);
      addLog(`⚠️ ${type.toUpperCase()}: +${km.toFixed(2)} km (${exemptStops} parada(s) exenta(s))`, 'warning');
      return {
        ...prev,
        totalDistance: prev.totalDistance + km,
        fineExemptRemaining: prev.fineExemptRemaining + exemptStops,
        events: [...prev.events, { id: Date.now() + Math.random(), type, label: `${type.toUpperCase()} +${km.toFixed(2)} km`, addedDistanceKm: km, active: true, resolvesAt: prev.simTime + 30 }],
      };
    });
  }, [addLog]);

  const injectFailure = useCallback((type) => {
    setSim(prev => {
      if (prev.status !== 'running') return prev;
      const label = type === 'engine_failure' ? 'FALLA EN EL MOTOR' : 'PROBLEMAS TÉCNICOS';
      const totalStops = prev.stops.length + 1;
      const remainingStops = totalStops - prev.currentStopIndex;
      // Usamos STOP_TOLERANCE en lugar de MAX_DELAY que fue removido
      const failureFine = remainingStops * Math.ceil(STOP_TOLERANCE / 30) * FINE_PER_30S;
      addLog(`⚠️ ${label} — Multa: $${failureFine} (${remainingStops} parada(s) restante(s))`, 'error');
      return {
        ...prev,
        status: 'finished',
        endReason: `${label} — Multa: $${failureFine}`,
        fine: prev.fine + failureFine,
        velocity: 0,
        acceleration: 0,
        events: [...prev.events, { id: Date.now() + Math.random(), type, label, active: true, permanent: true }],
      };
    });
  }, [addLog]);

  const injectPassengerSurge = useCallback((stopsCount) => {
    setSim(prev => {
      if (prev.status !== 'running') return prev;
      const remaining = prev.stops.length - prev.currentStopIndex;
      const actual = Math.min(stopsCount, remaining);
      if (actual === 0) return prev;
      addLog(`⚠️ Paradas con mucha gente: x2 pasajeros por ${actual} paradas`, 'warning');
      return {
        ...prev,
        passengerPerturbation: { active: true, stopsRemaining: actual },
        events: [...prev.events, { id: Date.now() + Math.random(), type: 'passenger_surge', label: `PARADAS CON MUCHA GENTE (${actual})`, active: true }],
      };
    });
  }, [addLog]);

  // --- RESTAURADO CON LA CORRECCIÓN DE VELOCIDAD ---
  const derived = useMemo(() => {
    if (!sim.line) return { plannedTime: 0, originalDistance: 0, totalStops: 0, timePerStop: 0, nextStopKm: 0, nextStopNumber: 0, plannedArrivalNext: 0, estimatedArrivalNext: null, plannedArrivalTotal: 0, estimatedArrivalTotal: null, plannedPosition: 0, nextFineStopNumber: 0 };

    const plannedTime = computePlannedTime(sim.line, sim.stops);
    const originalDistance = sim.line.distanceKm;
    const totalStops = sim.stops.length + 1;
    const timePerStop = plannedTime / totalStops;

    const nextStopKm = sim.currentStopIndex < sim.stops.length ? sim.stops[sim.currentStopIndex] : sim.totalDistance;
    const nextStopNumber = sim.currentStopIndex + 1;
    const plannedArrivalNext = nextStopNumber * timePerStop;

    const remainingDistNext = Math.max(0, nextStopKm - sim.position);
    // Corrección: Usamos sim.line.velocity para evitar que tire Infinity al frenar
    const estimatedArrivalNext = sim.simTime + sim.stopWaitRemaining + (remainingDistNext / sim.line.velocity) * 3600;

    const remainingDistTotal = Math.max(0, sim.totalDistance - sim.position);
    // Corrección: Usamos sim.line.velocity para el cálculo total también
    const estimatedArrivalTotal = sim.simTime + sim.stopWaitRemaining + (remainingDistTotal / sim.line.velocity) * 3600;

    const plannedPosition = (sim.simTime / plannedTime) * originalDistance;
    const nextFineStopIdx = Math.min(sim.currentStopIndex + sim.fineExemptRemaining, sim.stops.length);

    return {
      plannedTime, originalDistance, totalStops, timePerStop,
      nextStopKm, nextStopNumber, plannedArrivalNext, estimatedArrivalNext,
      plannedArrivalTotal: plannedTime, estimatedArrivalTotal,
      plannedPosition, nextFineStopNumber: nextFineStopIdx + 1
    };
  }, [sim]);

  const value = {
    LINES, SITUATION_CONFIG, formatTime,
    ...sim, ...derived,
    panelOpen, setPanelOpen, log, chartData,
    selectLine, start, pause, resume, reset, accelerate, brake,
    addStops, removeStop, injectPerturbation, injectFailure, injectPassengerSurge,
    setTimeScale, setKv, setThrottle,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}