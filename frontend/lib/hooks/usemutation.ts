'use client'

import { useState, useCallback } from 'react'
import { apicall, type apioptions } from '@/lib/api'
import { useauth } from '@/lib/authcontext'

interface opts {
  method?: apioptions['method']
  onsuccess?: (d: any) => void
  onerror?: (e: Error) => void
}

export function usemutation<B = any>(endpoint: string, { method = 'POST', onsuccess, onerror }: opts = {}) {
  const [loading, setloading] = useState(false)
  const [error, seterror] = useState<string | null>(null)
  const { token } = useauth()

  const mutate = useCallback(async (body?: B) => {
    setloading(true)
    seterror(null)
    try {
      const res = await apicall(endpoint, { method, body, token })
      onsuccess?.(res)
      return res
    } catch (e: any) {
      seterror(e.message)
      onerror?.(e)
      throw e
    } finally {
      setloading(false)
    }
  }, [endpoint, method, token, onsuccess, onerror])

  return { mutate, loading, error }
}
