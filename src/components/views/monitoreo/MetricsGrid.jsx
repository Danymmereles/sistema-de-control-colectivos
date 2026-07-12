import React from 'react';
import { useSimulation, formatTime } from '@/lib/simulationContext';
import { Gauge, Clock, Route, Timer, Wrench, TrendingUp, DollarSign, MapPin } from 'lucide-react';

export default function MetricsGrid() {
  const { velocity, position, totalDistance, simTime, line, events, fine, fineExemptRemaining,
    nextStopNumber, nextStopKm, plannedArrivalNext, estimatedArrivalNext, plannedArrivalTotal, estimatedArrivalTotal } = useSimulation();
  const avgVel = simTime > 0 ? (position / (simTime / 3600)) : 0;
  const hasFailure = events.some(e => e.active && (e.type === 'engine_failure' || e.type === 'technical_problems'));
  const nextDelay = estimatedArrivalNext != null ? estimatedArrivalNext - plannedArrivalNext : null;

  const metrics = [
    { icon: Gauge, label: 'Velocidad', value: velocity.toFixed(0), unit: 'km/h', color: 'text-green-400' },
    { icon: TrendingUp, label: 'Vel. Prom', value: avgVel.toFixed(0), unit: 'km/h', color: 'text-blue-400' },
    { icon: Clock, label: 'Transcurrido', value: formatTime(simTime), unit: '', color: 'text-white' },
    { icon: Route, label: 'Recorrido', value: position.toFixed(1), unit: `/${totalDistance.toFixed(1)}`, color: 'text-blue-400' },
    { icon: Timer, label: 'ETA Total', value: estimatedArrivalTotal != null ? formatTime(estimatedArrivalTotal) : '--:--', unit: '', color: 'text-yellow-400' },
    { icon: Wrench, label: 'Estado', value: hasFailure ? 'Con Falla' : 'Operativo', unit: '', color: hasFailure ? 'text-red-400' : 'text-green-400' },
    { icon: MapPin, label: `Próx Parada (P${nextStopNumber})`, value: estimatedArrivalNext != null ? formatTime(estimatedArrivalNext) : '--:--', unit: `plan: ${formatTime(plannedArrivalNext)}`, color: nextDelay == null ? 'text-gray-400' : nextDelay <= 30 ? 'text-green-400' : nextDelay <= 90 ? 'text-yellow-400' : 'text-red-400' },
    { icon: DollarSign, label: 'Multa', value: `$${fine}`, unit: fineExemptRemaining > 0 ? `${fineExemptRemaining} exenta(s)` : '', color: fine > 0 ? 'text-red-400' : 'text-gray-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <div key={i} className="bg-[#0A0A0A] border border-[#222] rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider truncate">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-base font-bold ${m.color} tabular-nums`}>{m.value}</span>
              {m.unit && <span className="text-[10px] text-gray-500">{m.unit}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}