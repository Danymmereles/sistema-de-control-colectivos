import React from 'react';
import { useSimulation } from '@/lib/simulationContext';
import { AlertTriangle } from 'lucide-react';

export default function PantallaAviso() {
  const { events } = useSimulation();
  const active = events.filter(e => e.active);

  return (
    <div className="rounded-lg bg-[#0A0A0A] border border-[#222] p-3 min-h-[140px] flex flex-col">
      <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Pantalla de Aviso</div>
      {active.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-gray-700 text-sm">— Sin novedades —</span>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto">
          {active.map(ev => (
            <div key={ev.id} className="flex items-center gap-2 bg-[#1A1A1A] rounded px-3 py-2 border-l-2 border-yellow-400 animate-[fadeIn_0.3s_ease]">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 animate-pulse" />
              <span className="text-sm font-mono text-yellow-400">{ev.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}