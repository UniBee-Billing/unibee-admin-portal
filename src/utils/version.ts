import { ReactNode } from 'react'
import { request } from '../requests/client'
import { safe } from './error'

type VersionControlTarget<T> = ReactNode | (() => T)

export const isVisible = <T>(
  target: VersionControlTarget<T>,
  visibleCondition: boolean
): T | ReactNode | undefined => {
  if (!visibleCondition) {
    return undefined
  }

  return typeof target === 'function' ? target() : target
}

export const premium = <T>(target: VersionControlTarget<T>) =>
  isVisible(target, false)

export const getAPIServerVersion = safe(async () => {
  const { data } = await request('/version')

  return data
})
