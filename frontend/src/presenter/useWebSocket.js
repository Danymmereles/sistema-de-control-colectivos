import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useSystemStore } from '../store/systemStore'

/**
 * PRESENTER — Hook de WebSocket.
 * Establece la conexión STOMP, se suscribe a los topics del backend
 * y distribuye los mensajes al store de Zustand.
 */
export function useWebSocket() {
  const clientRef = useRef(null)
  const { setConnected, updateJourneyState, updateSignal, addLog } = useSystemStore()

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)

        client.subscribe('/topic/journey/state', (msg) => {
          updateJourneyState(JSON.parse(msg.body))
        })

        client.subscribe('/topic/journey/signal', (msg) => {
          updateSignal(JSON.parse(msg.body))
        })

        client.subscribe('/topic/journey/logs', (msg) => {
          addLog(JSON.parse(msg.body))
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false)
    })

    client.activate()
    clientRef.current = client

    return () => client.deactivate()
  }, [])
}
