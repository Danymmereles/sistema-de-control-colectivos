import React from 'react'
import { useSystemStore } from '../../store/systemStore'

const OPTIONS = [
  { value: 'ACCEL_VELOCITY', label: 'Aceleración + Velocidad esperada' },
  { value: 'ACCEL_TIME', label: 'Aceleración + Tiempo de aplicación' },
  { value: 'DIST_VELOCITY', label: 'Distancia + Velocidad promedio' }
]

/**
 * VIEW — Selector de opción de carga con sus campos correspondientes.
 * Solo modifica el draft; no impacta el sistema en ejecución.
 */
export function LoadingOptions() {
  const { draftConfig, updateDraftField } = useSystemStore()

  return (
    <div className="space-y-3">
      <label className="block text-xs text-gray-400 mb-1">Opción de carga</label>
      <div className="space-y-1">
        {OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="loadingOption"
              value={opt.value}
              checked={draftConfig.loadingOption === opt.value}
              onChange={() => updateDraftField('loadingOption', opt.value)}
              className="accent-blue-500"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* Campos dinámicos según la opción seleccionada */}
      <div className="mt-2 space-y-2 pl-2 border-l border-gray-700">
        {(draftConfig.loadingOption === 'ACCEL_VELOCITY' || draftConfig.loadingOption === 'ACCEL_TIME') && (
          <Field
            label="Aceleración (m/s²)"
            value={draftConfig.accelerationMs2}
            onChange={(v) => updateDraftField('accelerationMs2', parseFloat(v) || 0)}
            step="0.1" min="0.1"
          />
        )}

        {draftConfig.loadingOption === 'ACCEL_VELOCITY' && (
          <Field
            label="Velocidad esperada (km/h)"
            value={draftConfig.expectedVelocityKmh}
            onChange={(v) => updateDraftField('expectedVelocityKmh', parseFloat(v) || 0)}
            step="1" min="1"
          />
        )}

        {draftConfig.loadingOption === 'ACCEL_TIME' && (
          <Field
            label="Tiempo de aplicación (seg reales)"
            value={draftConfig.applicationTimeSeconds}
            onChange={(v) => updateDraftField('applicationTimeSeconds', parseFloat(v) || 0)}
            step="1" min="1"
          />
        )}

        {draftConfig.loadingOption === 'DIST_VELOCITY' && (
          <Field
            label="Velocidad promedio (km/h)"
            value={draftConfig.averageVelocityKmh}
            onChange={(v) => updateDraftField('averageVelocityKmh', parseFloat(v) || 0)}
            step="1" min="1"
          />
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, step = '1', min = '0' }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={min}
        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  )
}
