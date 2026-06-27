import React from 'react'
import { useSystemStore } from '../../store/systemStore'

/**
 * VIEW — Configuración de bandas de error.
 * - Banda aceptable: dentro de esta el controlador dice OK.
 * - Banda máxima: fuera de esta el viaje termina (irrecuperable).
 */
export function ErrorBandConfig() {
  const { draftConfig, updateDraftField } = useSystemStore()

  return (
    <div className="space-y-3">
      <label className="block text-xs text-gray-400 mb-1">Bandas de error (minutos de demora)</label>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-green-400 mb-1">
            Banda aceptable ± (min)
          </label>
          <input
            type="number"
            value={draftConfig.acceptableDelayMinutes}
            onChange={(e) => updateDraftField('acceptableDelayMinutes', parseFloat(e.target.value) || 0)}
            step="0.5" min="0"
            className="w-full bg-gray-800 border border-green-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">Señal OK dentro de este rango</p>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-red-400 mb-1">
            Banda máxima ± (min)
          </label>
          <input
            type="number"
            value={draftConfig.maxRecoverableDelayMinutes}
            onChange={(e) => updateDraftField('maxRecoverableDelayMinutes', parseFloat(e.target.value) || 0)}
            step="0.5" min="0"
            className="w-full bg-gray-800 border border-red-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-500"
          />
          <p className="text-xs text-gray-500 mt-1">CRITICAL si se supera (viaje termina)</p>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Velocidad de simulación: {draftConfig.simulationSpeedMultiplier}x
          <span className="text-gray-500 ml-1">
            (1 seg real = {draftConfig.simulationSpeedMultiplier} seg simulados)
          </span>
        </label>
        <input
          type="range"
          min="1" max="600" step="1"
          value={draftConfig.simulationSpeedMultiplier}
          onChange={(e) => updateDraftField('simulationSpeedMultiplier', parseInt(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1x (tiempo real)</span>
          <span>600x</span>
        </div>
      </div>
    </div>
  )
}
