import React, { useState } from 'react';
import { SimulationProvider, useSimulation, formatTime } from '@/lib/simulationContext';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import TopBar from '@/components/TopBar';
import ColectivoView from '@/components/views/ColectivoView';
import MonitoreoView from '@/components/views/MonitoreoView';
import TeoriaControlView from '@/components/views/TeoriaControlView';
import PanelControl from '@/components/PanelControl';

function SimulatorContent() {
  const [viewMode, setViewMode] = useState('tabs');
  const [activeView, setActiveView] = useState('colectivo');
  const { status, endReason, reset, panelOpen: panelOpenFromCtx, simTime, position, totalDistance, fine, plannedTime, originalDistance } = useSimulation();

  const views = {
    colectivo: <ColectivoView />,
    monitoreo: <MonitoreoView />,
    teoria: <TeoriaControlView />,
  };

  return (
    <div className="h-screen flex flex-col bg-[#0D0D0D] text-gray-100">
      <TopBar viewMode={viewMode} setViewMode={setViewMode} activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 overflow-hidden transition-[margin] duration-300" style={{ marginRight: panelOpenFromCtx ? 320 : 0 }}>
        {viewMode === 'tabs' ? (
          <div className="h-full">{views[activeView]}</div>
        ) : (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={33} minSize={20}>
              <ColectivoView />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#2A2A2A] hover:bg-[#444] transition-colors" />
            <Panel defaultSize={34} minSize={20}>
              <MonitoreoView />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#2A2A2A] hover:bg-[#444] transition-colors" />
            <Panel defaultSize={33} minSize={20}>
              <TeoriaControlView />
            </Panel>
          </PanelGroup>
        )}
      </div>
      <PanelControl />
      {status === 'finished' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-8 text-center max-w-md mx-4">
            <h1 className={`text-3xl font-bold mb-4 ${endReason?.includes('Destino') ? 'text-green-500' : 'text-red-500'}`}>FIN DE LA SIMULACIÓN</h1>
            <p className="text-gray-400 mb-4">{endReason}</p>
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="bg-[#0D0D0D] rounded-lg p-3 border border-[#222]">
                <div className="text-[10px] text-gray-500 uppercase">Multa Total</div>
                <div className="text-xl font-mono font-bold text-red-400">${fine}</div>
              </div>
              <div className="bg-[#0D0D0D] rounded-lg p-3 border border-[#222]">
                <div className="text-[10px] text-gray-500 uppercase">Tiempo Total</div>
                <div className="text-xl font-mono font-bold text-white">{formatTime(simTime)}</div>
                <div className="text-[10px] text-gray-500">Plan: {formatTime(plannedTime)}</div>
              </div>
              <div className="bg-[#0D0D0D] rounded-lg p-3 border border-[#222]">
                <div className="text-[10px] text-gray-500 uppercase">Distancia Total</div>
                <div className="text-xl font-mono font-bold text-white">{position.toFixed(2)} km</div>
                <div className="text-[10px] text-gray-500">Plan: {originalDistance.toFixed(2)} km</div>
              </div>
              <div className="bg-[#0D0D0D] rounded-lg p-3 border border-[#222]">
                <div className="text-[10px] text-gray-500 uppercase">Diferencia Tiempo</div>
                <div className={`text-xl font-mono font-bold ${simTime > plannedTime ? 'text-red-400' : 'text-green-400'}`}>
                  {simTime > plannedTime ? '+' : ''}{formatTime(Math.abs(simTime - plannedTime))}
                </div>
              </div>
            </div>
            <button onClick={reset} className="px-6 py-2.5 rounded-lg bg-green-900/30 border border-green-700/50 text-green-400 hover:bg-green-900/50 transition-colors font-medium">
              Reiniciar Simulación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Simulator() {
  return (
    <SimulationProvider>
      <SimulatorContent />
    </SimulationProvider>
  );
}