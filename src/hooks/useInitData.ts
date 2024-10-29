import { useCallback, useEffect } from 'react'
import { initializeReq } from '../requests'
import {
  useAppConfigStore,
  useMerchantInfoStore,
  usePermissionStore,
  useProductListStore
} from '../stores'

export const useInitDataCallback = () => {
  const merchantInfoStore = useMerchantInfoStore()
  const permissionStore = usePermissionStore()
  const productsStore = useProductListStore()
  const appConfigStore = useAppConfigStore()

  return useCallback(async () => {
    const navigationEntries = window.performance.getEntriesByType('navigation')

    if (
      navigationEntries.length > 0 &&
      (navigationEntries[0] as PerformanceNavigationTiming).type === 'reload'
    ) {
      const [initRes, errInit] = await initializeReq()

      if (errInit) {
        return
      }

      const { appConfig, gateways, merchantInfo, products } = initRes

      appConfigStore.setAppConfig(appConfig)
      appConfigStore.setGateway(gateways)
      merchantInfoStore.setMerchantInfo(merchantInfo.merchant)
      productsStore.setProductList({ list: products.products })
      permissionStore.setPerm({
        role: merchantInfo.merchantMember.role,
        permissions: merchantInfo.merchantMember.permissions
      })
    }
  }, [appConfigStore, productsStore, merchantInfoStore, permissionStore])
}

export const useInitData = () => {
  const initDataCallback = useInitDataCallback()

  useEffect(() => {
    initDataCallback()
  }, [])
}
