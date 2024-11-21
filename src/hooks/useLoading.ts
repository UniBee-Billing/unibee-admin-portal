import { useState } from 'react'
import { safeRun, WithError } from '../utils'

export const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false)

  async function withLoading<T, S>(
    fn: () => Promise<T>,
    safe: S
  ): Promise<S extends true ? WithError<T> : T>
  async function withLoading<T>(fn: () => Promise<T>): Promise<WithError<T>>
  async function withLoading<T, S extends boolean | undefined>(
    fn: () => Promise<T>,
    safe?: S
  ) {
    setIsLoading(true)

    const executeFn = (safe ?? true) ? () => safeRun(fn) : fn
    const res = await executeFn()

    setIsLoading(false)

    return res as Promise<WithError<T>> | Promise<T>
  }

  return {
    isLoading,
    withLoading,
    setIsLoading
  }
}
