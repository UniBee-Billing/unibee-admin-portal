import { useCallback } from 'react'
import { normalizeCreditConfig } from '../components/settings/creditConfig'
import { initializeReq } from '../requests'
import { CreditType, TCreditConfig } from '../shared.types'
import {
  useAppConfigStore,
  useCreditConfigStore,
  useMerchantInfoStore,
  // usePermissionStore,
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

export const useAppInitialize = (): (() => Promise<string>) => {
  const merchantInfoStore = useMerchantInfoStore()
  // const permissionStore = usePermissionStore()
  const productsStore = useProductListStore()
  const appConfigStore = useAppConfigStore()
  const creditConfigStore = useCreditConfigStore()

  // const [defaultPage, setDefaultPage] = useState<string|null>(null)

  const appInitialize = useCallback(async () => {
    const [initRes, errInit] = await initializeReq()
    if (errInit) {
      return ''
    }

    const { appConfig, gateways, merchantInfo, products, creditConfigs } =
      initRes

    appConfigStore.setAppConfig(appConfig)
    appConfigStore.setGateway(gateways)
    merchantInfoStore.setMerchantInfo(merchantInfo.merchant)
    productsStore.setProductList({ list: products.products })
    /*
      permissionStore.setPerm({
        role: merchantInfo.merchantMember.role,
        permissions: merchantInfo.merchantMember.permissions
      })
      */

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

    const permissions: Set<string> | string[] = new Set<string>()
    merchantInfo.merchantMember.MemberRoles.forEach(
      (
        memberRole: {
          permissions: Array<{ group: string; permissions: string[] }> // group is the page name, "plan", "user" as used in route "/plan", "/user"
        } // permissions: string[], could be ['access', 'write', 'execute'], only 'access' is implemented right now.
      ) =>
        memberRole.permissions.forEach((permission) => {
          if (
            permission.permissions != null &&
            permission.permissions.length > 0
          ) {
            // permissions could be an empty array, which means: you don't have access to this page, equivalent to that the whole permissions object doesn't exist.
            permissions.add(permission.group)
          }
        })
    )

    console.log(
      'permissions set /role: ',
      permissions,
      '///',
      merchantInfo.merchantMember.MemberRoles
    )

    if (merchantInfo.isOwner) {
      return '/plan'
    }

    if (permissions.has('user')) {
      return '/user'
    } else if (permissions.has('subscription')) {
      return '/subscription'
    } else if (permissions.has('invoice')) {
      return '/invoice'
    } else {
      return '/' + (Array.from(permissions)[0] ?? '')
    }
  }, [appConfigStore, merchantInfoStore, productsStore, creditConfigStore])

  return appInitialize
}
