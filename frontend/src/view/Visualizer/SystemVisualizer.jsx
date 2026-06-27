import React from 'react'
import { useSystemStore } from '../../store/systemStore'
import { ControllerStatus } from './ControllerStatus'
import { RouteProgress } from './RouteProgress'
import { StatusCards } from './StatusCards'
import { LogPanel } from './LogPanel'

/**
 * VIEW — Visualizador del sistema.
 * Siempre activo y actualizado, independientemente de si el usuario
 * está editando el panel de control.
 * Lee el estado del store (actualizado por el WebSocket).
 */
export function SystemVisualizer({ routes }) {
  const { journeyState, lastSignal, logs } = useSystemStore()

  const activeRouteId = journeyState?.routeId
  const selectedRoute = activeRouteId && routes
    ? routes.find((r) => r.id === activeRouteId) ?? null
    : null

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Señal del controlador */}
      <ControllerStatus
        signal={lastSignal?.signal ?? journeyState?.controlSignal ?? null}
        delayMinutes={lastSignal?.delayMinutes ?? journeyState?.delayMinutes}
        status={journeyState?.status}
      />

      {/* Métricas en tiempo real */}
      <StatusCards state={journeyState} />

      {/* Barra de progreso del recorrido */}
      <RouteProgress state={journeyState} route={selectedRoute} />

      {/* Log de perturbaciones */}
      <div className="flex-1 min-h-0">
        <LogPanel logs={logs} />
      </div>
    </div>
  )
}
