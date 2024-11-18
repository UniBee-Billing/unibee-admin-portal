import { useState } from 'react'
import { safeRun } from '../utils'

export const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false)

  const withLoading = async <T>(
    fn: () => Promise<T>,
    safe: boolean | undefined = true
  ) => {
    setIsLoading(true)

    const executeFn = safe ? () => safeRun(fn) : fn
    const res = await executeFn()

    setIsLoading(false)

    return res
  }

  return {
    isLoading,
    withLoading,
    setIsLoading
  }
}
