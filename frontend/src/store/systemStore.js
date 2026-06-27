import { create } from 'zustand'

/**
 * PRESENTER (store) — Separa la configuración "draft" (lo que el usuario está editando)
 * de la configuración "active" (lo que el sistema tiene aplicado).
 * Los cambios del panel de control NO afectan el sistema hasta que se pulsa "Aceptar".
 */
const DEFAULT_CONFIG = {
  routeId: '',
  loadingOption: 'DIST_VELOCITY',
  accelerationMs2: 1.0,
  expectedVelocityKmh: 40,
  applicationTimeSeconds: 30,
  distanceKm: 0,
  averageVelocityKmh: 40,
  acceptableDelayMinutes: 3,
  maxRecoverableDelayMinutes: 10,
  events: [],
  simulationSpeedMultiplier: 60
}

export const useSystemStore = create((set, get) => ({
  // ─── Estado del sistema (viene del backend vía WebSocket) ─────────────────
  journeyState: null,
  lastSignal: null,
  logs: [],
  connected: false,

  // ─── Config del panel ─────────────────────────────────────────────────────
  draftConfig: { ...DEFAULT_CONFIG },   // lo que el usuario edita
  activeConfig: null,                    // lo que el backend tiene aplicado

  // ─── Acciones ─────────────────────────────────────────────────────────────

  setConnected: (connected) => set({ connected }),

  updateJourneyState: (state) => set({ journeyState: state }),

  updateSignal: (signal) => set({ lastSignal: signal }),

  addLog: (log) => set((s) => ({ logs: [log, ...s.logs].slice(0, 200) })),

  setLogs: (logs) => set({ logs }),

  // Actualiza un campo del draft sin tocar el sistema
  updateDraftField: (field, value) =>
    set((s) => ({ draftConfig: { ...s.draftConfig, [field]: value } })),

  addEventToDraft: (event) =>
    set((s) => ({
      draftConfig: {
        ...s.draftConfig,
        events: [...s.draftConfig.events, { ...event, id: Date.now().toString(), applied: false }]
      }
    })),

  removeEventFromDraft: (id) =>
    set((s) => ({
      draftConfig: {
        ...s.draftConfig,
        events: s.draftConfig.events.filter((e) => e.id !== id)
      }
    })),

  // Inicializa el draft con los datos de las rutas disponibles (primer carga)
  initDraftWithRoute: (routeId) =>
    set((s) => ({ draftConfig: { ...s.draftConfig, routeId } })),

  // Al pulsar "Aceptar" en el panel: guarda el draft como activeConfig
  commitDraft: () =>
    set((s) => ({ activeConfig: { ...s.draftConfig } })),

  // Resetea el draft al estado activo (cancelar cambios)
  resetDraft: () =>
    set((s) => ({ draftConfig: s.activeConfig ? { ...s.activeConfig } : { ...DEFAULT_CONFIG } })),
}))
