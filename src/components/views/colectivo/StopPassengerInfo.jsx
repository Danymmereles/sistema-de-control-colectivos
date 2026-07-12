import React from 'react';
import { useSimulation } from '@/lib/simulationContext';
import { Users, Clock } from 'lucide-react';

export default function StopPassengerInfo() {
  const { isAtStop, stopPassengers, stopWaitRemaining, currentStopIndex } = useSimulation();

  if (!isAtStop) return null;

  return (
    <div className="rounded-lg bg-blue-950/30 border border-blue-800/50 p-3 flex items-center gap-3 animate-[fadeIn_0.3s_ease]">
      <Users className="w-5 h-5 text-blue-400 flex-shrink-0" />
      <div className="flex-1">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Parada {currentStopIndex + 1}</div>
        <div className="text-sm text-blue-400 font-semibold">Suben {stopPassengers} {stopPassengers === 1 ? 'persona' : 'personas'}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-gray-500" />
        <span className="font-mono text-sm text-gray-400">{stopWaitRemaining.toFixed(0)}s</span>
      </div>
    </div>
  );
}