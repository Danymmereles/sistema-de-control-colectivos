import React from 'react';
import { useSimulation, SITUATION_CONFIG } from '@/lib/simulationContext';
import SimTimeDisplay from './SimTimeDisplay';
import { Bus, Radio, LineChart, PanelRightClose, PanelRightOpen, Columns2, Square } from 'lucide-react';

export default function TopBar({ viewMode, setViewMode, activeView, setActiveView }) {
  const { situation, status, panelOpen, setPanelOpen } = useSimulation();
  const sit = SITUATION_CONFIG[situation] || SITUATION_CONFIG.green;

  const tabs = [
    { id: 'colectivo', label: 'Colectivo', icon: Bus },
    { id: 'monitoreo', label: 'Monitoreo', icon: Radio },
    { id: 'teoria', label: 'Teoría', icon: LineChart },
  ];

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#111] border-b border-[#2A2A2A] flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <Bus className="w-5 h-5 text-green-400" />
          <span className="font-semibold text-white text-sm hidden lg:inline">SimColectivo BA</span>
        </div>
        <div className="w-px h-6 bg-[#2A2A2A]" />
        {viewMode === 'tabs' && tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeView === tab.id ? 'bg-[#2A2A2A] text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
        <button onClick={() => setViewMode(viewMode === 'tabs' ? 'split' : 'tabs')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors ${
            viewMode === 'split' ? 'bg-[#2A2A2A] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1A1A1A]'}`}>
          {viewMode === 'tabs' ? <Columns2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {status !== 'idle' && status !== 'finished' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A]">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: sit.color }} />
            <span className="text-xs text-gray-300 hidden lg:inline max-w-[200px] truncate">{sit.message}</span>
          </div>
        )}
        <SimTimeDisplay />
        <button onClick={() => setPanelOpen(!panelOpen)}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-gray-300 hover:text-white hover:border-[#444] transition-colors">
          {panelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          <span className="hidden sm:inline">Panel</span>
        </button>
      </div>
    </div>
  );
}