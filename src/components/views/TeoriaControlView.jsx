import React from 'react';
import ControlCharts from './teoria/ControlCharts';
import TheoryPanel from './teoria/TheoryPanel';
import EventLog from '@/components/EventLog';
import { LineChart as LineChartIcon } from 'lucide-react';

export default function TeoriaControlView() {
  return (
    <div className="h-full flex flex-col bg-[#0D0D0D] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2A2A2A] flex-shrink-0">
        <LineChartIcon className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Teoría de Control</h2>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 min-w-0">
          <ControlCharts />
        </div>
        <div className="w-72 border-l border-[#2A2A2A] flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-2 flex-shrink-0"><TheoryPanel /></div>
          <div className="flex-1 min-h-0"><EventLog /></div>
        </div>
      </div>
    </div>
  );
}