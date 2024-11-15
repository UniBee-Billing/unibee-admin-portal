import { useState } from 'react'
import { safeRun } from '../utils'

export const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false)

  const withLoading = async <T>(fn: () => Promise<T>) => {
    setIsLoading(true)

    const res = await safeRun(fn)

    setIsLoading(false)

    return res
  }

  return {
    isLoading,
    withLoading,
    setIsLoading
  }
}
