import React from 'react'
import { RouteSelector } from './RouteSelector'
import { LoadingOptions } from './LoadingOptions'
import { ErrorBandConfig } from './ErrorBandConfig'
import { EventLoader } from './EventLoader'
import { useSystemStore } from '../../store/systemStore'

/**
 * VIEW — Panel de Control.
 * Contenedor principal del panel. Mantiene un estado DRAFT:
 * - Los cambios NO se aplican al sistema hasta pulsar "Aceptar".
 * - "Cancelar" revierte al último estado activo.
 * El visualizador sigue corriendo independientemente de lo que el usuario edite aquí.
 */
export function ControlPanel({ routes, onStart, onStop, onApply, loading, error }) {
  const { draftConfig, activeConfig, resetDraft, journeyState, connected } = useSystemStore()

  const isRunning = journeyState?.status === 'RUNNING'
  const isDirty = JSON.stringify(draftConfig) !== JSON.stringify(activeConfig)

  // Paradas de la ruta seleccionada para el selector de eventos
  const selectedRoute = routes.find((r) => r.id === draftConfig.routeId)
  const routeStops = selectedRoute?.stops ?? []

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Panel de Control</h2>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">{connected ? 'Conectado' : 'Desconectado'}</span>
        </div>
      </div>

      {/* Campos editables */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <RouteSelector routes={routes} />
        <Divider />
        <LoadingOptions />
        <Divider />
        <ErrorBandConfig />
        <Divider />
        <EventLoader routeStops={routeStops} />

        {/* Indicador de cambios pendientes */}
        {isDirty && (
          <div className="bg-yellow-900/40 border border-yellow-700 rounded px-3 py-2 text-xs text-yellow-300">
            Hay cambios sin aplicar. Pulsá "Aceptar" para aplicarlos al sistema.
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Footer: acciones */}
      <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 space-y-2">
        {/* Aceptar / Cancelar cambios del panel */}
        <div className="flex gap-2">
          <button
            onClick={onApply}
            disabled={!isDirty || loading}
            className="flex-1 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
          >
            {loading ? 'Aplicando…' : 'Aceptar cambios'}
          </button>
          <button
            onClick={resetDraft}
            disabled={!isDirty}
            className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Iniciar / Detener viaje */}
        {!isRunning ? (
          <button
            onClick={onStart}
            disabled={loading || !draftConfig.routeId}
            className="w-full py-2 text-sm font-bold bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
          >
            {loading ? 'Iniciando…' : '▶ Iniciar recorrido'}
          </button>
        ) : (
          <button
            onClick={onStop}
            disabled={loading}
            className="w-full py-2 text-sm font-bold bg-red-700 hover:bg-red-600 disabled:opacity-40 rounded transition-colors"
          >
            ■ Detener recorrido
          </button>
        )}
      </div>
    </div>
  )
}

function Divider() {
  return <hr className="border-gray-700" />
}
