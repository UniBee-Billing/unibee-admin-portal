export type WithError<T> = [T, null] | [null, Error]

export class PanicError extends Error {}

const wrapError = (e: unknown): [null, Error] => {
  if (e instanceof PanicError) {
    throw e
  }

  const err = e instanceof Error ? e : new Error('Something went wrong')

  return [null, err]
}

export function safe<F extends (...args: unknown[]) => Promise<T>, T>(
  fn: F
): (...args: Parameters<F>) => Promise<WithError<T>>
export function safe<F extends (...args: unknown[]) => T, T>(
  fn: F
): (...args: Parameters<F>) => WithError<T>
export function safe<F extends (...args: unknown[]) => T | Promise<T>, T>(
  fn: F
): (...args: Parameters<F>) => Promise<WithError<T>> | WithError<T> {
  return (...args: Parameters<F>) => {
    let res: T | Promise<T>

    try {
      res = fn(...args)
    } catch (e) {
      return wrapError(e)
    }

    if (res instanceof Promise) {
      return res
        .then((value) => [value, null] as WithError<T>)
        .catch((e) => wrapError(e))
    }

    return [res, null] as WithError<T>
  }
}

export const panic = (msg: string): never => {
  throw new PanicError(msg)
}
