import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

const LINES = [
  { id: '60', name: 'Línea 60', distanceKm: 15, timeMin: 9, maxVelocity: 120 },
  { id: '152', name: 'Línea 152', distanceKm: 20, timeMin: 12, maxVelocity: 120 },
  { id: '10', name: 'Línea 10', distanceKm: 12, timeMin: 7, maxVelocity: 130 },
];

export const SITUATION_CONFIG = {
  green: { message: 'Vamos bien con el tiempo', color: '#22C55E' },
  yellow: { message: 'Acelera para poder llegar bien con el tiempo', color: '#EAB308' },
  orange: { message: '¡Urgente! Acelera ahora o no llegarás a tiempo', color: '#F97316' },
  red: { message: 'Ya no se puede llegar según lo planificado', color: '#EF4444' },
};

export function formatTime(seconds) {
  if (seconds == null || !isFinite(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const MAX_ACCEL_MS2 = 10;
const MAX_DELTA_V_KMH_S = MAX_ACCEL_MS2 * 3.6;
const RED_TIMEOUT = 10;
const TOLERANCE = 30;
const MAX_DELAY = 180;
const FINE_PER_30S = 500;
const PAX_WAIT_SCALED = 2;

const initialState = {
  status: 'idle',
  line: null,
  stops: [],
  timeScale: 1,
  kv: 0.8,
  simTime: 0,
  position: 0,
  velocity: 0,
  acceleration: 0,
  throttle: 50,
  totalDistance: 0,
  fine: 0,
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
  events: [],
};

function computeTick(s, dt_real, dt_sim) {
  const logs = [];
  const newSimTime = s.simTime + dt_sim;
  const plannedTime = s.line.timeMin * 60;
  const totalStops = s.stops.length + 1;
  const timePerStop = plannedTime / totalStops;
  const maxVel = s.line.maxVelocity;

  let { isAtStop, stopWaitRemaining, currentStopIndex, stopPassengers, fineExemptRemaining,
    passengerPerturbation, fine, visitedStops, events, position, velocity, situation, redTimer } = s;

  // --- TARGET VELOCITY ---
  let targetVelocity = (s.throttle / 100) * maxVel * 1.3;
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
      if (delay > TOLERANCE && !exempt) stopFine = Math.ceil((delay - TOLERANCE) / 30) * FINE_PER_30S;
      fine += stopFine;
      if (exempt) fineExemptRemaining = Math.max(0, fineExemptRemaining - 1);
      visitedStops = [...visitedStops, { index: currentStopIndex, plannedArrival, actualArrival: newSimTime, delay, fine: stopFine, exempt, passengers: stopPassengers }];
      logs.push({ message: `🚏 Parada ${currentStopIndex + 1} — ${stopPassengers} pax${exempt ? ' (exenta)' : stopFine > 0 ? ` — Multa: $${stopFine}` : ' a tiempo'}`, type: exempt ? 'info' : stopFine > 0 ? 'warning' : 'success', time: newSimTime, id: Date.now() + Math.random() });
      isAtStop = false;
      currentStopIndex += 1;
      stopPassengers = 0;
      stopWaitRemaining = 0;
    }
  } else {
    const nextStopKm = currentStopIndex < s.stops.length ? s.stops[currentStopIndex] : s.totalDistance;
    if (position >= nextStopKm) {
      const isDestination = currentStopIndex >= s.stops.length;
      if (isDestination) {
        const plannedArrival = plannedTime;
        const delay = newSimTime - plannedArrival;
        let stopFine = 0;
        const exempt = fineExemptRemaining > 0;
        if (delay > TOLERANCE && !exempt) stopFine = Math.ceil((delay - TOLERANCE) / 30) * FINE_PER_30S;
        fine += stopFine;
        visitedStops = [...visitedStops, { index: currentStopIndex, plannedArrival, actualArrival: newSimTime, delay, fine: stopFine, exempt }];
        logs.push({ message: `✅ Destino alcanzado${stopFine > 0 ? ` — Multa: $${stopFine}` : ' a tiempo'}`, type: stopFine > 0 ? 'warning' : 'success', time: newSimTime, id: Date.now() + Math.random() });
        return { state: { ...s, status: 'finished', endReason: 'Destino alcanzado', simTime: newSimTime, position: s.totalDistance, velocity: 0, acceleration: 0, fine, visitedStops, events }, logs, chartPoint: null };
      }
      let passengers = Math.floor(Math.random() * 6);
      if (passengerPerturbation.active && passengerPerturbation.stopsRemaining > 0) {
        passengers = Math.min(passengers * 2, 10);
        const nsr = passengerPerturbation.stopsRemaining - 1;
        passengerPerturbation = { active: nsr > 0, stopsRemaining: Math.max(0, nsr) };
      }
      if (passengers === 0) {
        const plannedArrival = (currentStopIndex + 1) * timePerStop;
        const delay = newSimTime - plannedArrival;
        const exempt = fineExemptRemaining > 0;
        visitedStops = [...visitedStops, { index: currentStopIndex, plannedArrival, actualArrival: newSimTime, delay, fine: 0, exempt, skipped: true }];
        if (exempt) fineExemptRemaining = Math.max(0, fineExemptRemaining - 1);
        logs.push({ message: `🚏 Parada ${currentStopIndex + 1} — Sin pasajeros, continue`, type: 'info', time: newSimTime, id: Date.now() + Math.random() });
        currentStopIndex += 1;
      } else {
        isAtStop = true;
        stopPassengers = passengers;
        stopWaitRemaining = passengers * PAX_WAIT_SCALED;
        targetVelocity = 0;
        logs.push({ message: `🚏 Parada ${currentStopIndex + 1} — ${passengers} pax (${passengers * PAX_WAIT_SCALED}s)`, type: 'info', time: newSimTime, id: Date.now() + Math.random() });
      }
    } else {
      const distToStop = nextStopKm - position;
      const v_ms = velocity / 3.6;
      const stoppingDist_km = (v_ms * v_ms) / (2 * MAX_ACCEL_MS2) / 1000;
      if (distToStop < Math.max(stoppingDist_km, 0.05)) targetVelocity = 0;
    }
  }

  // --- ACCELERATION MODEL (KV scales max accel) ---
  const maxDeltaV = MAX_DELTA_V_KMH_S * s.kv * dt_sim;
  const deltaV = targetVelocity - velocity;
  const actualDeltaV = Math.abs(deltaV) > maxDeltaV ? Math.sign(deltaV) * maxDeltaV : deltaV;
  const newVelocity = Math.max(0, velocity + actualDeltaV);
  const newAcceleration = dt_sim > 0 ? (actualDeltaV / dt_sim) / 3.6 : 0;

  // --- SPEED LIMIT CHECK ---
  if (newVelocity > maxVel * 1.05 && !hasFailure) {
    const failureType = Math.random() < 0.5 ? 'engine_failure' : 'technical_problems';
    const label = failureType === 'engine_failure' ? 'FALLA EN EL MOTOR' : 'PROBLEMAS TÉCNICOS';
    events = [...events, { id: Date.now() + Math.random(), type: failureType, label, active: true, permanent: true }];
    logs.push({ message: `⚠️ Exceso de velocidad (${newVelocity.toFixed(0)} km/h): ${label}`, type: 'error', time: newSimTime, id: Date.now() + Math.random() });
  }

  // --- POSITION UPDATE ---
  const newPos = position + (newVelocity * dt_sim / 3600);

  // --- RESOLVE EVENTS ---
  events = events.map(ev => {
    if (ev.active && !ev.permanent && ev.resolvesAt && newSimTime >= ev.resolvesAt) {
      logs.push({ message: `✓ Resuelto: ${ev.label}`, type: 'info', time: newSimTime, id: Date.now() + Math.random() });
      return { ...ev, active: false };
    }
    return ev;
  });

  // --- SITUATION (based on next fine-eligible stop) ---
  const nextFineStopIdx = Math.min(currentStopIndex + fineExemptRemaining, s.stops.length);
  const nextFineStopKm = nextFineStopIdx < s.stops.length ? s.stops[nextFineStopIdx] : s.totalDistance;
  const plannedArrivalFine = (nextFineStopIdx + 1) * timePerStop;
  const remainingDistFine = Math.max(0, nextFineStopKm - newPos);
  const estimatedArrivalFine = newVelocity > 0.1 ? newSimTime + (remainingDistFine / newVelocity) * 3600 : Infinity;
  const estimatedDelay = estimatedArrivalFine - plannedArrivalFine;

  let newSituation = 'green';
  if (estimatedDelay < TOLERANCE) newSituation = 'green';
  else if (estimatedDelay < 90) newSituation = 'yellow';
  else if (estimatedDelay < MAX_DELAY) newSituation = 'orange';
  else newSituation = 'red';

  // --- RED TIMER (real time, NOT affected by timeScale) ---
  let newRedTimer = redTimer;
  if (newSituation === 'red') {
    newRedTimer += dt_real;
    if (newRedTimer >= RED_TIMEOUT) {
      logs.push({ message: `❌ FIN — No se llega a la parada ${nextFineStopIdx + 1} a tiempo`, type: 'error', time: newSimTime, id: Date.now() + Math.random() });
      return {
        state: { ...s, status: 'finished', endReason: `No se llega a la parada ${nextFineStopIdx + 1} a tiempo`, simTime: newSimTime, position: newPos, velocity: newVelocity, acceleration: newAcceleration, fine, situation: 'red', redTimer: newRedTimer, currentStopIndex, isAtStop, stopWaitRemaining, stopPassengers, fineExemptRemaining, passengerPerturbation, visitedStops, events },
        logs, chartPoint: null,
      };
    }
  } else {
    newRedTimer = 0;
  }

  // --- CHART DATA ---
  const originalDistance = s.line.distanceKm;
  const plannedPosition = (newSimTime / plannedTime) * originalDistance;
  const remainingDistTotal = Math.max(0, s.totalDistance - newPos);
  const estimatedArrivalTotal = newVelocity > 0.1 ? newSimTime + (remainingDistTotal / newVelocity) * 3600 : null;
  const chartPoint = {
    time: newSimTime,
    position: newPos,
    plannedPosition,
    positionError: Math.abs(plannedPosition - newPos),
    estimatedArrival: estimatedArrivalTotal,
    plannedArrival: plannedTime,
    timeError: estimatedArrivalTotal != null ? Math.abs(estimatedArrivalTotal - plannedTime) : null,
    nextStop: nextFineStopIdx + 1,
  };

  return {
    state: { ...s, simTime: newSimTime, position: newPos, velocity: newVelocity, acceleration: newAcceleration, isAtStop, stopWaitRemaining, currentStopIndex, stopPassengers, fineExemptRemaining, passengerPerturbation, fine, visitedStops, events, situation: newSituation, redTimer: newRedTimer },
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
      addLog(`▶️ Simulación iniciada — ${prev.line.name} (${prev.line.distanceKm} km, ${prev.line.timeMin} min)`, 'info', 0);
      addLog(`🚏 ${prev.stops.length + 1} paradas totales (incl. destino)`, 'info', 0);
      return { ...prev, status: 'running', simTime: 0, position: 0, velocity: 0, acceleration: 0, throttle: 50, totalDistance: prev.line.distanceKm, fine: 0, situation: 'green', redTimer: 0, endReason: null, currentStopIndex: 0, isAtStop: false, stopWaitRemaining: 0, stopPassengers: 0, visitedStops: [], fineExemptRemaining: 0, passengerPerturbation: { active: false, stopsRemaining: 0 }, events: [] };
    });
    setLog([]);
    setChartData([]);
    tickCount.current = 0;
  }, [addLog]);

  const pause = useCallback(() => { setSim(prev => ({ ...prev, status: 'paused' })); addLog('⏸️ Simulación pausada', 'info'); }, [addLog]);
  const resume = useCallback(() => { setSim(prev => ({ ...prev, status: 'running' })); addLog('▶️ Simulación reanudada', 'info'); }, [addLog]);
  const reset = useCallback(() => { setSim(initialState); setLog([]); setChartData([]); tickCount.current = 0; }, []);
  const accelerate = useCallback(() => { setSim(prev => ({ ...prev, throttle: Math.min(100, prev.throttle + 10) })); }, []);
  const brake = useCallback(() => { setSim(prev => ({ ...prev, throttle: Math.max(0, prev.throttle - 10) })); }, []);
  const setTimeScale = useCallback((ts) => { setSim(prev => ({ ...prev, timeScale: ts })); }, []);
  const setKv = useCallback((v) => { setSim(prev => ({ ...prev, kv: v })); }, []);
  const setThrottle = useCallback((v) => { setSim(prev => ({ ...prev, throttle: Math.max(0, Math.min(100, v)) })); }, []);

  const addStop = useCallback((km) => {
    setSim(prev => prev.status !== 'idle' ? prev : ({ ...prev, stops: [...prev.stops, km].sort((a, b) => a - b) }));
    addLog(`🚏 Parada agregada en km ${km}`, 'info', 0);
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
      addLog(`⚠️ ${label} — Velocidad a 0 (irreversible)`, 'error');
      return { ...prev, events: [...prev.events, { id: Date.now() + Math.random(), type, label, active: true, permanent: true }] };
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

  const derived = useMemo(() => {
    if (!sim.line) return { plannedTime: 0, originalDistance: 0, totalStops: 0, timePerStop: 0, nextStopKm: 0, nextStopNumber: 0, plannedArrivalNext: 0, estimatedArrivalNext: null, plannedArrivalTotal: 0, estimatedArrivalTotal: null, plannedPosition: 0, nextFineStopNumber: 0 };
    const plannedTime = sim.line.timeMin * 60;
    const originalDistance = sim.line.distanceKm;
    const totalStops = sim.stops.length + 1;
    const timePerStop = plannedTime / totalStops;
    const nextStopKm = sim.currentStopIndex < sim.stops.length ? sim.stops[sim.currentStopIndex] : sim.totalDistance;
    const nextStopNumber = sim.currentStopIndex + 1;
    const plannedArrivalNext = nextStopNumber * timePerStop;
    const remainingDistNext = Math.max(0, nextStopKm - sim.position);
    const estimatedArrivalNext = sim.velocity > 0.1 ? sim.simTime + (remainingDistNext / sim.velocity) * 3600 : null;
    const remainingDistTotal = Math.max(0, sim.totalDistance - sim.position);
    const estimatedArrivalTotal = sim.velocity > 0.1 ? sim.simTime + (remainingDistTotal / sim.velocity) * 3600 : null;
    const plannedPosition = (sim.simTime / plannedTime) * originalDistance;
    const nextFineStopIdx = Math.min(sim.currentStopIndex + sim.fineExemptRemaining, sim.stops.length);
    return { plannedTime, originalDistance, totalStops, timePerStop, nextStopKm, nextStopNumber, plannedArrivalNext, estimatedArrivalNext, plannedArrivalTotal: plannedTime, estimatedArrivalTotal, plannedPosition, nextFineStopNumber: nextFineStopIdx + 1 };
  }, [sim]);

  const value = {
    LINES, SITUATION_CONFIG, formatTime,
    ...sim, ...derived,
    panelOpen, setPanelOpen, log, chartData,
    selectLine, start, pause, resume, reset, accelerate, brake,
    addStop, removeStop, injectPerturbation, injectFailure, injectPassengerSurge,
    setTimeScale, setKv, setThrottle,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}