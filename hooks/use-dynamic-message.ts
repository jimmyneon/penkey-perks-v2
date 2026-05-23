import { useState, useEffect } from 'react'

interface DynamicMessage {
  id: string
  message: string
  emoji: string | null
}

interface UseDynamicMessageOptions {
  category: string
  context?: string
  refreshInterval?: number // milliseconds (default: 2 minutes)
  enabled?: boolean
}

/**
 * Hook to fetch dynamic messages from database
 * Refreshes automatically, bypassing cache
 */
export function useDynamicMessage({
  category,
  context = 'default',
  refreshInterval = 2 * 60 * 1000, // 2 minutes
  enabled = true
}: UseDynamicMessageOptions) {
  const [message, setMessage] = useState<string>('')
  const [emoji, setEmoji] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessage = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/messages/get-random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, context, count: 1 })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch message')
      }

      const data: DynamicMessage = await response.json()
      
      if (data) {
        setMessage(data.message)
        setEmoji(data.emoji || '')
      }
    } catch (err: any) {
      console.error('Error fetching dynamic message:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!enabled) return

    // Fetch immediately
    fetchMessage()

    // Set up refresh interval
    const interval = setInterval(fetchMessage, refreshInterval)

    return () => clearInterval(interval)
  }, [category, context, refreshInterval, enabled])

  return { message, emoji, loading, error, refresh: fetchMessage }
}

/**
 * Hook to fetch multiple rotating messages
 * Useful for carousels or rotating displays
 */
export function useDynamicMessages({
  category,
  context = 'default',
  count = 3,
  refreshInterval = 2 * 60 * 1000,
  enabled = true
}: UseDynamicMessageOptions & { count?: number }) {
  const [messages, setMessages] = useState<DynamicMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/messages/get-random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, context, count })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data: DynamicMessage[] = await response.json()
      setMessages(data || [])
    } catch (err: any) {
      console.error('Error fetching dynamic messages:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!enabled) return

    // Fetch immediately
    fetchMessages()

    // Set up refresh interval
    const interval = setInterval(fetchMessages, refreshInterval)

    return () => clearInterval(interval)
  }, [category, context, count, refreshInterval, enabled])

  return { messages, loading, error, refresh: fetchMessages }
}
