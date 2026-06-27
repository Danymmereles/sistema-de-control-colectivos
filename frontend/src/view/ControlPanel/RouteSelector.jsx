import React from 'react'
import { useSystemStore } from '../../store/systemStore'

/** VIEW — Selector de ruta. Emite cambio al draft sin afectar el sistema. */
export function RouteSelector({ routes }) {
  const { draftConfig, updateDraftField } = useSystemStore()

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">Recorrido</label>
      <select
        value={draftConfig.routeId}
        onChange={(e) => updateDraftField('routeId', e.target.value)}
        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      >
        <option value="">— Seleccionar recorrido —</option>
        {routes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  )
}
