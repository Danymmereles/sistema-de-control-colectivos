import React from 'react';
import { useSimulation } from '@/lib/simulationContext';
import { Gauge, Route, Activity } from 'lucide-react';

export default function SpeedDisplay() {
  const { velocity, acceleration, position, totalDistance } = useSimulation();
  const progress = totalDistance > 0 ? Math.min(100, (position / totalDistance) * 100) : 0;
  const accelColor = acceleration > 0.1 ? '#22C55E' : acceleration < -0.1 ? '#EF4444' : '#666';

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-lg bg-[#0A0A0A] border border-[#222] p-2.5 flex flex-col items-center justify-center">
        <Gauge className="w-4 h-4 text-green-400 mb-0.5" />
        <div className="text-[9px] text-gray-600 uppercase tracking-wider">Velocidad</div>
        <div className="text-2xl font-mono font-bold text-green-400 tabular-nums leading-tight">{velocity.toFixed(0)}</div>
        <div className="text-[10px] text-gray-500">km/h</div>
      </div>
      <div className="rounded-lg bg-[#0A0A0A] border border-[#222] p-2.5 flex flex-col items-center justify-center">
        <Activity className="w-4 h-4 mb-0.5" style={{ color: accelColor }} />
        <div className="text-[9px] text-gray-600 uppercase tracking-wider">Aceleración</div>
        <div className="text-2xl font-mono font-bold tabular-nums leading-tight" style={{ color: accelColor }}>
          {acceleration > 0.1 ? '+' : ''}{acceleration.toFixed(1)}
        </div>
        <div className="text-[10px] text-gray-500">m/s²</div>
      </div>
      <div className="rounded-lg bg-[#0A0A0A] border border-[#222] p-2.5 flex flex-col justify-center">
        <div className="flex items-center gap-1 mb-0.5">
          <Route className="w-3.5 h-3.5 text-blue-400" />
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">Distancia</div>
        </div>
        <div className="font-mono text-sm text-white leading-tight">{position.toFixed(1)}/{totalDistance.toFixed(1)}</div>
        <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full mt-1 overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">{progress.toFixed(0)}%</div>
      </div>
    </div>
  );
}