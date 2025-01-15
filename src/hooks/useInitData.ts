import { useEffect } from 'react'
import { useMerchantMemberProfileStore } from '../stores'
import { useAppInitialize } from './useAppInitialize'

export const useInitData = () => {
  const initDataCallback = useAppInitialize()
  const merchantMemberStore = useMerchantMemberProfileStore()

  useEffect(() => {
    initDataCallback()
  }, [])
}
