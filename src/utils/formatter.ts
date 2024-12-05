import { DropdownProps } from 'antd'
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

export const strItemsWithSameKey = (items: string[]) =>
  items.map((item) => ({ label: item, key: item }))

export const convertActions2Menu = (
  actions: Record<string, () => void>
): DropdownProps['menu'] => ({
  items: strItemsWithSameKey(Object.keys(actions)),
  onClick: ({ key }) => actions[key]?.()
})

export const title = (word: string) =>
  word.replace(/^([a-z])/g, (str) => str.toUpperCase())
