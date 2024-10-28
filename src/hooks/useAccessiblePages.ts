import { useMemo } from 'react'
import { useProfileStore } from '../stores'

export const useAccessiblePages = () => {
  const profileStore = useProfileStore()

  return useMemo(
    () =>
      profileStore.MemberRoles.map((role) =>
        role.permissions
          .filter(({ permissions }) => permissions.length)
          .map(({ group }) => group)
      ).flat(),
    [profileStore.MemberRoles]
  )
}
