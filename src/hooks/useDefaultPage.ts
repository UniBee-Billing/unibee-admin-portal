import { useMemo } from 'react'
import { useProfileStore } from '../stores'
import { useAccessiblePages } from './useAccessiblePages'

export const useDefaultPage = () => {
  const profileStore = useProfileStore()
  const accessiblePages = useAccessiblePages()

  return useMemo(() => {
    const [firstPage] = accessiblePages
    const hasSubscriptionPage = accessiblePages.find(
      (page) => page === 'subscription'
    )

    return profileStore.isOwner || hasSubscriptionPage
      ? 'subscription/list'
      : firstPage
  }, [profileStore.isOwner, accessiblePages])
}
