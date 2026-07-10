import React from 'react';
import { useSimulation, formatTime } from '@/lib/simulationContext';
import { Clock } from 'lucide-react';

export default function SimTimeDisplay() {
  const { simTime, status, timeScale } = useSimulation();
  const isRunning = status === 'running';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A]">
      <Clock className={`w-4 h-4 ${isRunning ? 'text-green-400 animate-pulse' : 'text-gray-500'}`} />
      <span className="text-[10px] text-gray-500 uppercase tracking-wider hidden sm:inline">Tiempo Sim</span>
      <span className="font-mono text-lg text-white tabular-nums">{formatTime(simTime)}</span>
      {timeScale > 1 && <span className="text-[10px] text-blue-400 font-mono">×{timeScale}</span>}
    </div>
  );
}