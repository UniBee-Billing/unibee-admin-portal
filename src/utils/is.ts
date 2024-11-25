export const isEmpty = <T>(
  target: T | undefined | null
): target is undefined | null => target === null || target === undefined

export const isValidNumber = (num: number) => !Number.isNaN(num)

export const isEmptyObject = (obj: object) => !Object.keys(obj).length

export const isMilliseconds = (date: number) =>
  Math.abs(Date.now() - date) < Math.abs(Date.now() - date * 1000)

export const isWord = (word: string) => /^[A-Za-z]+$/.test(word)
