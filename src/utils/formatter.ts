import { IProfile } from '../shared.types'
import { isMilliseconds, isWord } from './is'

export const formatUserName = (user: IProfile) =>
  `${user.firstName} ${user.lastName}`

export const mapObjectKeys = (
  obj: Record<string, unknown>,
  oldSubKey: string,
  newSubKey: string
) =>
  Object.entries(obj).reduce(
    (acc, [key, value]) => ({
      [key.replace(oldSubKey, newSubKey)]: value,
      ...acc
    }),
    {}
  )

export const convertMillisecondsToSeconds = (date: number) =>
  isMilliseconds(date) ? date / 1000 : date

export const convertPascalCaseToSentence = (word: string) =>
  word
    .replace(/([A-Z])/g, (_, capture) => ` ${capture}`)
    .trim()
    .replace(/^[a-z]/, (str) => str.toUpperCase())

export const safeConvertPascalCaseToSentence = (word: string) =>
  isWord(word) ? convertPascalCaseToSentence(word) : word
