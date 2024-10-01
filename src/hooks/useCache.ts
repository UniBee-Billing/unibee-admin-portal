import { useCallback, useEffect, useState } from 'react'

export const createCache = () => {
  const STORE: Record<string, unknown> = {}

  return {
    set: <T = unknown>(key: string, value: T) => (STORE[key] = value),
    get: <T = unknown>(key: string) => STORE[key] as T
  }
}

const STORE = createCache()

export const useCache = <T>(key: string, initialValue?: T) => {
  const [value, _setValue] = useState<T | undefined>(
    STORE.get(key) ?? initialValue
  )

  const setValue = useCallback(
    (value: T) => {
      _setValue(value)
      STORE.set(key, value)
    },
    [key]
  )

  useEffect(() => {
    if (!STORE.get(key) && initialValue) {
      STORE.set(key, initialValue)
    }
  }, [key, initialValue])

  return [value, setValue] as const
}
