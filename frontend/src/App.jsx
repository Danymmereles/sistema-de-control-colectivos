import React from 'react'
import { useWebSocket } from './presenter/useWebSocket'
import { useSystemState } from './presenter/useSystemState'
import { ControlPanel } from './view/ControlPanel/ControlPanel'
import { SystemVisualizer } from './view/Visualizer/SystemVisualizer'

/**
 * Raíz de la aplicación.
 * - useWebSocket: establece la conexión y distribuye eventos al store.
 * - useSystemState: carga rutas iniciales y expone handlers de acciones.
 * Layout: ControlPanel a la izquierda | Visualizador a la derecha.
 */
export default function App() {
  useWebSocket()

  const { routes, loading, error, handleStart, handleStop, handleApplyConfig } = useSystemState()

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <h1 className="text-base font-bold text-white tracking-wide">
          Sistema de Control — Colectivos Argentinos
        </h1>
        <span className="text-xs text-gray-500 ml-2">TdC • Mereles y Soto</span>
      </header>

      {/* Layout principal */}
      <div className="flex flex-1 min-h-0 gap-0">
        {/* Panel de Control — izquierda */}
        <div className="w-80 flex-shrink-0 border-r border-gray-700 p-4">
          <ControlPanel
            routes={routes}
            onStart={handleStart}
            onStop={handleStop}
            onApply={handleApplyConfig}
            loading={loading}
            error={error}
          />
        </div>

        {/* Visualizador — derecha */}
        <div className="flex-1 p-4 overflow-y-auto">
          <SystemVisualizer routes={routes} />
        </div>
      </div>
    </div>
  )
}
