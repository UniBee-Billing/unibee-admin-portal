export const isEmpty = (target: unknown) =>
  target === null || target === undefined

export const isValidNumber = (num: number) => !Number.isNaN(num)
