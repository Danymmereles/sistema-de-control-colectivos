import React, { useMemo } from 'react';
import { useSimulation } from '@/lib/simulationContext';
import { buildPath, busPos } from '@/lib/routeUtils';

export default function RouteMap() {
  const { position, deviations, line, stops } = useSimulation();
  const W = 800, H = 280, P = 40;

  const { segs, cy } = useMemo(() => {
    if (!line) return { segs: [], cy: H / 2 };
    return buildPath(line.distanceKm, deviations, W, H, P);
  }, [line, deviations]);

  if (!line) {
    return (
      <div className="bg-[#0A0A0A] border border-[#222] rounded-lg h-full flex items-center justify-center">
        <p className="text-gray-600 text-sm">Seleccione una línea para ver el recorrido</p>
      </div>
    );
  }

  const bus = busPos(segs, position);
  const pts = segs.map(s => `${s.x1},${s.y1}`).join(' ') + (segs.length > 0 ? ` ${segs[segs.length - 1].x2},${segs[segs.length - 1].y2}` : '');
  const endX = segs.length > 0 ? segs[segs.length - 1].x2 : W - P;

  return (
    <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-2 h-full flex flex-col">
      <div className="text-[10px] text-gray-600 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
        <span>Recorrido — {line.name}</span>
        <span className="text-gray-500">{position.toFixed(1)} / {(line.distanceKm + deviations.reduce((s, d) => s + d.detourKm, 0)).toFixed(1)} km</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1" preserveAspectRatio="xMidYMid meet">
        <polyline points={pts} fill="none" stroke="#333" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pts} fill="none" stroke="#22C55E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 4" />
        {stops.map((s, i) => {
          const p = busPos(segs, Math.min(s, line.distanceKm));
          return <g key={i}><circle cx={p.x} cy={cy} r="5" fill="#3B82F6" stroke="#0A0A0A" strokeWidth="2" /><text x={p.x} y={cy - 12} fill="#3B82F6" fontSize="9" textAnchor="middle">P{i + 1}</text></g>;
        })}
        <circle cx={P} cy={cy} r="6" fill="#22C55E" />
        <text x={P} y={cy + 25} fill="#666" fontSize="10" textAnchor="middle">Inicio</text>
        <circle cx={endX} cy={cy} r="6" fill="#EF4444" />
        <text x={endX} y={cy + 25} fill="#666" fontSize="10" textAnchor="middle">Destino</text>
        <g transform={`translate(${bus.x - 12}, ${bus.y - 10})`}>
          <rect width="24" height="20" rx="3" fill="#F97316" stroke="#fff" strokeWidth="1" />
          <rect x="3" y="3" width="7" height="6" fill="#0D0D0D" rx="1" />
          <rect x="14" y="3" width="7" height="6" fill="#0D0D0D" rx="1" />
          <circle cx="7" cy="20" r="2.5" fill="#222" />
          <circle cx="17" cy="20" r="2.5" fill="#222" />
        </g>
      </svg>
    </div>
  );
}