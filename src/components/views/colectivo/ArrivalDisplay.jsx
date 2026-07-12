import React from 'react';
import { useSimulation, formatTime } from '@/lib/simulationContext';
import { CalendarClock, Timer } from 'lucide-react';

export default function ArrivalDisplay() {
  const { status, plannedArrivalTotal, estimatedArrivalTotal, plannedTime, originalDistance, totalDistance } = useSimulation();

  if (status === 'idle') return null;

  const delay = estimatedArrivalTotal != null ? estimatedArrivalTotal - plannedArrivalTotal : null;
  const delayColor = delay == null ? '#666' : delay <= 30 ? '#22C55E' : delay <= 90 ? '#EAB308' : delay <= 180 ? '#F97316' : '#EF4444';

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-lg bg-[#0A0A0A] border border-[#222] p-2.5">
        <div className="flex items-center gap-1 mb-1">
          <CalendarClock className="w-3.5 h-3.5 text-blue-400" />
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">Planificado</div>
        </div>
        <div className="font-mono text-lg text-blue-400 font-bold">{formatTime(plannedArrivalTotal)}</div>
        <div className="text-[10px] text-gray-500">{originalDistance.toFixed(1)} km planificados</div>
      </div>
      <div className="rounded-lg bg-[#0A0A0A] border border-[#222] p-2.5">
        <div className="flex items-center gap-1 mb-1">
          <Timer className="w-3.5 h-3.5" style={{ color: delayColor }} />
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">Estimado</div>
        </div>
        <div className="font-mono text-lg font-bold" style={{ color: delayColor }}>
          {estimatedArrivalTotal != null ? formatTime(estimatedArrivalTotal) : '--:--'}
        </div>
        <div className="text-[10px] text-gray-500">{totalDistance.toFixed(1)} km total</div>
      </div>
    </div>
  );
}