import { useState, useEffect } from 'react'
import { useSystemStore } from '../store/systemStore'
import { api } from '../services/api'

/**
 * PRESENTER — Hook de estado del sistema.
 * Orquesta las acciones del usuario (iniciar, detener, aceptar config)
 * y carga los datos iniciales (rutas disponibles).
 * Usa getState() en los callbacks para evitar stale closures.
 */
export function useSystemState() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const journeyState = useSystemStore((s) => s.journeyState)

  // Carga las rutas disponibles al montar
  useEffect(() => {
    api.getRoutes()
      .then((data) => {
        setRoutes(data)
        if (data.length > 0) {
          useSystemStore.getState().initDraftWithRoute(data[0].id)
        }
      })
      .catch(() => setError('No se pudieron cargar las rutas del servidor'))
  }, [])

  async function handleStart() {
    const { draftConfig, commitDraft } = useSystemStore.getState()
    if (!draftConfig.routeId) {
      setError('Seleccioná una ruta antes de iniciar')
      return
    }
    setError(null)
    setLoading(true)
    try {
      commitDraft()
      await api.startJourney(draftConfig)
    } catch (e) {
      setError('Error al iniciar: ' + (e.response?.data?.error ?? e.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleStop() {
    setLoading(true)
    try {
      await api.stopJourney()
    } catch (e) {
      setError('Error al detener: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Aplica la config del panel al sistema en ejecución.
   * El backend la aplica en el próximo ciclo del bucle (sin interrumpir el ciclo actual).
   */
  async function handleApplyConfig() {
    const { draftConfig, commitDraft } = useSystemStore.getState()
    setError(null)
    setLoading(true)
    try {
      commitDraft()
      const status = journeyState?.status
      if (status === 'RUNNING') {
        await api.updateConfig(draftConfig)
      }
    } catch (e) {
      setError('Error al aplicar config: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return { routes, loading, error, handleStart, handleStop, handleApplyConfig }
}
