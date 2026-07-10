import React from 'react';
import { useSimulation, SITUATION_CONFIG, formatTime } from '@/lib/simulationContext';

export default function PantallaSituacion() {
  const { situation, redTimer, status, endReason } = useSimulation();

  if (status === 'idle') {
    return (
      <div className="rounded-lg bg-[#0A0A0A] border border-[#222] p-4 min-h-[140px] flex flex-col items-center justify-center">
        <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Pantalla de Situación</div>
        <p className="text-gray-500 text-sm">Esperando inicio de simulación</p>
      </div>
    );
  }

  if (status === 'finished') {
    const isSuccess = endReason?.includes('éxito') || endReason?.includes('Destino');
    return (
      <div className={`rounded-lg bg-[#0A0A0A] border p-4 min-h-[140px] flex flex-col items-center justify-center ${isSuccess ? 'border-green-900' : 'border-red-900'}`}>
        <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Pantalla de Situación</div>
        <h2 className={`text-xl font-bold ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>FIN DE LA SIMULACIÓN</h2>
        <p className="text-sm text-gray-400 mt-1 text-center">{endReason}</p>
      </div>
    );
  }

  const cfg = SITUATION_CONFIG[situation] || SITUATION_CONFIG.green;
  return (
    <div className="rounded-lg border p-4 min-h-[140px] flex flex-col items-center justify-center transition-colors duration-500"
      style={{ backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}50` }}>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Pantalla de Situación</div>
      <div className="w-3 h-3 rounded-full mb-2 animate-pulse" style={{ backgroundColor: cfg.color }} />
      <p className="text-base sm:text-lg font-semibold text-center px-2" style={{ color: cfg.color }}>{cfg.message}</p>
      {situation === 'red' && (
        <p className="text-xs text-gray-400 mt-1">Corte en {Math.max(0, 10 - redTimer).toFixed(0)}s</p>
      )}
    </div>
  );
}