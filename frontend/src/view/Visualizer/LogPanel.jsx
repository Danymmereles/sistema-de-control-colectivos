import React from 'react'

const LEVEL_STYLE = {
  INFO: 'text-gray-300',
  WARNING: 'text-yellow-400',
  ERROR: 'text-red-400'
}

const COMPONENT_STYLE = {
  CONTROLLER: 'bg-blue-900/50 text-blue-300',
  ACTUATOR: 'bg-orange-900/50 text-orange-300',
  PROCESS: 'bg-purple-900/50 text-purple-300',
  MEASUREMENT: 'bg-teal-900/50 text-teal-300',
  ENGINE: 'bg-gray-700 text-gray-300'
}

/**
 * VIEW — Panel de logs de perturbaciones y fallas.
 * Muestra el registro histórico de todos los eventos del sistema.
 */
export function LogPanel({ logs = [] }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Registro del sistema
        </h3>
        <span className="text-xs text-gray-500">{logs.length} entradas</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
        {logs.length === 0 && (
          <p className="text-gray-600 text-center py-4">Sin actividad registrada</p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className={`flex gap-2 px-2 py-1 rounded ${
              log.level === 'ERROR'
                ? 'bg-red-950/40'
                : log.level === 'WARNING'
                ? 'bg-yellow-950/40'
                : ''
            }`}
          >
            <span className="text-gray-600 shrink-0">
              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('es-AR') : '--:--:--'}
            </span>
            <span className={`shrink-0 px-1 rounded text-xs ${COMPONENT_STYLE[log.component] ?? 'text-gray-400'}`}>
              {log.component}
            </span>
            <span className={LEVEL_STYLE[log.level] ?? 'text-gray-300'}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
