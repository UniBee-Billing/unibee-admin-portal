export type DataType<T> = [T, null]
export type ErrorType = [null, Error]
export type WithError<T> = DataType<T> | ErrorType

export class PanicError extends Error {}

const wrapError = (e: unknown): ErrorType => {
  if (e instanceof PanicError) {
    throw e
  }

  const err = e instanceof Error ? e : new Error('Something went wrong')

  return [null, err]
}

export function safe<F extends (...args: unknown[]) => Promise<unknown>>(
  fn: F
): (
  ...args: Parameters<F>
) => Promise<
  WithError<ReturnType<F> extends Promise<infer T> ? T : ReturnType<F>>
>
export function safe<F extends (...args: unknown[]) => unknown>(
  fn: F
): (...args: Parameters<F>) => WithError<ReturnType<F>>
export function safe<
  F extends (...args: unknown[]) => unknown | Promise<unknown>
>(
  fn: F
): (
  ...args: Parameters<F>
) => Promise<WithError<unknown>> | WithError<unknown> {
  return (...args: Parameters<F>) => {
    type Res = ReturnType<F>
    let res: Res | Promise<Res>

    try {
      res = fn(...args) as Res
    } catch (e) {
      return wrapError(e)
    }

    if (res instanceof Promise) {
      return res
        .then((value) => [value, null] as WithError<Res>)
        .catch((e) => wrapError(e))
    }

    return [res, null] as WithError<Res>
  }
}

export const panic = (msg: string): never => {
  throw new PanicError(msg)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const safeRun = <F extends (...args: unknown[]) => any>(fn: F) =>
  safe<() => ReturnType<F>>(() => fn())()
