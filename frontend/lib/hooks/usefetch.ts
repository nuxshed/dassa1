'use client'

import { useState, useEffect, useCallback } from 'react'
import { apicall } from '@/lib/api'
import { useauth } from '@/lib/authcontext'

interface opts { skip?: boolean }

export function usefetch<T = any>(endpoint: string, { skip }: opts = {}) {
  const [data, setdata] = useState<T | null>(null)
  const [loading, setloading] = useState(!skip)
  const [error, seterror] = useState<string | null>(null)
  const { token, loading: authLoading } = useauth()

  const refetch = useCallback(async () => {
    setloading(true)
    seterror(null)
    try {
      const res = await apicall(endpoint, { token })
      setdata(res)
    } catch (e: any) {
      seterror(e.message)
    } finally {
      setloading(false)
    }
  }, [endpoint, token])

  useEffect(() => {
    if (!skip && !authLoading) refetch()
  }, [refetch, skip, authLoading])

  return { data, loading, error, refetch }
}
