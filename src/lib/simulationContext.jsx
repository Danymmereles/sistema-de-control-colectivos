import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

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

const BUS_MASS_KG = 12000;
const MAX_ACCEL_MS2 = 2.5;
const MAX_FORCE_N = BUS_MASS_KG * MAX_ACCEL_MS2;

const PAX_BOARDING_SEC = 10;
const PLANNED_AVG_PAX = 3;
const STOP_OVERHEAD_SEC = 60;

const GRACE_PERIOD = 60;
const YELLOW_LIMIT = 180;
const STOP_TOLERANCE = 420;
const MAX_ACCUMULATED_DELAY = 420;
const FINE_PER_30S = 500;

const SPEED_FAILURE_FACTOR = 1.2;
const STOP_DECEL_ZONE_KM = 0.05;

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
  kp: 5000,
  kv: 0.8,
  simTime: 0,
  redTimer: 0,
  position: 0,
  velocity: 0,
  acceleration: 0,
  throttle: 50,
  totalDistance: 0,
  fine: 0,
  accumulatedDelay: 0,
  situation: 'green',
  endReason: null,
  currentStopIndex: 0,
  isAtStop: false,
  stopWaitRemaining: 0,
  stopPassengers: 0,
  visitedStops: [],
  fineExemptRemaining: 0,
  surgeStops: [], // Arreglo de índices de paradas con mucha gente
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
    surgeStops, fine, accumulatedDelay, visitedStops, events, position, velocity } = s;

  let targetVelocity = s.line.velocity * (s.throttle / 50);
  if (targetVelocity > maxVel) targetVelocity = maxVel;

  const hasFailure = events.some(e => e.active && (e.type === 'engine_failure' || e.type === 'technical_problems'));
  if (hasFailure) targetVelocity = 0;

  if (isAtStop) {
    stopWaitRemaining -= dt_sim;
    targetVelocity = 0;
    if (stopWaitRemaining <= 0) {
      const plannedArrival = (currentStopIndex + 1) * timePerStop;
      const delay = newSimTime - plannedArrival;
      let stopFine = 0;
      const exempt = fineExemptRemaining > 0;

      if (delay > GRACE_PERIOD && !exempt) stopFine = Math.ceil((delay - GRACE_PERIOD) / 30) * FINE_PER_30S;
      fine += stopFine;
      if (exempt) fineExemptRemaining = Math.max(0, fineExemptRemaining - 1);
      accumulatedDelay += Math.max(0, delay);

      visitedStops = [...visitedStops, { index: currentStopIndex, plannedArrival, actualArrival: newSimTime, delay, fine: stopFine, exempt, passengers: stopPassengers }];
      logs.push({ message: `🚏 Parada ${currentStopIndex + 1} — ${stopPassengers} pax${exempt ? ' (exenta)' : stopFine > 0 ? ` — Multa: $${stopFine}` : ' a tiempo'}`, type: exempt ? 'info' : stopFine > 0 ? 'warning' : 'success', time: newSimTime, id: Date.now() + Math.random() });

      isAtStop = false;
      currentStopIndex += 1;
      stopPassengers = 0;
      stopWaitRemaining = 0;
    }
  } else {
    const nextStopKm = currentStopIndex < s.stops.length ? s.stops[currentStopIndex] : s.totalDistance;
    if (position >= nextStopKm - 0.015) {
      position = nextStopKm;
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
        logs.push({ message: `✅ Destino alcanzado${stopFine > 0 ? ` — Multa: $${stopFine}` : ' a tiempo'}`, type: stopFine > 0 ? 'warning' : 'success', time: newSimTime, id: Date.now() + Math.random() });
        return { state: { ...s, status: 'finished', endReason: 'Destino alcanzado', simTime: newSimTime, position: s.totalDistance, velocity: 0, acceleration: 0, fine, accumulatedDelay, visitedStops, events }, logs, chartPoint: null };
      }

      let passengers = Math.floor(Math.random() * 6); // 0 a 5 por defecto

      // Lógica de mucha gente en parada específica
      if (surgeStops.includes(currentStopIndex)) {
        passengers = Math.floor(Math.random() * 5) + 8; // 8 a 12 pasajeros
        surgeStops = surgeStops.filter(idx => idx !== currentStopIndex); // Remover la parada de la lista
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
        const ratio = Math.max(0.05, distToStop / STOP_DECEL_ZONE_KM);
        targetVelocity = Math.min(targetVelocity, s.line.velocity * ratio);
      }

      if (distToStop <= stoppingDist_km && stoppingDist_km > 0.005) {
        targetVelocity = 0;
      }
    }
  }

  const targetVelocity_ms = targetVelocity / 3.6;
  const currentVelocity_ms = velocity / 3.6;
  const errorVelocidad = targetVelocity_ms - currentVelocity_ms;

  const Kp = s.kp;
  let fuerzaAplicada = Kp * errorVelocidad;

  if (fuerzaAplicada > MAX_FORCE_N) fuerzaAplicada = MAX_FORCE_N;
  if (fuerzaAplicada < -MAX_FORCE_N) fuerzaAplicada = -MAX_FORCE_N;

  const newAcceleration_ms2 = fuerzaAplicada / BUS_MASS_KG;
  const actualDeltaV_ms = newAcceleration_ms2 * dt_sim;

  const newVelocity = Math.max(0, velocity + (actualDeltaV_ms * 3.6));
  const newAcceleration = dt_sim > 0 ? newAcceleration_ms2 : 0;
  const newPos = position + (newVelocity * dt_sim / 3600);

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

  const nextFineStopIdx = Math.min(currentStopIndex + fineExemptRemaining, s.stops.length);
  const nextFineStopKm = nextFineStopIdx < s.stops.length ? s.stops[nextFineStopIdx] : s.totalDistance;
  const plannedArrivalFine = (nextFineStopIdx + 1) * timePerStop;
  const remainingDistFine = Math.max(0, nextFineStopKm - newPos);

  const estimatedArrivalFine = newSimTime + stopWaitRemaining + (remainingDistFine / s.line.velocity) * 3600;
  const estimatedDelay = estimatedArrivalFine - plannedArrivalFine;

  let newSituation = 'green';
  if (estimatedDelay < -GRACE_PERIOD) newSituation = 'blue';
  else if (estimatedDelay < GRACE_PERIOD) newSituation = 'green';
  else if (estimatedDelay < YELLOW_LIMIT) newSituation = 'yellow';
  else if (estimatedDelay < STOP_TOLERANCE) newSituation = 'orange';
  else newSituation = 'red';

  let newRedTimer = s.redTimer;
  if (newSituation === 'red') {
    newRedTimer += dt_sim;
    if (newRedTimer >= 10) {
      const label = 'SERVICIO INCUMPLIDO — Atraso irreversible sostenido';
      const remainingStops = totalStops - currentStopIndex;
      const failureFine = remainingStops * Math.ceil(STOP_TOLERANCE / 30) * FINE_PER_30S;
      logs.push({ message: `❌ ${label} — Multa: $${failureFine}`, type: 'error', time: newSimTime, id: Date.now() + Math.random() });
      return {
        state: { ...s, status: 'finished', endReason: label, simTime: newSimTime, position: newPos, velocity: 0, acceleration: 0, fine: fine + failureFine, situation: 'red', redTimer: newRedTimer, visitedStops, accumulatedDelay },
        logs, chartPoint: null,
      };
    }
  } else {
    newRedTimer = 0;
  }

  const originalDistance = s.line.distanceKm;
  const plannedPosition = (newSimTime / plannedTime) * originalDistance;
  const remainingDistTotal = Math.max(0, s.totalDistance - newPos);
  const estimatedArrivalTotal = newSimTime + stopWaitRemaining + (remainingDistTotal / s.line.velocity) * 3600;

  const chartPoint = {
    time: newSimTime, position: newPos, plannedPosition, positionError: Math.abs(plannedPosition - newPos),
    estimatedArrival: estimatedArrivalTotal, plannedArrival: plannedTime, timeError: Math.abs(estimatedArrivalTotal - plannedTime), nextStop: nextFineStopIdx + 1,
    velocity: newVelocity, acceleration: newAcceleration // <-- Agregados para los gráficos
  };

  return {
    state: { ...s, simTime: newSimTime, position: newPos, velocity: newVelocity, acceleration: newAcceleration, isAtStop, stopWaitRemaining, currentStopIndex, stopPassengers, fineExemptRemaining, surgeStops, fine, accumulatedDelay, visitedStops, events, situation: newSituation, speedWarned: false, redTimer: newRedTimer },
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
    setSim(prev => prev.status !== 'idle' ? prev : ({ ...prev, line: ln, stops: [ln.distanceKm / 4, ln.distanceKm / 2, ln.distanceKm * 3 / 4] }));
  }, []);

  const start = useCallback(() => {
    setSim(prev => {
      if (!prev.line || prev.stops.length < 3) return prev;
      addLog(`▶️ Simulación iniciada — ${prev.line.name}`, 'info', 0);
      return { ...prev, status: 'running', simTime: 0, position: 0, velocity: 0, acceleration: 0, throttle: 50, totalDistance: prev.line.distanceKm, fine: 0, accumulatedDelay: 0, situation: 'green', currentStopIndex: 0, isAtStop: false, stopWaitRemaining: 0, visitedStops: [], events: [], redTimer: 0, surgeStops: [] };
    });
    setLog([]); setChartData([]); tickCount.current = 0;
  }, [addLog]);

  const pause = useCallback(() => { setSim(prev => ({ ...prev, status: 'paused' })); addLog('⏸️ Simulación pausada', 'info'); }, [addLog]);
  const resume = useCallback(() => { setSim(prev => ({ ...prev, status: 'running' })); addLog('▶️ Simulación reanudada', 'info'); }, [addLog]);
  const reset = useCallback(() => { setSim({ ...initialState, timeScale: simRef.current.timeScale, kp: simRef.current.kp, kv: simRef.current.kv }); setLog([]); setChartData([]); tickCount.current = 0; }, []);
  const accelerate = useCallback(() => { setSim(prev => ({ ...prev, throttle: Math.min(100, prev.throttle + 10) })); }, []);
  const brake = useCallback(() => { setSim(prev => ({ ...prev, throttle: Math.max(0, prev.throttle - 10) })); }, []);
  const setTimeScale = useCallback((ts) => { setSim(prev => ({ ...prev, timeScale: ts })); }, []);
  const setKp = useCallback((v) => { setSim(prev => ({ ...prev, kp: Math.max(100, Math.min(20000, v)) })); }, []);
  const setKv = useCallback(() => {}, []);
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

  // Modificado para aceptar el segmento específico
  const injectPerturbation = useCallback((type, segmentIndex) => {
    setSim(prev => {
      if (prev.status !== 'running') return prev;
      let meters;
      if (type === 'choque' || type === 'corte') meters = 300;
      else if (type === 'manifestacion') meters = (Math.floor(Math.random() * 5) + 1) * 200 + 100;
      else return prev;
      const km = meters / 1000;
      const exemptStops = Math.floor(meters / 300);

      // Actualizamos las distancias de las paradas que están DESPUÉS del segmento afectado
      const newStops = prev.stops.map((stopKm, i) => {
        if (i >= segmentIndex) return stopKm + km;
        return stopKm;
      });

      const safeKm = Number(km || 0);
      addLog(`⚠️ ${type.toUpperCase()} en Tramo ${segmentIndex + 1}: +${Math.round(safeKm * 100) / 100} km (${exemptStops} parada(s) exenta(s))`, 'warning');

      return {
        ...prev, stops: newStops, totalDistance: prev.totalDistance + km, fineExemptRemaining: prev.fineExemptRemaining + exemptStops,
        events: [...prev.events, { id: Date.now() + Math.random(), type, label: `${type.toUpperCase()} +${Math.round(safeKm * 100) / 100} km`, addedDistanceKm: km, active: true, resolvesAt: prev.simTime + 30 }],
      };
    });
  }, [addLog]);

  const injectFailure = useCallback((type) => {
    setSim(prev => {
      if (prev.status !== 'running') return prev;
      const label = type === 'engine_failure' ? 'FALLA EN EL MOTOR' : 'PROBLEMAS TÉCNICOS';
      const totalStops = prev.stops.length + 1;
      const remainingStops = totalStops - prev.currentStopIndex;
      const failureFine = remainingStops * Math.ceil(STOP_TOLERANCE / 30) * FINE_PER_30S;
      addLog(`⚠️ ${label} — Multa: $${failureFine}`, 'error');
      return { ...prev, status: 'finished', endReason: `${label}`, fine: prev.fine + failureFine, velocity: 0, acceleration: 0, events: [...prev.events, { id: Date.now() + Math.random(), type, label, active: true, permanent: true }] };
    });
  }, [addLog]);

  // Modificado para recibir el índice de la parada exacta
  const injectPassengerSurge = useCallback((stopIndex) => {
    setSim(prev => {
      if (prev.status !== 'running') return prev;

      addLog(`⚠️ Parada ${stopIndex + 1} notificada con multitud de pasajeros`, 'warning');
      return {
        ...prev,
        surgeStops: [...prev.surgeStops, stopIndex],
        events: [...prev.events, { id: Date.now() + Math.random(), type: 'passenger_surge', label: `MULTITUD EN PARADA ${stopIndex + 1}`, active: true }]
      };
    });
  }, [addLog]);

  const derived = useMemo(() => {
    if (!sim.line) {
      return {
        plannedTime: 0, originalDistance: 0, totalStops: 0, timePerStop: 0,
        nextStopKm: 0, nextStopNumber: 0, plannedArrivalNext: 0, estimatedArrivalNext: 0,
        plannedArrivalTotal: 0, estimatedArrivalTotal: 0, plannedPosition: 0, nextFineStopNumber: 0
      };
    }
    const plannedTime = computePlannedTime(sim.line, sim.stops);
    const originalDistance = sim.line.distanceKm;
    const totalStops = sim.stops.length + 1;
    const timePerStop = plannedTime / totalStops;
    const nextStopKm = sim.currentStopIndex < sim.stops.length ? sim.stops[sim.currentStopIndex] : sim.totalDistance;
    const nextStopNumber = sim.currentStopIndex + 1;
    const plannedArrivalNext = nextStopNumber * timePerStop;
    const remainingDistNext = Math.max(0, nextStopKm - sim.position);
    const estimatedArrivalNext = sim.simTime + sim.stopWaitRemaining + (remainingDistNext / sim.line.velocity) * 3600;
    const remainingDistTotal = Math.max(0, sim.totalDistance - sim.position);
    const estimatedArrivalTotal = sim.simTime + sim.stopWaitRemaining + (remainingDistTotal / sim.line.velocity) * 3600;
    const plannedPosition = (sim.simTime / plannedTime) * originalDistance;
    const nextFineStopIdx = Math.min(sim.currentStopIndex + sim.fineExemptRemaining, sim.stops.length);

    return { plannedTime, originalDistance, totalStops, timePerStop, nextStopKm, nextStopNumber, plannedArrivalNext, estimatedArrivalNext, plannedArrivalTotal: plannedTime, estimatedArrivalTotal, plannedPosition, nextFineStopNumber: nextFineStopIdx + 1 };
  }, [sim]);

  const value = {
    LINES, SITUATION_CONFIG, formatTime,
    ...sim, ...derived,
    panelOpen, setPanelOpen, log, chartData,
    speedWarning: !!(sim.line && sim.velocity > sim.line.maxVelocity),
    selectLine, start, pause, resume, reset, accelerate, brake,
    addStops, removeStop, injectPerturbation, injectFailure, injectPassengerSurge,
    setTimeScale, setKp, setKv, setThrottle,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}