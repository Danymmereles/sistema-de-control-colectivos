import React from 'react';
import { useSimulation, formatTime } from '@/lib/simulationContext';
import { Gauge, Clock, Route, Timer, Wrench, TrendingUp } from 'lucide-react';

export default function MetricsGrid() {
  const { velocity, position, totalDistance, simTime, line, events } = useSimulation();
  const remaining = Math.max(0, totalDistance - position);
  const eta = velocity > 1 ? (remaining / velocity) * 3600 : 0;
  const avgVel = simTime > 0 ? (position / (simTime / 3600)) : 0;
  const hasFailure = events.some(e => e.active && (e.type === 'engine_failure' || e.type === 'technical_problems'));

  const metrics = [
    { icon: Gauge, label: 'Velocidad', value: velocity.toFixed(0), unit: 'km/h', color: 'text-green-400' },
    { icon: TrendingUp, label: 'Vel. Prom', value: avgVel.toFixed(0), unit: 'km/h', color: 'text-blue-400' },
    { icon: Clock, label: 'Transcurrido', value: formatTime(simTime), unit: '', color: 'text-white' },
    { icon: Route, label: 'Recorrido', value: position.toFixed(1), unit: `/${totalDistance.toFixed(1)} km`, color: 'text-blue-400' },
    { icon: Timer, label: 'ETA', value: eta > 0 ? formatTime(eta) : '—', unit: '', color: 'text-yellow-400' },
    { icon: Wrench, label: 'Estado', value: hasFailure ? 'Con Falla' : 'Operativo', unit: '', color: hasFailure ? 'text-red-400' : 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <div key={i} className="bg-[#0A0A0A] border border-[#222] rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider truncate">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-lg font-bold ${m.color} tabular-nums`}>{m.value}</span>
              {m.unit && <span className="text-[10px] text-gray-500">{m.unit}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}