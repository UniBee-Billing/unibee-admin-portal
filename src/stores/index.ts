import { create } from 'zustand'
// import { immer } from "zustand/middleware/immer";
import { persist } from 'zustand/middleware'
import {
  CreditType,
  IAppConfig,
  IMerchantMemberProfile,
  IProduct,
  TCreditConfig,
  TGateway,
  TIntegrationKeys,
  TMerchantInfo
} from '../shared.types'
// import { createStore } from "zustand";

// logged-in admin profile
const INITIAL_MERCHANT_MEMBER_PROFILE: IMerchantMemberProfile = {
  id: -1,
  merchantId: -1,
  email: '',
  firstName: '',
  lastName: '',
  createTime: 0,
  mobile: '',
  isOwner: false,
  status: 0,
  MemberRoles: []
}

interface MerchantMemberProfileSlice extends IMerchantMemberProfile {
  getProfile: () => IMerchantMemberProfile
  setProfile: (p: IMerchantMemberProfile) => void
  reset: () => void
  // setProfileField: (field: string, value: any) => void;
}

export const useMerchantMemberProfileStore =
  create<MerchantMemberProfileSlice>()((set, get) => ({
    ...INITIAL_MERCHANT_MEMBER_PROFILE,
    getProfile: () => get(),
    setProfile: (p) => set({ ...p }),
    reset: () => set(INITIAL_MERCHANT_MEMBER_PROFILE)
  }))

type TProductList = { list: IProduct[] }
const INITIAL_PRODUCT_LIST: TProductList = { list: [] }
interface ProductListSlice extends TProductList {
  getProductList: () => TProductList
  setProductList: (p: TProductList) => void
  reset: () => void
}
export const useProductListStore = create<ProductListSlice>()((set, get) => ({
  ...INITIAL_PRODUCT_LIST,
  getProductList: () => get(),
  setProductList: (p) => set(p),
  reset: () => set(INITIAL_PRODUCT_LIST)
}))

// the merchant which the current logged-in admin user is working for
const INITIAL_INFO: TMerchantInfo = {
  id: -1,
  address: '',
  companyId: '',
  companyLogo: '',
  companyName: '',
  email: '',
  location: '',
  phone: ''
}

interface MerchantInfoSlice extends TMerchantInfo {
  getMerchantInfo: () => TMerchantInfo
  setMerchantInfo: (p: TMerchantInfo) => void
  reset: () => void
}

export const useMerchantInfoStore = create<MerchantInfoSlice>()(
  persist(
    // when refreshing the page, the merchant info is lost(need to refetch from BE),
    // so at this moment, the company logo at top-left is gone, persisting merchant-info can fix this.
    (set, get) => ({
      ...INITIAL_INFO,
      getMerchantInfo: () => get(),
      setMerchantInfo: (p) => set({ ...p }),
      reset: () => set(INITIAL_INFO)
    }),
    {
      name: 'merchantInfo'
    }
  )
)

// --------------------------------
const INITIAL_APP_VALUE: IAppConfig = {
  env: 'local',
  isProd: false,
  supportCurrency: [],
  currency: {},
  supportTimeZone: [],
  gateway: [],
  taskListOpen: false,
  integrationKeys: {
    openApiKey: '', // UniBee API key
    sendGridKey: '',
    vatSenseKey: '',
    exchangeRateApiKey: '',
    segmentServerSideKey: '',
    segmentUserPortalKey: ''
  }
}

interface AppConfigSlice extends IAppConfig {
  getAppConfig: () => IAppConfig
  setAppConfig: (a: IAppConfig) => void
  setGateway: (g: TGateway[]) => void
  setIntegrationKeys: (k: TIntegrationKeys) => void
  setTaskListOpen: (isOpen: boolean) => void
  reset: () => void
}

export const useAppConfigStore = create<AppConfigSlice>()((set, get) => ({
  ...INITIAL_APP_VALUE,
  getAppConfig: () => get(),
  setAppConfig: (a) => set({ ...a }),
  setGateway: (g: TGateway[]) => {
    set({ ...get(), gateway: g })
  },
  setIntegrationKeys: (k: TIntegrationKeys) => {
    set({ ...get(), integrationKeys: k })
  },
  setTaskListOpen: (isOpen) => {
    set({ ...get(), taskListOpen: isOpen })
  },
  reset: () => set(INITIAL_APP_VALUE)
}))

// ---------------
interface ISession {
  expired: boolean
  refreshCallbacks?: (() => void)[] // if session is expired when making an async fn call, push this fn here, so after re-login, re-run all fn in this array.
}
const INITIAL_SESSION: ISession = {
  expired: false,
  refreshCallbacks: []
}
interface SessionStoreSlice extends ISession {
  getSession: () => ISession
  setSession: (s: ISession) => void
  reset: () => void
  resetCallback: () => void
}

export const useSessionStore = create<SessionStoreSlice>()((set, get) => ({
  ...INITIAL_SESSION,
  getSession: () => get(),
  setSession: (a) => set({ ...a }),
  reset: () => set(INITIAL_SESSION),
  resetCallback: () => {
    set({ ...get(), refreshCallbacks: [] })
  }
}))

// --------------------------------
interface UIConfig {
  sidebarCollapsed: boolean
}

const INITIAL_UI_CONFIG: UIConfig = {
  sidebarCollapsed: false
}

interface UIConfigSlice extends UIConfig {
  getUIConfig: () => UIConfig
  setUIConfig: (u: UIConfig) => void
  toggleSidebar: () => void
}

export const uiConfigStore = create<UIConfigSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_UI_CONFIG,
      getUIConfig: () => get(),
      setUIConfig: (a) => set({ ...a }),
      toggleSidebar: () => {
        set({ ...get(), sidebarCollapsed: !get().sidebarCollapsed })
      }
    }),
    {
      name: 'ui-config'
    }
  )
)

// --------------------------------
interface IPermission {
  roles: string[] // ['power user', 'Customer Support']
  permissions: string[] // ['plan', 'subscription', 'user', 'invoice', 'payment', 'report'], these items are the accessible pages, like /plan, /subscription.
  defaultPage: string // the page to go after login, or: if url has no path, just domain, like: https://merchant.unibee.top/. It's one of the item in the above permission array.
}
const INITIAL_PERM: IPermission = {
  roles: [],
  permissions: [],
  defaultPage: ''
}
interface PermissionStoreSlice extends IPermission {
  getPerm: () => IPermission
  setPerm: (s: IPermission) => void
  reset: () => void
}
export const usePermissionStore = create<PermissionStoreSlice>()(
  (set, get) => ({
    ...INITIAL_PERM,
    getPerm: () => get(),
    setPerm: (a) => set({ ...a }),
    reset: () => set(INITIAL_PERM)
  })
)

const INITIAL_CREDIT_CONFIG: TCreditConfig = {
  id: -1,
  merchantId: -1,
  createTime: 0,
  name: '',
  description: '',
  type: CreditType.PROMO_CREDIT,
  currency: 'EUR',
  exchangeRate: 1,
  payoutEnable: false,
  discountCodeExclusive: false,
  recurring: false,
  rechargeEnable: false,
  previewDefaultUsed: false
}

interface CreditConfigSlice extends TCreditConfig {
  getCreditConfig: () => TCreditConfig
  setCreditConfig: (c: TCreditConfig) => void
  reset: () => void
}

export const useCreditConfigStore = create<CreditConfigSlice>()((set, get) => ({
  ...INITIAL_CREDIT_CONFIG,
  getCreditConfig: () => get(),
  setCreditConfig: (p) => set({ ...p }),
  reset: () => set(INITIAL_CREDIT_CONFIG)
}))
