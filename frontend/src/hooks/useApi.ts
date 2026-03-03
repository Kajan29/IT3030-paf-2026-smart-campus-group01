import { useState, useCallback } from 'react'

const useApi = <T,>(apiFunc: (...args: any[]) => Promise<any>) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiFunc(...args)
      setData(response.data)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunc])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}

export default useApi
