'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

interface NotificationState {
  count: number
  notifications: Notification[]
  connected: boolean
}

/**
 * Hook to subscribe to real-time notifications via SSE.
 * Automatically reconnects on disconnect.
 */
export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    count: 0,
    notifications: [],
    connected: false,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource('/api/notifications/stream')
    eventSourceRef.current = es

    es.onopen = () => {
      setState(prev => ({ ...prev, connected: true }))
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setState(prev => ({
          ...prev,
          count: data.count ?? prev.count,
          notifications: data.notifications ?? prev.notifications,
        }))
      } catch {
        // ignore invalid data
      }
    }

    es.onerror = () => {
      es.close()
      setState(prev => ({ ...prev, connected: false }))

      // Reconnect after 15 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, 15_000)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      eventSourceRef.current?.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    }
  }, [connect])

  return state
}
