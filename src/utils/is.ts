export const isEmpty = <T>(
  target: T | undefined | null
): target is undefined | null => target === null || target === undefined

export const isValidNumber = (num: number) => !Number.isNaN(num)

export const isObject = (obj: unknown) =>
  Object.prototype.toString.call(obj) === '[object Object]'
