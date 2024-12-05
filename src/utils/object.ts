import { omitBy } from 'lodash'
import { isEmpty } from './is'

export const renameKeys = (
  obj: Record<string, unknown>,
  keyMap: Record<string, string>
) =>
  Object.keys(obj).reduce((acc, key) => {
    const newKey = keyMap[key] ?? key
    return {
      ...acc,
      [newKey]: obj[key]
    }
  }, {})

export const trimEmptyValues = (obj: Record<string, unknown>) =>
  omitBy(obj, (value) => isEmpty(value))
