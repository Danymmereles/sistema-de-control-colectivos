import React from 'react';
import { useSimulation, formatTime } from '@/lib/simulationContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

export default function ControlCharts() {
  const { chartData, nextStopNumber, plannedArrivalTotal, nextStopKm } = useSimulation();

  return (
    <div className="space-y-3">
      <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">Próxima parada: <span className="text-orange-400 font-bold">P{nextStopNumber}</span> (km {nextStopKm?.toFixed(1) || '—'})</span>
        <span className="text-xs text-gray-500">Planificado total: <span className="text-blue-400 font-mono">{formatTime(plannedArrivalTotal)}</span></span>
      </div>

      {/* Distance graph: actual vs planned */}
      <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Distancia Recorrida vs Planificada</div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="time" tickFormatter={formatTime} stroke="#444" fontSize="9" />
            <YAxis stroke="#444" fontSize="9" unit=" km" />
            <Tooltip labelFormatter={formatTime} contentStyle={{ background: '#1A1A1A', border: '1px solid #333', fontSize: '11px' }} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Line type="monotone" dataKey="position" name="Dist. Actual" stroke="#22C55E" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="plannedPosition" name="Dist. Planificada" stroke="#3B82F6" strokeWidth={1.5} dot={false} isAnimationActive={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distance error */}
      <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Error de Distancia |planificada - actual|</div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="time" tickFormatter={formatTime} stroke="#444" fontSize="9" />
            <YAxis stroke="#444" fontSize="9" unit=" km" />
            <Tooltip labelFormatter={formatTime} contentStyle={{ background: '#1A1A1A', border: '1px solid #333', fontSize: '11px' }} />
            <Line type="monotone" dataKey="positionError" name="Error" stroke="#EF4444" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time graph: estimated vs planned arrival */}
      <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Tiempo Estimado de Llegada vs Planificado</div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="time" tickFormatter={formatTime} stroke="#444" fontSize="9" />
            <YAxis stroke="#444" fontSize="9" tickFormatter={formatTime} />
            <Tooltip labelFormatter={formatTime} contentStyle={{ background: '#1A1A1A', border: '1px solid #333', fontSize: '11px' }} formatter={(v) => formatTime(v)} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Line type="monotone" dataKey="estimatedArrival" name="ETA" stroke="#F97316" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
            <ReferenceLine y={plannedArrivalTotal} stroke="#3B82F6" strokeDasharray="4 2" label={{ value: 'Plan', fill: '#3B82F6', fontSize: 9 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time error */}
      <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Error de Tiempo |estimado - planificado|</div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="time" tickFormatter={formatTime} stroke="#444" fontSize="9" />
            <YAxis stroke="#444" fontSize="9" tickFormatter={(v) => formatTime(v)} />
            <Tooltip labelFormatter={formatTime} contentStyle={{ background: '#1A1A1A', border: '1px solid #333', fontSize: '11px' }} formatter={(v) => formatTime(v)} />
            <Line type="monotone" dataKey="timeError" name="Error" stroke="#EF4444" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}