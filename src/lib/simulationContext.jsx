import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const LINES = [
  { id: '60', name: 'Línea 60', distanceKm: 15, timeMin: 45, maxVelocity: 60 },
  { id: '152', name: 'Línea 152', distanceKm: 20, timeMin: 60, maxVelocity: 55 },
  { id: '10', name: 'Línea 10', distanceKm: 12, timeMin: 35, maxVelocity: 50 },
];

export const SITUATION_CONFIG = {
  green: { message: 'Vamos bien con el tiempo', color: '#22C55E' },
  yellow: { message: 'Acelera para poder llegar bien con el tiempo', color: '#EAB308' },
  orange: { message: '¡Urgente! Acelera ahora o no llegarás a tiempo', color: '#F97316' },
  red: { message: 'Ya no se puede llegar según lo planificado', color: '#EF4444' },
};

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const SimulationContext = createContext(null);

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}

export function SimulationProvider({ children }) {
  const [status, setStatus] = useState('idle');
  const [line, setLine] = useState(null);
  const [timeScale, setTimeScale] = useState(1);
  const [simTime, setSimTime] = useState(0);
  const [position, setPosition] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [kv, setKv] = useState(0.8);
  const [events, setEvents] = useState([]);
  const [log, setLog] = useState([]);
  const [stops, setStops] = useState([]);
  const [deviations, setDeviations] = useState([]);
  const [situation, setSituation] = useState('green');
  const [redTimer, setRedTimer] = useState(0);
  const [endReason, setEndReason] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recoveries, setRecoveries] = useState([]);
  const [panelOpen, setPanelOpen] = useState(true);

  const stateRef = useRef({});
  stateRef.current = { status, line, timeScale, simTime, position, totalDistance, velocity, throttle, kv, events, stops, deviations, situation, redTimer };
  const tickCount = useRef(0);
  const devStates = useRef({});

  const addLog = useCallback((message, type = 'info') => {
    setLog(prev => [...prev.slice(-80), { message, type, time: stateRef.current.simTime, id: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.status !== 'running') return;

      const dt = 0.1 * s.timeScale;
      const newSimTime = s.simTime + dt;
      let targetVel = (s.throttle / 100) * (s.line?.maxVelocity || 60);

      for (const stop of s.stops) {
        const d = stop - s.position;
        if (d > 0 && d < 0.2) targetVel = 0;
      }

      for (const ev of s.events) {
        if (!ev.active) continue;
        if (ev.type === 'engine_failure') targetVel = 0;
        if (ev.type === 'technical_problems') targetVel = Math.min(targetVel, (s.line?.maxVelocity || 60) * 0.3);
        if (['manifestacion', 'choque', 'corte'].includes(ev.type)) {
          const d = ev.location - s.position;
          if (d > 0 && d < 0.2) targetVel = 0;
        }
      }

      const newVel = s.velocity + (targetVel - s.velocity) * Math.min(s.kv * dt, 1);
      const clampedVel = Math.max(0, newVel);
      const newPos = s.position + (clampedVel * dt / 3600);

      if (newPos >= s.totalDistance) {
        setPosition(s.totalDistance);
        setStatus('finished');
        setEndReason('Destino alcanzado con éxito');
        addLog('✅ Destino alcanzado', 'success');
        return;
      }

      for (const dev of s.deviations) {
        const devEnd = dev.startKm + dev.detourKm;
        if (!devStates.current[dev.id] && newPos >= dev.startKm && newPos < devEnd) {
          devStates.current[dev.id] = { enterTime: newSimTime };
          addLog(`↩️ Entrada al desvío en km ${dev.startKm.toFixed(1)}`, 'warning');
        } else if (devStates.current[dev.id] && !devStates.current[dev.id].exitTime && newPos >= devEnd) {
          devStates.current[dev.id].exitTime = newSimTime;
          const recT = newSimTime - devStates.current[dev.id].enterTime;
          setRecoveries(prev => [...prev, { deviationId: dev.id, enterTime: devStates.current[dev.id].enterTime, exitTime: newSimTime, recoveryTime: recT }]);
          addLog(`↩️ Retomó recorrido — Recuperación: ${recT.toFixed(0)}s`, 'info');
        }
      }

      const remainingDist = s.totalDistance - newPos;
      const remainingTime = (s.line.timeMin * 60) - newSimTime;
      let newSit = 'green';
      let newRed = s.redTimer;

      if (remainingTime <= 0) {
        newSit = 'red';
      } else {
        const reqVel = remainingDist / (remainingTime / 3600);
        if (reqVel <= s.line.maxVelocity * 0.6) newSit = 'green';
        else if (reqVel <= s.line.maxVelocity * 0.85) newSit = 'yellow';
        else if (reqVel <= s.line.maxVelocity) newSit = 'orange';
        else newSit = 'red';
      }

      if (newSit === 'red') {
        newRed += dt;
        if (newRed >= 120) {
          setStatus('finished');
          setEndReason('No se llegó a tiempo a destino');
          addLog('❌ FIN DE LA SIMULACIÓN — No se llegó a tiempo', 'error');
          return;
        }
      } else {
        newRed = 0;
      }

      let eventsChanged = false;
      const updatedEvents = s.events.map(ev => {
        if (ev.active && ev.resolvesAt && newSimTime >= ev.resolvesAt) {
          eventsChanged = true;
          addLog(`✓ Resuelto: ${ev.label}`, 'info');
          return { ...ev, active: false, resolved: true };
        }
        return ev;
      });

      tickCount.current++;
      if (tickCount.current % 3 === 0) {
        setChartData(prev => {
          const next = [...prev, { time: newSimTime, velocity: clampedVel, targetVelocity: targetVel, error: targetVel - clampedVel, position: newPos }];
          return next.length > 120 ? next.slice(-120) : next;
        });
      }

      setSimTime(newSimTime);
      setPosition(newPos);
      setVelocity(clampedVel);
      setSituation(newSit);
      setRedTimer(newRed);
      if (eventsChanged) setEvents(updatedEvents);
    }, 100);

    return () => clearInterval(interval);
  }, [addLog]);

  const start = (selectedLine) => {
    const ln = selectedLine || line;
    if (!ln) return;
    setLine(ln);
    setTotalDistance(ln.distanceKm);
    setStatus('running');
    setEvents([]); setLog([]); setStops([]); setDeviations([]);
    setSimTime(0); setPosition(0); setVelocity(0); setThrottle(50);
    setSituation('green'); setRedTimer(0); setEndReason(null);
    setChartData([]); setRecoveries([]);
    devStates.current = {}; tickCount.current = 0;
    addLog(`▶️ Simulación iniciada — ${ln.name}`, 'info');
  };

  const pause = () => { setStatus('paused'); addLog('⏸️ Simulación pausada', 'info'); };
  const resume = () => { setStatus('running'); addLog('▶️ Simulación reanudada', 'info'); };

  const reset = () => {
    setStatus('idle'); setLine(null); setSimTime(0); setPosition(0); setTotalDistance(0);
    setVelocity(0); setThrottle(0); setEvents([]); setLog([]); setStops([]); setDeviations([]);
    setSituation('green'); setRedTimer(0); setEndReason(null); setChartData([]); setRecoveries([]);
    devStates.current = {}; tickCount.current = 0;
  };

  const accelerate = () => setThrottle(prev => Math.min(100, prev + 10));
  const brake = () => setThrottle(prev => Math.max(0, prev - 10));

  const addStop = (km) => { setStops(prev => [...prev, km].sort((a, b) => a - b)); addLog(`🚏 Parada agregada en km ${km}`, 'info'); };
  const removeStop = (km) => { setStops(prev => prev.filter(s => s !== km)); addLog(`🚏 Parada eliminada en km ${km}`, 'info'); };

  const injectPerturbation = (type, location) => {
    const labels = { manifestacion: 'MANIFESTACIÓN', choque: 'CHOQUE', corte: 'CORTE' };
    const durations = { manifestacion: 60, choque: 120, corte: 180 };
    setEvents(prev => [...prev, { id: Date.now() + Math.random(), type, label: `${labels[type]} A ${location} KM`, location, active: true, resolvesAt: stateRef.current.simTime + durations[type] }]);
    addLog(`⚠️ ${labels[type]} a ${location} km`, 'warning');
  };

  const injectFailure = (type) => {
    const labels = { engine_failure: 'FALLA EN EL MOTOR', technical_problems: 'PROBLEMAS TÉCNICOS' };
    const durations = { engine_failure: 90, technical_problems: 60 };
    setEvents(prev => [...prev, { id: Date.now() + Math.random(), type, label: labels[type], active: true, resolvesAt: stateRef.current.simTime + durations[type] }]);
    addLog(`⚠️ ${labels[type]}`, 'error');
  };

  const injectDeviation = (location) => {
    const detourKm = 2;
    setDeviations(prev => [...prev, { id: Date.now(), startKm: location, detourKm }].sort((a, b) => a.startKm - b.startKm));
    setTotalDistance(prev => prev + detourKm);
    addLog(`↩️ Desvío en km ${location} (+${detourKm} km)`, 'warning');
  };

  const value = {
    LINES, SITUATION_CONFIG, formatTime,
    status, line, timeScale, simTime, position, totalDistance, velocity, throttle, kv,
    events, log, stops, deviations, situation, redTimer, endReason, chartData, recoveries,
    panelOpen, setPanelOpen, setLine, setTimeScale, setKv, setThrottle,
    start, pause, resume, reset, accelerate, brake,
    addStop, removeStop, injectPerturbation, injectFailure, injectDeviation,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}