import React from 'react';
import { useSimulation } from '@/lib/simulationContext';
import { MapPin } from 'lucide-react';

export default function RouteMap() {
  const { position, line, stops, totalDistance, currentStopIndex, fineExemptRemaining } = useSimulation();
  const W = 800, H = 220, P = 40;
  const cy = H / 2;
  const usableW = W - 2 * P;
  const kmToX = (km) => totalDistance > 0 ? P + (km / totalDistance) * usableW : P;
  const busX = kmToX(Math.min(position, totalDistance));
  const endX = P + usableW;

  if (!line) {
    return (
      <div className="bg-[#0A0A0A] border border-[#222] rounded-lg h-full flex items-center justify-center">
        <p className="text-gray-600 text-sm">Seleccione una línea para ver el recorrido</p>
      </div>
    );
  }

  const allStops = [...stops, totalDistance];

  return (
    <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-2 h-full flex flex-col">
      <div className="text-[10px] text-gray-600 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
        <span>Recorrido — {line.name}</span>
        <span className="text-gray-500">{position.toFixed(2)} / {totalDistance.toFixed(2)} km</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1" preserveAspectRatio="xMidYMid meet">
        <line x1={P} y1={cy} x2={endX} y2={cy} stroke="#333" strokeWidth="8" strokeLinecap="round" />
        <line x1={P} y1={cy} x2={endX} y2={cy} stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" />
        {allStops.map((sKm, i) => {
          const x = kmToX(sKm);
          const isNext = i === currentStopIndex;
          const isExempt = i >= currentStopIndex && i < currentStopIndex + fineExemptRemaining;
          const isDest = i === allStops.length - 1;
          const color = isDest ? '#EF4444' : isExempt ? '#A855F7' : '#3B82F6';
          return (
            <g key={i}>
              <circle cx={x} cy={cy} r={isNext ? 6 : 5} fill={color} stroke="#0A0A0A" strokeWidth="2" className={isNext ? 'animate-pulse' : ''} />
              <text x={x} y={cy - 14} fill={color} fontSize="10" textAnchor="middle" fontWeight={isNext ? 'bold' : 'normal'}>
                {isDest ? '🏠' : `P${i + 1}`}
              </text>
              {isExempt && <text x={x} y={cy + 22} fill="#A855F7" fontSize="8" textAnchor="middle">exenta</text>}
            </g>
          );
        })}
        <circle cx={P} cy={cy} r="6" fill="#22C55E" />
        <text x={P} y={cy + 25} fill="#666" fontSize="10" textAnchor="middle">Inicio</text>
        <circle cx={endX} cy={cy} r="6" fill="#EF4444" />
        <text x={endX} y={cy + 25} fill="#666" fontSize="10" textAnchor="middle">Destino</text>
        <g transform={`translate(${busX - 12}, ${cy - 10})`}>
          <rect width="24" height="20" rx="3" fill="#F97316" stroke="#fff" strokeWidth="1" />
          <rect x="3" y="3" width="7" height="6" fill="#0D0D0D" rx="1" />
          <rect x="14" y="3" width="7" height="6" fill="#0D0D0D" rx="1" />
          <circle cx="7" cy="20" r="2.5" fill="#222" />
          <circle cx="17" cy="20" r="2.5" fill="#222" />
        </g>
        {currentStopIndex < allStops.length && (
          <text x={W / 2} y={20} fill="#888" fontSize="11" textAnchor="middle">
            Próxima parada: P{currentStopIndex + 1} (km {allStops[currentStopIndex]?.toFixed(1)})
          </text>
        )}
      </svg>
    </div>
  );
}