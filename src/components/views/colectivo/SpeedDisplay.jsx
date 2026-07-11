import React from 'react';
import { useSimulation } from '@/lib/simulationContext';
import { Gauge, Route } from 'lucide-react';

export default function SpeedDisplay() {
  const { velocity, position, totalDistance, line } = useSimulation();
  const progress = totalDistance > 0 ? Math.min(100, (position / totalDistance) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg bg-[#0A0A0A] border border-[#222] p-3 flex flex-col items-center justify-center">
        <Gauge className="w-4 h-4 text-green-400 mb-1" />
        <div className="text-[10px] text-gray-600 uppercase tracking-wider">Velocidad</div>
        <div className="text-4xl font-mono font-bold text-green-400 tabular-nums leading-tight">{velocity.toFixed(0)}</div>
        <div className="text-xs text-gray-500">km/h</div>
      </div>
      <div className="rounded-lg bg-[#0A0A0A] border border-[#222] p-3 flex flex-col">
        <div className="flex items-center gap-1 mb-1">
          <Route className="w-4 h-4 text-blue-400" />
          <div className="text-[10px] text-gray-600 uppercase tracking-wider">Distancia</div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="font-mono text-lg text-white">{position.toFixed(1)} / {totalDistance.toFixed(1)} km</div>
          <div className="w-full h-2 bg-[#1A1A1A] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}% completado</div>
        </div>
      </div>
    </div>
  );
}