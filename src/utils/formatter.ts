import { IProfile } from '../shared.types'
import { isMilliseconds } from './is'

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
