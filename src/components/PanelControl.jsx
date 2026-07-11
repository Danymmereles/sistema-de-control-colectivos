import React, { useState } from 'react';
import { useSimulation } from '@/lib/simulationContext';
import { Play, Pause, RotateCcw, X, Plus, Trash2, Zap, Wrench, MapPin } from 'lucide-react';

export default function PanelControl() {
  const { LINES, status, line, timeScale, kv, panelOpen, setPanelOpen,
    start, pause, resume, reset, setTimeScale, setKv,
    addStop, removeStop, stops, injectPerturbation, injectFailure, injectDeviation } = useSimulation();
  const [pKm, setPKm] = useState('');
  const [dKm, setDKm] = useState('');
  const [sKm, setSKm] = useState('');

  const isRunning = status === 'running';
  const isIdle = status === 'idle';
  const isFinished = status === 'finished';

  return (
    <div className={`fixed right-0 top-0 bottom-0 w-80 bg-[#111] border-l border-[#2A2A2A] z-50 flex flex-col transition-transform duration-300 ${panelOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A] flex-shrink-0">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Panel de Control</h2>
        <button onClick={() => setPanelOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Simulación */}
        <section>
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Simulación</h3>
          <div className="flex gap-2">
            {isIdle ? (
              <button onClick={() => start(line || LINES[0])} disabled={!line} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-green-900/30 border border-green-700/50 text-green-400 text-xs hover:bg-green-900/50 disabled:opacity-30 transition-colors">
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
            {[1, 2, 5].map(sc => (
              <button key={sc} onClick={() => setTimeScale(sc)} disabled={isIdle}
                className={`flex-1 py-1.5 rounded text-xs font-mono transition-colors ${timeScale === sc ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50' : 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A] hover:border-[#444]'} disabled:opacity-40`}>
                ×{sc}
              </button>
            ))}
          </div>
        </section>

        {/* Línea */}
        <section>
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Línea de Colectivo</h3>
          <div className="space-y-1">
            {LINES.map(l => (
              <button key={l.id} onClick={() => isIdle && start(l)} disabled={!isIdle}
                className={`w-full text-left px-3 py-2 rounded-md text-xs border transition-colors ${line?.id === l.id && !isIdle ? 'bg-blue-900/20 border-blue-700/50 text-blue-400' : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-400'} ${isIdle ? 'hover:border-blue-700/50 hover:text-blue-400 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                <div className="font-medium">{l.name}</div>
                <div className="text-[10px] text-gray-500">{l.distanceKm} km · {l.timeMin} min · máx {l.maxVelocity} km/h</div>
              </button>
            ))}
          </div>
        </section>

        {/* Paradas */}
        <section>
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Paradas</h3>
          <div className="flex gap-2">
            <input type="number" step="0.5" value={sKm} onChange={e => setSKm(e.target.value)} placeholder="km" disabled={!isRunning}
              className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-blue-700 outline-none disabled:opacity-40" />
            <button onClick={() => { if (sKm) { addStop(parseFloat(sKm)); setSKm(''); } }} disabled={!isRunning || !sKm}
              className="px-2 py-1.5 rounded bg-blue-900/30 border border-blue-700/50 text-blue-400 text-xs hover:bg-blue-900/50 disabled:opacity-30 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1 mt-2">
            {stops.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-[#1A1A1A] rounded px-2 py-1 text-xs">
                <span className="text-gray-400">🚏 km {s}</span>
                <button onClick={() => removeStop(s)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </section>

        {/* Perturbaciones */}
        <section>
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Perturbaciones</h3>
          <input type="number" step="0.5" value={pKm} onChange={e => setPKm(e.target.value)} placeholder="Altura del recorrido (km)" disabled={!isRunning}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-yellow-700 outline-none disabled:opacity-40 mb-2" />
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => { if (pKm) { injectPerturbation('manifestacion', parseFloat(pKm)); setPKm(''); } }} disabled={!isRunning || !pKm}
              className="py-2 rounded bg-yellow-900/20 border border-yellow-700/40 text-yellow-400 text-[10px] hover:bg-yellow-900/40 disabled:opacity-30 transition-colors">Manifest.</button>
            <button onClick={() => { if (pKm) { injectPerturbation('choque', parseFloat(pKm)); setPKm(''); } }} disabled={!isRunning || !pKm}
              className="py-2 rounded bg-orange-900/20 border border-orange-700/40 text-orange-400 text-[10px] hover:bg-orange-900/40 disabled:opacity-30 transition-colors">Choque</button>
            <button onClick={() => { if (pKm) { injectPerturbation('corte', parseFloat(pKm)); setPKm(''); } }} disabled={!isRunning || !pKm}
              className="py-2 rounded bg-red-900/20 border border-red-700/40 text-red-400 text-[10px] hover:bg-red-900/40 disabled:opacity-30 transition-colors">Corte</button>
          </div>
          <div className="flex gap-2 mt-2">
            <input type="number" step="0.5" value={dKm} onChange={e => setDKm(e.target.value)} placeholder="km del desvío" disabled={!isRunning}
              className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-purple-700 outline-none disabled:opacity-40" />
            <button onClick={() => { if (dKm) { injectDeviation(parseFloat(dKm)); setDKm(''); } }} disabled={!isRunning || !dKm}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-purple-900/20 border border-purple-700/40 text-purple-400 text-xs hover:bg-purple-900/40 disabled:opacity-30 transition-colors">
              <MapPin className="w-3 h-3" /> Desvío
            </button>
          </div>
        </section>

        {/* Fallas */}
        <section>
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Fallas Técnicas</h3>
          <div className="grid grid-cols-1 gap-1.5">
            <button onClick={() => injectFailure('engine_failure')} disabled={!isRunning}
              className="flex items-center justify-center gap-1.5 py-2 rounded bg-red-900/20 border border-red-700/40 text-red-400 text-xs hover:bg-red-900/40 disabled:opacity-30 transition-colors">
              <Zap className="w-3.5 h-3.5" /> Falla en el Motor
            </button>
            <button onClick={() => injectFailure('technical_problems')} disabled={!isRunning}
              className="flex items-center justify-center gap-1.5 py-2 rounded bg-orange-900/20 border border-orange-700/40 text-orange-400 text-xs hover:bg-orange-900/40 disabled:opacity-30 transition-colors">
              <Wrench className="w-3.5 h-3.5" /> Problemas Técnicos
            </button>
          </div>
        </section>

        {/* Teoría de Control */}
        <section>
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Teoría de Control — KV</h3>
          <input type="range" min="0.1" max="2" step="0.1" value={kv} onChange={e => setKv(parseFloat(e.target.value))} disabled={!isRunning}
            className="w-full disabled:opacity-40 accent-blue-500" />
          <div className="text-center font-mono text-sm text-white mt-1">KV = {kv.toFixed(1)}</div>
          <p className="text-[10px] text-gray-500 mt-1 text-center">Ganancia del controlador de velocidad</p>
        </section>
      </div>
    </div>
  );
}