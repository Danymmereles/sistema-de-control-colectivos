import React from 'react';
import RouteMap from './monitoreo/RouteMap';
import MetricsGrid from './monitoreo/MetricsGrid';
import EventLog from '@/components/EventLog';
import { Radio } from 'lucide-react';

export default function MonitoreoView() {
  return (
    <div className="h-full flex flex-col bg-[#0D0D0D] p-3 gap-3 overflow-hidden">
      <div className="flex items-center gap-2 px-1 flex-shrink-0">
        <Radio className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Centro de Monitoreo</h2>
      </div>
      <div className="flex-1 min-h-[140px]">
        <RouteMap />
      </div>
      <MetricsGrid />
      <div className="flex-1 min-h-[100px] border border-[#222] rounded-lg overflow-hidden">
        <EventLog />
      </div>
    </div>
  );
}