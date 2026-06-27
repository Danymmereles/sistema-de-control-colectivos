import React, { useState } from 'react'
import { useSystemStore } from '../../store/systemStore'

const EVENT_TYPES = [
  { value: 'DELAY', label: 'Demora' },
  { value: 'DETOUR', label: 'Desvío' },
  { value: 'TRAFFIC', label: 'Corte de tráfico' },
  { value: 'PASSENGERS', label: 'Exceso de pasajeros' }
]

const EMPTY_EVENT = {
  type: 'DELAY',
  triggerAtStop: '',
  delayMinutes: 5,
  extraDistanceKm: 2,
  extraMinutes: 10,
  durationMinutes: 5,
  speedReductionPercent: 30
}

/** VIEW — Carga de perturbaciones/eventos desde el panel de control. */
export function EventLoader({ routeStops = [] }) {
  const { draftConfig, addEventToDraft, removeEventFromDraft } = useSystemStore()
  const [form, setForm] = useState({ ...EMPTY_EVENT })
  const [open, setOpen] = useState(false)

  const updateForm = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleAdd = () => {
    if (!form.triggerAtStop) return
    addEventToDraft({ ...form })
    setForm({ ...EMPTY_EVENT })
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">Perturbaciones programadas</label>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
        >
          {open ? 'Cancelar' : '+ Agregar'}
        </button>
      </div>

      {open && (
        <div className="bg-gray-800 rounded p-3 space-y-2 text-sm">
          <div>
            <label className="text-xs text-gray-400">Tipo de evento</label>
            <select
              value={form.type}
              onChange={(e) => updateForm('type', e.target.value)}
              className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400">Parada donde se activa</label>
            <select
              value={form.triggerAtStop}
              onChange={(e) => updateForm('triggerAtStop', e.target.value)}
              className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none"
            >
              <option value="">— Seleccionar parada —</option>
              {routeStops.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {form.type === 'DELAY' && (
            <NumberField label="Demora (minutos simulados)" value={form.delayMinutes}
              onChange={(v) => updateForm('delayMinutes', v)} />
          )}

          {form.type === 'DETOUR' && (
            <>
              <NumberField label="Distancia extra (km)" value={form.extraDistanceKm}
                onChange={(v) => updateForm('extraDistanceKm', v)} />
              <NumberField label="Minutos extra simulados" value={form.extraMinutes}
                onChange={(v) => updateForm('extraMinutes', v)} />
            </>
          )}

          {(form.type === 'TRAFFIC' || form.type === 'PASSENGERS') && (
            <>
              <NumberField label="Duración (minutos simulados)" value={form.durationMinutes}
                onChange={(v) => updateForm('durationMinutes', v)} />
              <NumberField label="Reducción de velocidad (%)" value={form.speedReductionPercent}
                onChange={(v) => updateForm('speedReductionPercent', v)} min={1} max={90} />
            </>
          )}

          <button
            onClick={handleAdd}
            disabled={!form.triggerAtStop}
            className="w-full mt-1 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded text-sm font-medium"
          >
            Agregar evento
          </button>
        </div>
      )}

      {/* Lista de eventos cargados */}
      {draftConfig.events.length === 0 ? (
        <p className="text-xs text-gray-600 italic">Sin eventos programados</p>
      ) : (
        <ul className="space-y-1">
          {draftConfig.events.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2 text-xs">
              <span>
                <span className={`font-bold mr-1 ${ev.applied ? 'text-gray-500' : 'text-yellow-400'}`}>
                  [{EVENT_TYPES.find(t => t.value === ev.type)?.label}]
                </span>
                en <span className="text-blue-300">{ev.triggerAtStop}</span>
                {ev.applied && <span className="ml-2 text-gray-500">(aplicado)</span>}
              </span>
              {!ev.applied && (
                <button
                  onClick={() => removeEventFromDraft(ev.id)}
                  className="text-red-400 hover:text-red-300 ml-2"
                >✕</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NumberField({ label, value, onChange, min = 0, max = 9999 }) {
  return (
    <div>
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max} step="0.5"
        className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none"
      />
    </div>
  )
}
