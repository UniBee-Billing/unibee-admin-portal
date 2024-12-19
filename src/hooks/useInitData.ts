import { useCallback, useEffect } from 'react'
import { normalizeCreditConfig } from '../components/settings/creditConfig'
import { initializeReq } from '../requests'
import { CreditType, TCreditConfig } from '../shared.types'
import {
  useAppConfigStore,
  useCreditConfigStore,
  useMerchantInfoStore,
  usePermissionStore,
  useProductListStore
} from '../stores'

// better to use null
const defaultCreditConfig: TCreditConfig = {
  id: -1,
  merchantId: -1,
  createTime: Math.round(new Date().getTime() / 1000),
  name: 'default credit config',
  description: 'default credit config',
  type: CreditType.PROMO_CREDIT,
  currency: 'EUR',
  exchangeRate: 100,
  payoutEnable: false,
  discountCodeExclusive: false,
  recurring: false,
  rechargeEnable: false,
  previewDefaultUsed: false
}

export const useInitDataCallback = () => {
  const merchantInfoStore = useMerchantInfoStore()
  const permissionStore = usePermissionStore()
  const productsStore = useProductListStore()
  const appConfigStore = useAppConfigStore()
  const creditConfigStore = useCreditConfigStore()

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

      const { appConfig, gateways, merchantInfo, products, creditConfigs } =
        initRes

      appConfigStore.setAppConfig(appConfig)
      appConfigStore.setGateway(gateways)
      merchantInfoStore.setMerchantInfo(merchantInfo.merchant)
      productsStore.setProductList({ list: products.products })
      permissionStore.setPerm({
        role: merchantInfo.merchantMember.role,
        permissions: merchantInfo.merchantMember.permissions
      })

      if (creditConfigs == null || creditConfigs.length == 0) {
        creditConfigStore.setCreditConfig(defaultCreditConfig)
      } else {
        const c = creditConfigs.find((c: TCreditConfig) => c.currency == 'EUR')
        if (c == undefined) {
          creditConfigStore.setCreditConfig(defaultCreditConfig)
        } else {
          creditConfigStore.setCreditConfig(normalizeCreditConfig(c))
        }
      }
    }
  }, [
    appConfigStore,
    productsStore,
    merchantInfoStore,
    permissionStore,
    creditConfigStore
  ])
}

export const useInitData = () => {
  const initDataCallback = useInitDataCallback()

  useEffect(() => {
    initDataCallback()
  }, [])
}
