import { useCallback, useEffect, useState } from 'react'
import { safeRun } from '../utils'
import { useCache } from './useCache'

interface DataSetterOptions<T> {
  optimistic: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateRemoteSourceFunction: (payload: any, data: T) => Promise<T>
  onError: (err: Error) => void
}

export const useFetch = <T>(
  url: string,
  fetcher: (url: string) => Promise<T>,
  options?: Partial<DataSetterOptions<T>>
) => {
  const [error, setError] = useState<Error | undefined>()
  const [loading, setLoading] = useState(true)
  const [cachedData, setCachedData] = useCache<T>(url)

  const fetchData = useCallback(
    async (fetcher: () => Promise<T>, isOptimistic?: boolean) => {
      if (!isOptimistic) {
        setLoading(true)
      }

      const [_, err] = await safeRun(async () => {
        const res = await fetcher()

        setCachedData(res)
      })

      if (err !== null) {
        setError(err)
        options?.onError?.(err)
      }

      setLoading(false)
    },
    [url]
  )

  const setData = useCallback(
    async (data: T, payload?: unknown) => {
      setCachedData(data)

      if (options?.optimistic && options?.updateRemoteSourceFunction) {
        fetchData(
          () => options.updateRemoteSourceFunction!(payload, data),
          options.optimistic
        )
      }
    },
    [fetchData, options]
  )

  useEffect(() => {
    fetchData(() => fetcher(url))
  }, [fetchData])

  return { data: cachedData, error, loading, setData }
}
