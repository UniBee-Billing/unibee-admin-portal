import { message } from 'antd'
import { isEmpty } from 'lodash'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoutReq } from '../requests'
import {
  useAppConfigStore,
  useMerchantInfoStore,
  usePermissionStore,
  useProfileStore,
  useSessionStore
} from '../stores'

// Refactor TODO: add login to this service
export const useUser = () => {
  const sessionStore = useSessionStore()
  const profileStore = useProfileStore()
  const merchantInfoStore = useMerchantInfoStore()
  const permissionStore = usePermissionStore()
  const appConfigStore = useAppConfigStore()
  const navigate = useNavigate()

  const resetData = useCallback(() => {
    sessionStore.reset()
    profileStore.reset()
    merchantInfoStore.reset()
    appConfigStore.reset()
    permissionStore.reset()

    localStorage.removeItem('merchantToken')
    localStorage.removeItem('appConfig')
    localStorage.removeItem('merchantInfo')
    localStorage.removeItem('session')
    localStorage.removeItem('profile')
    localStorage.removeItem('permissions')
  }, [
    sessionStore,
    profileStore,
    merchantInfoStore,
    permissionStore,
    appConfigStore
  ])

  const logout = useCallback(
    async (navigatePath?: string) => {
      const [_, err] = await logoutReq()

      if (!isEmpty(err)) {
        message.error(err.message)
        return
      }

      resetData()

      if (navigatePath) {
        navigate(navigatePath)
      }
    },
    [resetData]
  )

  const profile = useMemo(() => profileStore.getProfile(), [profileStore])

  return { logout, profile }
}
