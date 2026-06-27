import React from 'react'

const SIGNAL_CONFIG = {
  OK: {
    label: 'SISTEMA OK',
    sub: 'Dentro de banda aceptable',
    bg: 'bg-green-900/40',
    border: 'border-green-600',
    text: 'text-green-400',
    dot: 'bg-green-400 animate-pulse'
  },
  DELAYED: {
    label: 'FUERA DE BANDA',
    sub: 'Actuador activo — ajustando velocidad',
    bg: 'bg-yellow-900/40',
    border: 'border-yellow-600',
    text: 'text-yellow-400',
    dot: 'bg-yellow-400 animate-pulse'
  },
  CRITICAL: {
    label: 'ESTADO CRÍTICO',
    sub: 'Demora irrecuperable — viaje terminado',
    bg: 'bg-red-900/40',
    border: 'border-red-600',
    text: 'text-red-400',
    dot: 'bg-red-500'
  },
  null: {
    label: 'EN ESPERA',
    sub: 'Iniciá el recorrido desde el panel de control',
    bg: 'bg-gray-800/40',
    border: 'border-gray-600',
    text: 'text-gray-400',
    dot: 'bg-gray-500'
  }
}

/**
 * VIEW — Indicador de señal del controlador.
 * Muestra el estado actual (OK / FUERA DE BANDA / CRÍTICO) con color e indicador visual.
 */
export function ControllerStatus({ signal, delayMinutes, status }) {
  const key = signal ?? 'null'
  const cfg = SIGNAL_CONFIG[key] ?? SIGNAL_CONFIG['null']

  return (
    <div className={`rounded-lg border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <div>
          <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
          <p className="text-xs text-gray-400">{cfg.sub}</p>
        </div>
        {status && (
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">Estado del viaje</p>
            <p className="text-sm font-mono text-gray-300">{status}</p>
          </div>
        )}
      </div>
    </div>
  )
}
