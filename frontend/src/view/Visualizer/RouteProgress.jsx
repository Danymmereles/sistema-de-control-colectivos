import React from 'react'

/**
 * VIEW — Barra de progreso del recorrido con paradas.
 * Muestra la posición actual (real) y la esperada sobre el recorrido.
 */
export function RouteProgress({ state, route }) {
  if (!route) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-xs text-gray-500 text-center">Seleccioná una ruta para ver el recorrido</p>
      </div>
    )
  }

  const totalKm = route.totalDistanceKm || 1
  const realPct = Math.min(100, ((state?.currentPositionKm ?? 0) / totalKm) * 100)
  const expectedPct = Math.min(100, ((state?.expectedPositionKm ?? 0) / totalKm) * 100)

  // Calcular posiciones acumuladas de las paradas
  let cumKm = 0
  const stopPositions = route.stops.map((s) => {
    cumKm += s.distanceFromPreviousKm
    return { ...s, cumKm }
  })

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progreso del recorrido</h3>

      {/* Barra principal */}
      <div className="relative">
        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
          {/* Posición esperada */}
          <div
            className="absolute h-full bg-gray-500 rounded-full transition-all duration-500"
            style={{ width: `${expectedPct}%` }}
          />
          {/* Posición real */}
          <div
            className="absolute h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${realPct}%` }}
          />
        </div>

        {/* Marcadores de paradas */}
        {stopPositions.map((s) => {
          const pct = (s.cumKm / totalKm) * 100
          return (
            <div
              key={s.name}
              className="absolute top-0 h-4 flex flex-col items-center"
              style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-0.5 h-4 bg-gray-400" />
            </div>
          )
        })}
      </div>

      {/* Nombres de paradas */}
      <div className="relative h-8">
        {stopPositions.map((s) => {
          const pct = (s.cumKm / totalKm) * 100
          const isPassed = (state?.currentPositionKm ?? 0) >= s.cumKm
          return (
            <div
              key={s.name}
              className="absolute flex flex-col items-center"
              style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
            >
              <div className={`w-2 h-2 rounded-full mb-0.5 ${isPassed ? 'bg-blue-400' : 'bg-gray-500'}`} />
              <span className={`text-xs whitespace-nowrap ${isPassed ? 'text-blue-300' : 'text-gray-500'}`}>
                {s.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 text-xs text-gray-400 pt-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-1.5 bg-blue-500 rounded" /> Real ({realPct.toFixed(1)}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-1.5 bg-gray-500 rounded" /> Esperado ({expectedPct.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}
