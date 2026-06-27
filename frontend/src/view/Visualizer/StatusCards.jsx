import React from 'react'

/**
 * VIEW — Tarjetas de estado en tiempo real.
 * Muestra velocidad actual, posición, tiempo simulado y demora acumulada.
 */
export function StatusCards({ state }) {
  if (!state) return null

  const cards = [
    {
      label: 'Velocidad actual',
      value: `${state.currentVelocityKmh?.toFixed(1) ?? '0.0'} km/h`,
      color: 'text-blue-300'
    },
    {
      label: 'Posición actual',
      value: `${state.currentPositionKm?.toFixed(2) ?? '0.00'} km`,
      color: 'text-blue-300'
    },
    {
      label: 'Posición esperada',
      value: `${state.expectedPositionKm?.toFixed(2) ?? '0.00'} km`,
      color: 'text-gray-300'
    },
    {
      label: 'Tiempo simulado',
      value: formatMinutes(state.elapsedSimulatedMinutes),
      color: 'text-purple-300'
    },
    {
      label: 'Demora acumulada',
      value: formatDelay(state.delayMinutes),
      color: getDelayColor(state.delayMinutes)
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">{c.label}</p>
          <p className={`text-lg font-bold font-mono ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}

function formatMinutes(min) {
  if (min == null) return '00:00'
  const h = Math.floor(min / 60)
  const m = Math.floor(min % 60)
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`
}

function formatDelay(min) {
  if (min == null) return '0 min'
  const sign = min > 0 ? '+' : ''
  return `${sign}${min.toFixed(1)} min`
}

function getDelayColor(min) {
  if (min == null) return 'text-gray-300'
  if (Math.abs(min) < 3) return 'text-green-400'
  if (Math.abs(min) < 10) return 'text-yellow-400'
  return 'text-red-400'
}
