import React, { useState } from 'react';
import { useSimulation } from '@/lib/simulationContext';
import { Play, Pause, RotateCcw, X, Plus, Trash2, Zap, Wrench, Users } from 'lucide-react';

export default function PanelControl() {
  const ctx = useSimulation() || {};

  const LINES = ctx.LINES || [];
  const status = ctx.status || 'idle';
  const line = ctx.line || null;
  const stops = ctx.stops || [];
  const timeScale = ctx.timeScale || 5;
  const kp = ctx.kp || 5000;
  const panelOpen = ctx.panelOpen || false;
  const setPanelOpen = ctx.setPanelOpen || (() => {});
  const selectLine = ctx.selectLine || (() => {});
  const start = ctx.start || (() => {});
  const pause = ctx.pause || (() => {});
  const resume = ctx.resume || (() => {});
  const reset = ctx.reset || (() => {});
  const setTimeScale = ctx.setTimeScale || (() => {});
  const setKp = ctx.setKp || (() => {});
  const addStops = ctx.addStops || (() => {});
  const removeStop = ctx.removeStop || (() => {});
  const injectPerturbation = ctx.injectPerturbation || (() => {});
  const injectFailure = ctx.injectFailure || (() => {});
  const injectPassengerSurge = ctx.injectPassengerSurge || (() => {});
  const fineExemptRemaining = ctx.fineExemptRemaining || 0;
  const fine = ctx.fine || 0;
  const currentStopIndex = ctx.currentStopIndex || 0;

  const [sCount, setSCount] = useState('');

  // Nuevos estados para la selección
  const [selectedSegment, setSelectedSegment] = useState(0);
  const [selectedSurgeStop, setSelectedSurgeStop] = useState(0);

  const isRunning = status === 'running';
  const isIdle = status === 'idle';
  const isFinished = status === 'finished';
  const canStart = isIdle && line && stops.length >= 3;

  return (
      <div className={`fixed right-0 top-0 bottom-0 w-80 bg-[#111] border-l border-[#2A2A2A] z-50 flex flex-col transition-transform duration-300 ${panelOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A] flex-shrink-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Panel de Control</h2>
          <button onClick={() => setPanelOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {(fine > 0 || fineExemptRemaining > 0) && (
              <div className="rounded-lg bg-red-950/30 border border-red-800/40 p-3 space-y-1">
                {fine > 0 && <div className="text-sm text-red-400 font-mono">Multa acumulada: <span className="font-bold">${fine}</span></div>}
                {fineExemptRemaining > 0 && <div className="text-xs text-yellow-400">Paradas exentas: {fineExemptRemaining}</div>}
              </div>
          )}

          <section>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Simulación</h3>
            <div className="flex gap-2">
              {isIdle ? (
                  <button onClick={start} disabled={!canStart} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-green-900/30 border border-green-700/50 text-green-400 text-xs hover:bg-green-900/50 disabled:opacity-30 transition-colors">
                    <Play className="w-3.5 h-3.5" /> Iniciar
                  </button>
              ) : isFinished ? (
                  <button onClick={reset} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-blue-900/30 border border-blue-700/50 text-blue-400 text-xs hover:bg-blue-900/50 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
                  </button>
              ) : isRunning ? (
                  <button onClick={pause} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-xs hover:bg-yellow-900/50 transition-colors">
                    <Pause className="w-3.5 h-3.5" /> Pausar
                  </button>
              ) : (
                  <button onClick={resume} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-green-900/30 border border-green-700/50 text-green-400 text-xs hover:bg-green-900/50 transition-colors">
                    <Play className="w-3.5 h-3.5" /> Reanudar
                  </button>
              )}
              <button onClick={reset} className="flex items-center justify-center px-3 py-2 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 text-xs hover:text-white transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-1 mt-2">
              {[1, 2, 5, 10, 20].map(sc => (
                  <button key={sc} onClick={() => setTimeScale(sc)} disabled={isIdle}
                          className={`flex-1 py-1.5 rounded text-xs font-mono transition-colors ${timeScale === sc ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50' : 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A] hover:border-[#444]'} disabled:opacity-40`}>
                    ×{sc}
                  </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Línea de Colectivo {isIdle ? '' : '(bloqueada)'}</h3>
            <div className="space-y-1">
              {LINES.map(l => (
                  <button key={l.id} onClick={() => selectLine(l)} disabled={!isIdle}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs border transition-colors ${line?.id === l.id ? 'bg-blue-900/20 border-blue-700/50 text-blue-400' : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-400'} ${isIdle ? 'hover:border-blue-700/50 hover:text-blue-400 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-[10px] text-gray-500">{l.distanceKm} km · {Math.round(l.timeMin || 0)} min · máx {l.maxVelocity} km/h</div>
                  </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Paradas {isIdle ? `(mín 3, actuales: ${stops.length})` : '(bloqueadas)'}</h3>
            {isIdle && (
                <div className="flex gap-2 mb-2">
                  <input type="number" min="1" value={sCount} onChange={e => setSCount(e.target.value)} placeholder="cant."
                         className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-blue-700 outline-none" />
                  <button onClick={() => { if (sCount) { addStops(parseInt(sCount)); setSCount(''); } }} disabled={!sCount}
                          className="px-2 py-1.5 rounded bg-blue-900/30 border border-blue-700/50 text-blue-400 text-xs hover:bg-blue-900/50 disabled:opacity-30 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
            )}
            <div className="space-y-1">
              {stops.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#1A1A1A] rounded px-2 py-1 text-xs">
                    <span className="text-gray-400">🚏 {i + 1}. km {Math.round((s || 0) * 10) / 10}</span>
                    {isIdle && stops.length > 3 && (
                        <button onClick={() => removeStop(s)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
              ))}
              {stops.length === 0 && <p className="text-[10px] text-gray-600">Seleccione una línea para generar paradas</p>}
            </div>
          </section>

          {isRunning && (
              <>
                <section className="p-3 bg-[#1A1A1A] rounded-md border border-[#2A2A2A]">
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Inyectar Perturbación Vial</h3>

                  <select
                      value={selectedSegment}
                      onChange={e => setSelectedSegment(Number(e.target.value))}
                      className="w-full bg-[#0A0A0A] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-300 mb-2 focus:outline-none focus:border-yellow-600"
                  >
                    <option value={0}>Tramo 1 (Inicio a Parada 1)</option>
                    {stops.map((_, i) => (
                        <option key={i+1} value={i+1} disabled={currentStopIndex > i+1}>
                          Tramo {i+2} (Parada {i+1} a {i+2 > stops.length ? 'Destino' : `Parada ${i+2}`})
                        </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => injectPerturbation('manifestacion', selectedSegment)} className="py-2 rounded bg-yellow-900/20 border border-yellow-700/40 text-yellow-400 text-[10px] hover:bg-yellow-900/40 transition-colors">Manifest.</button>
                    <button onClick={() => injectPerturbation('choque', selectedSegment)} className="py-2 rounded bg-orange-900/20 border border-orange-700/40 text-orange-400 text-[10px] hover:bg-orange-900/40 transition-colors">Choque</button>
                    <button onClick={() => injectPerturbation('corte', selectedSegment)} className="py-2 rounded bg-red-900/20 border border-red-700/40 text-red-400 text-[10px] hover:bg-red-900/40 transition-colors">Corte</button>
                  </div>
                </section>

                <section className="p-3 bg-[#1A1A1A] rounded-md border border-[#2A2A2A]">
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Sobrecarga de Pasajeros</h3>

                  <select
                      value={selectedSurgeStop}
                      onChange={e => setSelectedSurgeStop(Number(e.target.value))}
                      className="w-full bg-[#0A0A0A] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-300 mb-2 focus:outline-none focus:border-purple-600"
                  >
                    {stops.map((_, i) => (
                        <option key={i} value={i} disabled={currentStopIndex > i}>
                          Parada {i+1}
                        </option>
                    ))}
                  </select>

                  <button onClick={() => injectPassengerSurge(selectedSurgeStop)}
                          className="w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-purple-900/20 border border-purple-700/40 text-purple-400 text-xs hover:bg-purple-900/40 transition-colors">
                    <Users className="w-3 h-3" /> Reportar Multitud
                  </button>
                </section>

                <section>
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Fallas Técnicas</h3>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button onClick={() => injectFailure('engine_failure')} className="flex items-center justify-center gap-1.5 py-2 rounded bg-red-900/20 border border-red-700/40 text-red-400 text-xs hover:bg-red-900/40 transition-colors">
                      <Zap className="w-3.5 h-3.5" /> Falla en el Motor
                    </button>
                    <button onClick={() => injectFailure('technical_problems')} className="flex items-center justify-center gap-1.5 py-2 rounded bg-orange-900/20 border border-orange-700/40 text-orange-400 text-xs hover:bg-orange-900/40 transition-colors">
                      <Wrench className="w-3.5 h-3.5" /> Problemas Técnicos
                    </button>
                  </div>
                </section>
              </>
          )}

          <section>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Controlador: Ganancia (Kp)</h3>
            <input type="range" min="500" max="15000" step="500" value={kp} onChange={e => setKp(Number(e.target.value))} disabled={isIdle}
                   className="w-full disabled:opacity-40 accent-blue-500" />
            <div className="text-center font-mono text-sm text-white mt-1">Kp = {kp}</div>
            <p className="text-[10px] text-gray-500 mt-1 text-center">Magnitud de la fuerza de respuesta ante errores (Afecta F = m × a)</p>
          </section>
        </div>
      </div>
  );
}