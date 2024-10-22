import { useDebouncedCallback } from 'use-debounce'

export const useDebouncedCallbackWithDefault = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: any[]) => any
) => useDebouncedCallback(fn, 500, { leading: false, trailing: true })
