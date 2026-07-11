import React from 'react';
import { useSimulation, formatTime } from '@/lib/simulationContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

export default function ControlCharts() {
  const { chartData, recoveries } = useSimulation();

  return (
    <div className="space-y-3">
      <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Velocidad Real vs. Objetivo</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="time" tickFormatter={formatTime} stroke="#444" fontSize="9" />
            <YAxis stroke="#444" fontSize="9" />
            <Tooltip labelFormatter={formatTime} contentStyle={{ background: '#1A1A1A', border: '1px solid #333', fontSize: '11px' }} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Line type="monotone" dataKey="velocity" name="Vel. Real" stroke="#22C55E" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="targetVelocity" name="Vel. Objetivo" stroke="#3B82F6" strokeWidth={1.5} dot={false} isAnimationActive={false} strokeDasharray="4 2" />
            {recoveries.map((r, i) => (
              <ReferenceLine key={i} x={r.enterTime} stroke="#F97316" strokeDasharray="2 2" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Señal de Error (e = v_obj - v_real)</div>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="time" tickFormatter={formatTime} stroke="#444" fontSize="9" />
            <YAxis stroke="#444" fontSize="9" />
            <Tooltip labelFormatter={formatTime} contentStyle={{ background: '#1A1A1A', border: '1px solid #333', fontSize: '11px' }} />
            <Line type="monotone" dataKey="error" name="Error" stroke="#EF4444" strokeWidth={2} dot={false} isAnimationActive={false} />
            <ReferenceLine y={0} stroke="#444" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {recoveries.length > 0 && (
        <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Análisis de Recuperación de Desvíos</div>
          {recoveries.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-[#1A1A1A] last:border-0">
              <span className="text-orange-400 font-medium">Desvío #{i + 1}</span>
              <span className="text-gray-500 font-mono">{formatTime(r.enterTime)} → {formatTime(r.exitTime)}</span>
              <span className="text-green-400 font-mono font-bold">{r.recoveryTime.toFixed(0)}s</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}