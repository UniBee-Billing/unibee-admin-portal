import axios from 'axios'
import update from 'immutability-helper'
import {
  AccountType,
  CreditTxType,
  CreditType,
  DiscountCode,
  ExpiredError,
  IPlan,
  IProfile,
  PlanPublishStatus,
  PlanStatus,
  PlanType,
  TCreditConfig,
  TExportDataType,
  TGatewayExRate,
  TImportDataType,
  TMerchantInfo,
  TRole
} from '../shared.types'
import { useMerchantInfoStore, useSessionStore } from '../stores'
import { serializeSearchParams } from '../utils/query'
import { analyticsRequest, request } from './client'

const API_URL = import.meta.env.VITE_API_URL
const session = useSessionStore.getState()

type PagedReq = {
  count?: number
  page?: number
}

const updateSessionCb = (refreshCb?: () => void) => {
  const refreshCallbacks = update(session.refreshCallbacks, {
    $push: [refreshCb]
  })
  session.setSession({
    expired: true,
    refreshCallbacks
  })
}

const handleStatusCode = (code: number, refreshCb?: () => void) => {
  if (code == 61 || code == 62) {
    // TODO: use Enum to define the code
    // session expired || role/permissions changed(need relogin)
    updateSessionCb(refreshCb)
    throw new ExpiredError(
      `${code == 61 ? 'Session expired' : 'Your roles or permissions have been changed, please relogin'}`
    )
  }
}

// after login OR user manually refresh page(and token is still valid), we need merchantInfo, appConfig, payment gatewayInfo, etc.
// this fn get all these data in one go.
export const initializeReq = async () => {
  const [
    [appConfig, errConfig],
    [gateways, errGateway],
    [merchantInfo, errMerchant],
    [products, errProductList],
    [creditConfigs, errCreditConfigs]
  ] = await Promise.all([
    getAppConfigReq(),
    getPaymentGatewayListReq(),
    getMerchantInfoReq(),
    getProductListReq({}),
    getCreditConfigListReq({
      types: [CreditType.PROMO_CREDIT],
      currency: 'EUR'
    })
  ])
  const err =
    errConfig || errGateway || errMerchant || errProductList || errCreditConfigs
  if (null != err) {
    return [null, err]
  }

  return [{ appConfig, gateways, merchantInfo, products, creditConfigs }, null]
}

// ------------
type TSignupReq = {
  email: string
  firstName: string
  lastName: string
  password: string
}
export const signUpReq = async (body: TSignupReq) => {
  try {
    await request.post(`/merchant/auth/sso/register`, body)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TPassLogin = {
  email: string
  password: string
}
// caller will handle the session update(set expired: false)
export const loginWithPasswordReq = async (body: TPassLogin) => {
  try {
    const res = await request.post('/merchant/auth/sso/login', body)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const loginWithOTPReq = async (email: string) => {
  try {
    await request.post(`/merchant/auth/sso/loginOTP`, { email })
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// caller will handle the session update(set expired: false)
export const loginWithOTPVerifyReq = async (
  email: string,
  verificationCode: string
) => {
  try {
    const res = await request.post(`/merchant/auth/sso/loginOTPVerify`, {
      email,
      verificationCode
    })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const forgetPassReq = async (email: string) => {
  try {
    await request.post(`/merchant/auth/sso/passwordForgetOTP`, {
      email
    })
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const forgetPassVerifyReq = async (
  email: string,
  verificationCode: string,
  newPassword: string
) => {
  try {
    await request.post(`/merchant/auth/sso/passwordForgetOTPVerify`, {
      email,
      verificationCode,
      newPassword
    })
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const resetPassReq = async (
  oldPassword: string,
  newPassword: string
) => {
  try {
    const res = await request.post(`/merchant/member/passwordReset`, {
      oldPassword,
      newPassword
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const logoutReq = async () => {
  const session = useSessionStore.getState()
  try {
    await request.post(`/merchant/member/logout`, {})
    session.setSession({ expired: true, refreshCallbacks: [] })
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getAppConfigReq = async () => {
  try {
    const res = await request.get(`/system/information/get`, {})
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getMerchantInfoReq = async (refreshCb?: () => void) => {
  try {
    const res = await request.get(`/merchant/get`)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateMerchantInfoReq = async (body: TMerchantInfo) => {
  try {
    const res = await request.post(`/merchant/update`, body)
    handleStatusCode(res.data.code)
    return [res.data.data.merchant, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const uploadLogoReq = async (f: FormData) => {
  const token = localStorage.getItem('merchantToken')
  try {
    const res = await axios.post(`${API_URL}/merchant/oss/file`, f, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `${token}`
      }
    })
    handleStatusCode(res.data.code)
    return [res.data.data.url, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const generateApiKeyReq = async () => {
  try {
    const res = await request.post('/merchant/new_apikey', {})
    handleStatusCode(res.data.code)
    return [res.data.data.apiKey, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export type TGatewayConfigBody = {
  gatewayId?: number
  gatewayName?: string
  gatewayKey?: string
  gatewaySecret?: string
  gatewayPaymentTypes?: string[]
  displayName?: string
  gatewayLogo?: string[]
  sort?: number
  currencyExchange?: TGatewayExRate[]
}

export const saveGatewayConfigReq = async (
  body: TGatewayConfigBody,
  isNew: boolean
) => {
  const url = isNew ? '/merchant/gateway/setup' : '/merchant/gateway/edit'
  try {
    const res = await request.post(url, body)
    handleStatusCode(res.data.code)
    return [res.data.data.gateway, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const saveWebhookKeyReq = async (
  gatewayId: number,
  webhookSecret: string
) => {
  try {
    const res = await request.post('/merchant/gateway/setup_webhook', {
      gatewayId,
      webhookSecret
    })
    handleStatusCode(res.data.code)
    return [res.data.data.gatewayWebhookUrl, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const saveVatSenseKeyReq = async (vatKey: string) => {
  const body = {
    IsDefault: true,
    gatewayName: 'vatsense',
    data: vatKey
  }
  try {
    const res = await request.post('/merchant/vat/setup_gateway', body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const saveSendGridKeyReq = async (vatKey: string) => {
  const body = {
    IsDefault: true,
    gatewayName: 'sendgrid',
    data: vatKey
  }
  try {
    const res = await request.post('/merchant/email/gateway_setup', body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const saveExRateKeyReq = async (exchangeRateApiKey: string) => {
  try {
    const res = await request.post(
      '/merchant/gateway/setup_exchange_rate_api',
      { exchangeRateApiKey }
    )
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// ---------------
export type TPlanListBody = {
  type?: PlanType[] | null
  status?: PlanStatus[] | null
  productIds?: number[] | null
  publishStatus?: PlanPublishStatus // UnPublished, Published
  sortField?: 'plan_name' | 'gmt_create' | 'gmt_modify'
  sortType?: 'asc' | 'desc'
} & PagedReq
export const getPlanList = async (
  body: TPlanListBody,
  refreshCb?: () => void
) => {
  try {
    const res = await request.post('/merchant/plan/list', body)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// -----------------

const getPlanDetail = async (planId: number) => {
  try {
    const res = await request.post('/merchant/plan/detail', {
      planId
    })
    handleStatusCode(res.data.code)
    return [res.data.data.plan, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const copyPlanReq = async (planId: number) => {
  try {
    const res = await request.post('/merchant/plan/copy', {
      planId
    })
    handleStatusCode(res.data.code)
    return [res.data.data.plan, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// 3 calls to get planDetail(with planId), addonList, and metricsList
// "planId: null" means caller want to create a new plan, so a resolved promise is passed
export const getPlanDetailWithMore = async (
  planId: number | null,
  refreshCb?: () => void
) => {
  const planDetailRes =
    planId == null
      ? Promise.resolve([{ data: { data: null, code: 0 } }, null])
      : getPlanDetail(planId)
  const [
    [planDetail, errDetail],
    [addonList, addonErr],
    [metricsList, errMetrics],
    [productList, errProduct]
  ] = await Promise.all([
    planDetailRes,
    getPlanList({
      type: [PlanType.ADD_ON, PlanType.ONE_TIME_ADD_ON],
      status: [PlanStatus.ACTIVE],
      page: 0,
      count: 150
    }),
    getMetricsListReq({
      page: 0,
      count: 150
    }),
    getProductListReq({})
  ])
  const err = errDetail || addonErr || errMetrics || errProduct
  if (null != err) {
    if (err instanceof ExpiredError) {
      updateSessionCb(refreshCb)
    }
    return [null, err]
  }

  return [{ planDetail, addonList, metricsList, productList }, null]
}

// create a new or save an existing plan
export const savePlan = async (planDetail: Partial<IPlan>, isNew: boolean) => {
  const url = isNew ? '/merchant/plan/new' : `/merchant/plan/edit`
  try {
    const res = await request.post(url, planDetail)
    handleStatusCode(res.data.code)
    return [res.data.data.plan, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const activatePlan = async (planId: number) => {
  try {
    const res = await request.post(`/merchant/plan/activate`, {
      planId
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const deletePlanReq = async (planId: number) => {
  try {
    const res = await request.post(`/merchant/plan/delete`, {
      planId
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const archivePlanReq = async (
  planId: number,
  archiveOption: PlanStatus.SOFT_ARCHIVED | PlanStatus.HARD_ARCHIVED
) => {
  try {
    const res = await request.post(`/merchant/plan/archive`, {
      planId,
      hardArchive: archiveOption === PlanStatus.HARD_ARCHIVED
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const togglePublishReq = async ({
  planId,
  publishAction
}: {
  planId: number
  publishAction: 'PUBLISH' | 'UNPUBLISH'
}) => {
  const url = `/merchant/plan/${
    publishAction === 'PUBLISH' ? 'publish' : 'unpublished'
  }`
  try {
    const res = await request.post(url, { planId })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getMetricsListReq = async ({
  refreshCb,
  page,
  count
}: { refreshCb?: () => void } & PagedReq) => {
  try {
    const res = await request.get(`/merchant/metric/list`, {
      params: {
        page,
        count
      }
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// --------
type TMetricsBody = {
  // for edit
  metricId: number
  metricName: string
  metricDescription: string
}
type TMetricsBodyNew = {
  // for creation
  code: string
  metricName: string
  metricDescription: string
  aggregationType: number
  aggregationProperty: number
}
// create a new or save an existing metrics
export const saveMetricsReq = async (
  body: TMetricsBody | TMetricsBodyNew,
  isNew: boolean
) => {
  const url = isNew ? `/merchant/metric/new` : `/merchant/metric/edit`
  try {
    const res = await request.post(url, body)
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// ---------

export const getMetricDetailReq = async (
  metricId: number,
  refreshCb: () => void
) => {
  try {
    const res = await request.post(`/merchant/metric/detail`, {
      metricId
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.merchantMetric, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// test use only
export const sendMetricEventReq = async (body: {
  metricCode: string
  externalEventId: string
  userId: number
  productId: number
  aggregationValue?: number
  metricProperties: {
    [key: string]: number | string
  }
}) => {
  try {
    const res = await request.post(`/merchant/metric/event/new`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getMetricUsageBySubIdReq = async (
  subId: number,
  refreshCb?: () => void
) => {
  try {
    const res = await request.get(
      `/merchant/metric/user/sub/metric?subscriptionId=${subId}`
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.userMetric, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// ----------
type TSubListReq = {
  status: number[]
  currency?: string
  amountStart?: number
  amountEnd?: number
  planIds?: number[]
  createTimeStart?: number
  createTimeEnd?: number
} & PagedReq
export const getSublist = async (body: TSubListReq, refreshCb: () => void) => {
  try {
    const res = await request.post(`/merchant/subscription/list`, body)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// ------------

const getSubDetail = async (subscriptionId: string) => {
  try {
    const res = await request.post(`/merchant/subscription/detail`, {
      subscriptionId
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getSubDetailWithMore = async (
  subscriptionId: string,
  refreshCb?: () => void
) => {
  const [[subDetail, errSubDetail], [planList, errPlanList]] =
    await Promise.all([
      getSubDetail(subscriptionId),
      getPlanList({
        type: [PlanType.MAIN, PlanType.ONE_TIME_ADD_ON], // in Assign-subscription modal, admin can assign a one-time add-on to a user.
        status: [
          PlanStatus.ACTIVE,
          PlanStatus.SOFT_ARCHIVED, // users might have subscribed to a plan, then this plan was archived.
          PlanStatus.HARD_ARCHIVED // on ChangePlan/AssignSub Modal, I still need to get these archived plans.
        ],
        page: 0,
        count: 200
      })
    ])
  const err = errSubDetail || errPlanList
  if (null != err) {
    if (err instanceof ExpiredError) {
      updateSessionCb(refreshCb)
    }
    return [null, err]
  }
  return [{ subDetail, planList }, null]
}

export const getSubDetailInProductReq = async ({
  userId,
  productId,
  refreshCb
}: {
  userId: number
  productId: number
  refreshCb?: () => void
}) => {
  try {
    const res = await request.post(
      `/merchant/subscription/user_subscription_detail`,
      {
        userId,
        productId
      }
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getSubscriptionHistoryReq = async ({
  userId,
  page,
  count,
  refreshCb
}: { userId: number; refreshCb?: () => void } & PagedReq) => {
  try {
    const res = await request.post(`/merchant/subscription/timeline_list`, {
      userId,
      page,
      count
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getOneTimePaymentHistoryReq = async ({
  userId,
  page,
  count,
  refreshCb
}: {
  userId: number
  refreshCb?: () => void
} & PagedReq) => {
  try {
    const res = await request.get(
      `/merchant/payment/item/list?userId=${userId}&page=${page}&count=${count}`
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// new user has chosen a sub plan, but hasn't paid yet, before the payment due date, user and admin can cancel it.
// this fn is for this purpose only, this call only work for sub.status == created.
// it's not the same as terminate an active sub,
export const cancelSubReq = async (subscriptionId: string) => {
  try {
    const res = await request.post(`/merchant/subscription/cancel`, {
      subscriptionId
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// mark pending subscription as incomplete until this date
export const markAsIncompleteReq = async (
  subscriptionId: string,
  until: number
) => {
  try {
    const res = await request.post(
      `/merchant/subscription/active_temporarily`,
      {
        subscriptionId,
        expireTime: until
      }
    )
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const createPreviewReq = async ({
  subscriptionId,
  newPlanId,
  addons,
  discountCode,
  applyPromoCredit,
  applyPromoCreditAmount
}: {
  subscriptionId: string
  newPlanId: number
  addons: { quantity: number; addonPlanId: number }[]
  discountCode?: string
  applyPromoCredit?: boolean
  applyPromoCreditAmount?: number
}) => {
  try {
    const res = await request.post(`/merchant/subscription/update_preview`, {
      subscriptionId,
      newPlanId,
      quantity: 1,
      addonParams: addons,
      discountCode,
      applyPromoCredit,
      applyPromoCreditAmount
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateSubscription = async ({
  subscriptionId,
  newPlanId,
  addons,
  confirmTotalAmount,
  confirmCurrency,
  prorationDate,
  discountCode,
  applyPromoCredit,
  applyPromoCreditAmount
}: {
  subscriptionId: string
  newPlanId: number
  addons: { quantity: number; addonPlanId: number }[]
  confirmTotalAmount: number
  confirmCurrency: string
  prorationDate: number
  discountCode?: string
  applyPromoCredit?: boolean
  applyPromoCreditAmount?: number
}) => {
  try {
    const res = await request.post(`/merchant/subscription/update_submit`, {
      subscriptionId,
      newPlanId,
      quantity: 1,
      addonParams: addons,
      confirmTotalAmount,
      confirmCurrency,
      prorationDate,
      discountCode,
      applyPromoCredit,
      applyPromoCreditAmount
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export interface BusinessUserData {
  address: string
  companyName: string
  zipCode: string
  vatNumber: string
  registrationNumber: string
}

export interface UserData {
  type: AccountType
  countryCode: string
}

type TCreateSubReq = {
  planId: number
  gatewayId: number
  gatewayPaymentType?: string
  userId: number
  trialEnd?: number
  addonParams?: { quantity: number; addonPlanId: number }[]
  confirmTotalAmount?: number
  confirmCurrency?: string
  startIncomplete?: boolean
  user: UserData & Partial<BusinessUserData>
  vatCountryCode: string | undefined
  vatNumber: string | undefined
  discountCode: string | undefined
  applyPromoCredit?: boolean
  applyPromoCreditAmount?: number
}

export const createSubscriptionReq = async ({
  planId,
  gatewayId,
  gatewayPaymentType,
  userId,
  trialEnd,
  addonParams,
  confirmCurrency,
  confirmTotalAmount,
  startIncomplete,
  user,
  vatCountryCode,
  vatNumber,
  discountCode,
  applyPromoCredit,
  applyPromoCreditAmount
}: TCreateSubReq) => {
  try {
    const res = await request.post(`/merchant/subscription/create_submit`, {
      planId,
      gatewayId,
      gatewayPaymentType,
      userId,
      trialEnd,
      quantity: 1,
      addonParams: addonParams,
      confirmTotalAmount,
      confirmCurrency,
      startIncomplete,
      user,
      vatCountryCode,
      vatNumber,
      discountCode,
      applyPromoCredit,
      applyPromoCreditAmount
    })
    handleStatusCode(res.data.code)
    if (res.data.code == 51) {
      // amt in preview data not matched amt in submit body
      throw new Error(res.data.message)
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// terminate the subscription, immediate: true -> now, immediate: false -> at the end of this billing cycle
export const terminateSubReq = async (
  SubscriptionId: string,
  immediate: boolean
) => {
  const body: {
    SubscriptionId: string
    invoiceNow?: boolean
    prorate?: boolean
  } = {
    SubscriptionId
  }
  let url = `/merchant/subscription/cancel_at_period_end`
  if (immediate) {
    body.invoiceNow = true
    body.prorate = true
    url = `/merchant/subscription/cancel`
  }
  try {
    const res = await request.post(url, body)
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// resume subscription is for case that it'll get terminated at the end of this billing cycle automatically.
// if it has already ended immediately, no resume allowed.
export const resumeSubReq = async (subscriptionId: string) => {
  const url = `/merchant/subscription/cancel_last_cancel_at_period_end`
  try {
    const res = await request.post(url, {
      subscriptionId
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// -------------
type TGetSubTimelineReq = {
  userId?: number
  currency?: string
  amountStart?: number
  amountEnd?: number
  status?: number[]
  gatewayIds?: number[]
  timelineTypes?: number[]
  createTimeStart?: number // used in /merchant/payment/timeline/list only
  createTimeEnd?: number // ditto
} & PagedReq

// query params are the same as getSubTimelineReq
export const getPaymentTimelineReq = async (
  params: TGetSubTimelineReq,
  refreshCb: () => void
) => {
  const {
    page,
    count,
    userId,
    currency,
    amountStart,
    amountEnd,
    status,
    gatewayIds,
    timelineTypes,
    createTimeStart,
    createTimeEnd
  } = params
  let url = `/merchant/payment/timeline/list?page=${page}&count=${count}`
  if (currency != null && currency != '') {
    url += `&currency=${currency}`
  }
  if (userId != null) {
    url += `&userId=${userId}`
  }
  if (createTimeStart != null) {
    url += `&createTimeStart=${createTimeStart}`
  }
  if (createTimeEnd != null) {
    url += `&createTimeEnd=${createTimeEnd}`
  }
  if (status != null) {
    url += `&status=[${status.toString()}]`
  }
  if (amountStart != null) {
    url += `&amountStart=${amountStart}`
  }
  if (amountEnd != null) {
    url += `&amountEnd=${amountEnd}`
  }
  if (timelineTypes != null) {
    url += `&timelineTypes=[${timelineTypes.toString()}]`
  }
  if (gatewayIds != null) {
    url += `&gatewayIds=[${gatewayIds.toString()}]`
  }
  try {
    const res = await request.get(url)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getPaymentDetailReq = async (
  paymentId: string,
  refreshCb: () => void
) => {
  try {
    const res = await request.get(
      `/merchant/payment/detail?paymentId=${paymentId}`
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.paymentDetail, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// -----------
export const getCountryListReq = async () => {
  const merchantStore = useMerchantInfoStore.getState()
  try {
    const res = await request.post(`/merchant/vat/country_list`, {
      merchantId: merchantStore.id
    })
    handleStatusCode(res.data.code)
    return [res.data.data.vatCountryList, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const extendDueDateReq = async (
  subscriptionId: string,
  appendTrialEndHour: number
) => {
  try {
    const res = await request.post(
      `/merchant/subscription/add_new_trial_start`,
      {
        subscriptionId,
        appendTrialEndHour
      }
    )
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getAdminNoteReq = async ({
  subscriptionId,
  page,
  count,
  refreshCb
}: {
  subscriptionId: string
  refreshCb?: () => void
} & PagedReq) => {
  try {
    const res = await request.post('/merchant/subscription/admin_note_list', {
      subscriptionId,
      page,
      count
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.noteLists, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const createAdminNoteReq = async ({
  subscriptionId,
  note
}: {
  subscriptionId: string
  note: string
}) => {
  const merchantStore = useMerchantInfoStore.getState()
  try {
    const res = await request.post('/merchant/subscription/new_admin_note', {
      subscriptionId,
      merchantMemberId: merchantStore.id,
      note
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getUserNoteReq = async ({
  userId,
  page,
  count,
  refreshCb
}: {
  userId: number
  refreshCb?: () => void
} & PagedReq) => {
  try {
    const res = await request.post('/merchant/user/admin_note_list', {
      userId,
      page,
      count
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.noteLists, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const createUserNoteReq = async ({
  userId,
  note
}: {
  userId: number
  note: string
}) => {
  try {
    const res = await request.post('/merchant/user/new_admin_note', {
      userId,
      note
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const setSimDateReq = async (
  subscriptionId: string,
  newTestClock: number
) => {
  try {
    const res = await request.post(`/system/subscription/test_clock_walk`, {
      subscriptionId,
      newTestClock
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getUserProfile = async (
  userId: number,
  refreshCb?: () => void
) => {
  try {
    const res = await request.get(`/merchant/user/get?userId=${userId}`)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.user, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// for Stripe, set another card as default payment card
export const changeUserPaymentMethodReq = async (
  userId: number,
  gatewayId: number,
  paymentMethodId: string
) => {
  try {
    const res = await request.post(`/merchant/user/change_gateway`, {
      userId,
      gatewayId,
      paymentMethodId
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const saveUserProfileReq = async (newProfile: IProfile) => {
  const u = JSON.parse(JSON.stringify(newProfile))
  u.userId = newProfile.id
  try {
    const res = await request.post(`/merchant/user/update`, u)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// for bank card user, get a list of cards
export const getUserPaymentMethodListReq = async ({
  userId,
  gatewayId
}: {
  userId: number
  gatewayId: number
}) => {
  try {
    const res = await request.get(
      `/merchant/payment/method_list?gatewayId=${gatewayId}&userId=${userId}`
    )
    handleStatusCode(res.data.code)
    return [res.data.data.methodList, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// for bank card user, remove a bank card
export const removeCardPaymentMethodReq = async ({
  userId,
  gatewayId,
  paymentMethodId
}: {
  userId: number
  gatewayId: number
  paymentMethodId: string
}) => {
  const body = { userId, gatewayId, paymentMethodId }
  try {
    const res = await request.post(`/merchant/payment/method_delete`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const suspendUserReq = async (userId: number) => {
  try {
    const res = await request.post(`/merchant/user/suspend_user`, { userId })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// not the same as user signup, this is for admin to create the user.
type TNewUserInfo = {
  externalUserId?: string
  email: string
  firstName?: string
  lastName?: string
  password?: string
  phone?: string
  address?: string
}
export const createNewUserReq = async (newUser: TNewUserInfo) => {
  try {
    const res = await request.post(`/merchant/user/new`, newUser)
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const appSearchReq = async (searchKey: string) => {
  try {
    const res = await request.post(`/merchant/search/key_search`, {
      searchKey
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TDiscountCodeQry = {
  status?: number[]
  billingType?: number[]
  discountType?: number[]
  createTimeStart?: number
  createTimeEnd?: number
} & PagedReq
export const getDiscountCodeListReq = async (
  params: TDiscountCodeQry,
  refreshCb?: () => void
) => {
  try {
    const res = await request.get('/merchant/discount/list', {
      params,
      paramsSerializer: serializeSearchParams
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getDiscountCodeDetailReq = async (codeId: number) => {
  try {
    const res = await request.get(`/merchant/discount/detail?id=${codeId}`)
    handleStatusCode(res.data.code)
    return [res.data.data.discount, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TDiscountUsageDetail = {
  id: number
  createTimeStart?: number
  createTimeEnd?: number
  refreshCb?: () => void
} & PagedReq
export const getDiscountCodeUsageDetailReq = async ({
  refreshCb,
  ...params
}: TDiscountUsageDetail) => {
  try {
    const res = await request.get('/merchant/discount/user_discount_list', {
      params,
      paramsSerializer: serializeSearchParams
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getDiscountCodeDetailWithMore = async (
  codeId: number,
  refreshCb: () => void
) => {
  const [[discount, errDiscount], [planList, errPlanList]] = await Promise.all([
    getDiscountCodeDetailReq(codeId),
    getPlanList({
      type: [PlanType.MAIN],
      status: [PlanStatus.ACTIVE],
      page: 0,
      count: 150
    })
  ])

  const err = errDiscount || errPlanList
  if (null != err) {
    if (err instanceof ExpiredError) {
      updateSessionCb(refreshCb)
    }
    return [null, err]
  }
  return [{ discount, planList }, null]
}

export const createDiscountCodeReq = async (body: DiscountCode) => {
  try {
    const res = await request.post(`/merchant/discount/new`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateDiscountCodeReq = async (body: DiscountCode) => {
  try {
    const res = await request.post(`/merchant/discount/edit`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const deleteDiscountCodeReq = async (id: number) => {
  try {
    const res = await request.post(`/merchant/discount/delete`, { id })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const toggleDiscountCodeActivateReq = async (
  id: number,
  action: 'activate' | 'deactivate'
) => {
  try {
    const res = await request.post(`/merchant/discount/${action}`, { id })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const applyDiscountPreviewReq = async (code: string, planId: number) => {
  try {
    const res = await request.post(`/merchant/discount/plan_apply_preview`, {
      code,
      planId
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// ----------
type TGetInvoicesReq = {
  userId?: number
  firstName?: string
  lastName?: string
  currency?: string
  status?: number[]
  amountStart?: number
  amountEnd?: number
} & PagedReq
export const getInvoiceListReq = async (
  body: TGetInvoicesReq,
  refreshCb?: () => void
) => {
  try {
    const res = await request.post(`/merchant/invoice/list`, body)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// ----------

export const getInvoiceDetailReq = async (
  invoiceId: string,
  refreshCb?: () => void
) => {
  try {
    const res = await request.post(`/merchant/invoice/detail`, {
      invoiceId
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// wire-transfer is totally offline, we can only rely on admin to do offline payment status check,
// then mark invoice as Paid.
export const markInvoiceAsPaidReq = async (
  invoiceId: string,
  reason: string,
  TransferNumber: string
) => {
  try {
    const res = await request.post(
      `/merchant/invoice/mark_wire_transfer_success`,
      {
        invoiceId,
        reason,
        TransferNumber
      }
    )
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// if wire-transfer payment need to be refunded, refund status also need to be marked manually.
// Same goes to Crypto. Many crypto gateway has no refund API, so admin need to manually refund the crypto, check its status,
// then manually mark refund as successful.
export const markRefundAsSucceedReq = async (
  invoiceId: string,
  reason: string
) => {
  try {
    const res = await request.post(`/merchant/invoice/mark_refund_success`, {
      invoiceId,
      reason
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// ------------
type TCreateInvoiceReq = {
  name: string
  userId: number
  currency: string
  taxPercentage: number
  invoiceItems: TInvoiceItems[]
  lines?: TInvoiceItems[]
  finish: boolean
}
type TInvoiceItems = {
  unitAmountExcludingTax: number
  description: string
  quantity: number
}
// admin manually create a draft invoice
export const createInvoiceReq = async (body: TCreateInvoiceReq) => {
  body.lines = body.invoiceItems
  try {
    const res = await request.post(`/merchant/invoice/new`, body)
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// -------------

// admin edit and save the draft invoice.
type TSaveInvoiceReq = {
  invoiceId: string
  taxPercentage: number
  currency: string
  name: string
  invoiceItems: TInvoiceItems[]
  lines?: TInvoiceItems[]
}
export const saveInvoiceReq = async (body: TSaveInvoiceReq) => {
  body.lines = body.invoiceItems
  try {
    const res = await request.post(`/merchant/invoice/edit`, body)
    handleStatusCode(res.data.code)
    return [null, null] // no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// admin can delete the invoice, before the following publishInvoice() is called
export const deleteInvoiceReq = async (invoiceId: string) => {
  try {
    const res = await request.post(`/merchant/invoice/delete`, {
      invoiceId
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// after publish, user will receive an email informing him/her to finish the payment.
// admin cannot edit it anymore, but can cancel it by calling the following revokeInvoice() before user finish the payment
type TPublishInvoiceReq = {
  invoiceId: string
  payMethod: number
  daysUtilDue: number
}
export const publishInvoiceReq = async (body: TPublishInvoiceReq) => {
  try {
    const res = await request.post(`/merchant/invoice/finish`, body)
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// admin can cancel the invoice(make it invalid) before user finish the payment.
export const revokeInvoiceReq = async (invoiceId: string) => {
  try {
    const res = await request.post(`/merchant/invoice/cancel`, {
      invoiceId
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const refundReq = async (body: {
  invoiceId: string
  refundAmount: number
  reason: string
}) => {
  try {
    const res = await request.post(`/merchant/invoice/refund`, body)
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const sendInvoiceInMailReq = async (invoiceId: string) => {
  try {
    const res = await request.post(`/merchant/invoice/send_email`, {
      invoiceId
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// ------------------
type TUserList = {
  merchantId: number
  userId?: number
  firstName?: string
  lastName?: string
  email?: string
  status?: number[]
  subStatus?: number[]
  planId?: number[]
  createTimeStart?: number
  createTimeEnd?: number
} & PagedReq
export const getUserListReq = async (
  users: TUserList,
  refreshCb?: () => void
) => {
  try {
    const res = await request.post(`/merchant/user/list`, users)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const importDataReq = async (file: File, task: TImportDataType) => {
  try {
    const res = await request.post(
      `/merchant/task/new_import`,
      { file, task },
      {
        headers: {
          'content-type': 'multipart/form-data'
        }
      }
    )
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// this is used when page is loading (as part of getMerchantUserListWithMoreReq), no search params available
// ??? I don't like this.
const getMerchantUserListReq = async (refreshCb?: () => void) => {
  try {
    const res = await request.get('/merchant/member/list?page=0&count=10')
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getMerchantUserListReq2 = async (
  { page, count, roleIds }: { roleIds?: number[] } & PagedReq,
  refreshCb?: () => void
) => {
  try {
    const res = await request.post('/merchant/member/list', {
      page,
      count,
      roleIds
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// merchant user list page need: userList and roleList.
export const getMerchantUserListWithMoreReq = async (refreshCb: () => void) => {
  const [
    [merchantUserListRes, errMerchantUserList],
    [roleListRes, errRoleList]
  ] = await Promise.all([getMerchantUserListReq(), getRoleListReq()])
  const err = errMerchantUserList || errRoleList
  if (null != err) {
    if (err instanceof ExpiredError) {
      updateSessionCb(refreshCb)
    }
    return [null, err]
  }
  return [{ merchantUserListRes, roleListRes }, null]
}

// invite other admin (with specified roles)
export const inviteMemberReq = async ({
  email,
  firstName,
  lastName,
  roleIds
}: {
  email: string
  firstName: string
  lastName: string
  roleIds: number[]
}) => {
  const body = { email, firstName, lastName, roleIds }
  try {
    const res = await request.post('/merchant/member/new_member', body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateMemberRolesReq = async ({
  memberId,
  roleIds
}: {
  memberId: number
  roleIds: number[]
}) => {
  const body = { memberId, roleIds }
  try {
    const res = await request.post('/merchant/member/update_member_role', body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const suspendMemberReq = async (memberId: number) => {
  try {
    const res = await request.post('/merchant/member/suspend_member', {
      memberId
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getMemberProfileReq = async (refreshCb?: () => void) => {
  try {
    const res = await request.get('/merchant/member/profile')
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// these are the gateways ready for payment(<PaymentSelector /> use this list)
export const getPaymentGatewayListReq = async () => {
  try {
    const res = await request.get(`/merchant/gateway/list`)
    handleStatusCode(res.data.code)
    return [res.data.data.gateways, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// all the gateways we have in BE, not everyone is ready for payment
export const getPaymentGatewayConfigListReq = async ({
  refreshCb
}: {
  refreshCb?: () => void
}) => {
  try {
    const res = await request.get(`/merchant/gateway/setup_list`)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.gateways, null, res.data.code]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e, -1]
  }
}

export const sortGatewayReq = async (
  sortObj: { gatewayName: string; gatewayId: number; sort: number }[],
  refreshCb?: () => void
) => {
  try {
    const res = await request.post(`/merchant/gateway/edit_sort`, {
      gatewaySorts: sortObj
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.gateways, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e, -1]
  }
}

/*
// depreciated
export const getAppKeysWithMore = async (refreshCb: () => void) => {
  const [[merchantInfo, errMerchantInfo], [gateways, errGateways]] =
    await Promise.all([getMerchantInfoReq(), getPaymentGatewayListReq()])
  const err = errMerchantInfo || errGateways
  if (null != err) {
    if (err instanceof ExpiredError) {
      session.setSession({
        expired: true,
        refreshCallbacks: update(session.refreshCallbacks, {
          $push: [refreshCb]
        }),
        refresh: refreshCb ?? null
      })
    }
    return [null, err]
  }
  return [{ merchantInfo, gateways }, null]
}
*/

type TWireTransferAccount = {
  gatewayId?: number // required only for updating
  currency: string
  minimumAmount: number
  bank: {
    accountHolder: string
    bic: string
    iban: string
    address: string
  }
}
export const createWireTransferAccountReq = async (
  body: TWireTransferAccount
) => {
  try {
    const res = await request.post(
      '/merchant/gateway/wire_transfer_setup',
      body
    )
    handleStatusCode(res.data.code)
    return [res.data.data.gateway, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateWireTransferAccountReq = async (
  body: TWireTransferAccount
) => {
  try {
    const res = await request.post('/merchant/gateway/wire_transfer_edit', body)
    handleStatusCode(res.data.code)
    return [res.data.data.gateway, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const segmentSetupReq = async (
  serverSideSecret: string,
  userPortalSecret: string
) => {
  try {
    const res = await request.post('/merchant/track/setup_segment', {
      serverSideSecret,
      userPortalSecret
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getEventListReq = async () => {
  try {
    const res = await request.get(`/merchant/webhook/event_list`)
    handleStatusCode(res.data.code)
    return [res.data.data.eventList, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getWebhookListReq = async (refreshCb?: () => void) => {
  try {
    const res = await request.get(`/merchant/webhook/endpoint_list`)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.endpointList, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// used for both creation and update
export const saveWebhookReq = async ({
  url,
  events,
  endpointId
}: {
  url: string
  events: string[]
  endpointId?: number
}) => {
  try {
    const actionUrl =
      endpointId == null
        ? '/merchant/webhook/new_endpoint'
        : '/merchant/webhook/update_endpoint'
    const body = {
      url,
      events,
      endpointId: endpointId === null ? undefined : endpointId
    }
    const res = await request.post(actionUrl, body)
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const deleteWebhookReq = async (endpointId: number) => {
  try {
    const res = await request.post('/merchant/webhook/delete_endpoint', {
      endpointId
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getWebhookLogs = async (
  { endpointId, page, count }: { endpointId: number } & PagedReq,
  refreshCb?: () => void
) => {
  try {
    const res = await request.get(
      `/merchant/webhook/endpoint_log_list?endpointId=${endpointId}&page=${page}&count=${count}`
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const resendWebhookEvt = async (logId: number) => {
  try {
    const res = await request.post(`/merchant/webhook/resend`, { logId })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getRoleListReq = async (refreshCb?: () => void) => {
  try {
    const res = await request.get(`/merchant/role/list`)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const saveRoleReq = async (role: TRole, isNew: boolean) => {
  try {
    const res = await request.post(
      `/merchant/role/${isNew ? 'new' : 'edit'}`,
      role
    )
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const deleteRoleReq = async (id: number) => {
  try {
    const res = await request.post(`/merchant/role/delete`, { id })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TActivityLogParams = {
  memberFirstName?: string
  memberLastName?: string
  memberEmail?: string
  firstName?: string
  lastName?: string
  email?: string
  subscriptionId?: string
  invoiceId?: string
  planId?: number
  discountCode?: number
} & PagedReq
export const getActivityLogsReq = async (
  searchTerm: TActivityLogParams,
  refreshCb?: () => void
) => {
  let term = ''
  for (const [key, value] of Object.entries(searchTerm)) {
    term += `${key}=${encodeURIComponent(value)}&`
  }
  term = term.substring(0, term.length - 1)
  try {
    const res = await request.get(`/merchant/member/operation_log_list?${term}`)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getDownloadListReq = async (
  page: number,
  count: number,
  refreshCb?: () => void
) => {
  try {
    const res = await request.get(
      `/merchant/task/list?page=${page}&count=${count}`
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const exportDataReq = async ({
  task,
  payload,
  exportColumns,
  format
}: {
  task: TExportDataType
  payload: unknown
  exportColumns?: string[]
  format?: 'xlsx' | 'csv'
}) => {
  try {
    const res = await request.post(`/merchant/task/new_export`, {
      task,
      payload,
      exportColumns,
      format
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getExportTmplReq = async ({
  task,
  page,
  count
}: {
  task: TExportDataType
} & PagedReq) => {
  try {
    const res = await request.post(`/merchant/task/export_template_list`, {
      task,
      page,
      count
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// 'creating new' and 'editing existing' share almost the same parameter, use templateId == null to check
export const saveExportTmplReq = async ({
  name,
  templateId,
  task,
  payload,
  exportColumns,
  format
}: {
  name: string
  templateId?: number
  task: TExportDataType
  payload?: unknown
  exportColumns?: string[]
  format?: 'xlsx' | 'csv'
}) => {
  let url = '/merchant/task/'
  url += templateId == null ? 'new_export_template' : 'edit_export_template'
  try {
    const res = await request.post(url, {
      name,
      templateId,
      task,
      payload,
      exportColumns,
      format
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const removeExportTmplReq = async ({
  templateId
}: {
  templateId: number
}) => {
  try {
    const res = await request.post(`/merchant/task/delete_export_template`, {
      templateId
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getProductListReq = async ({
  count,
  page,
  refreshCb
}: {
  refreshCb?: () => void
} & PagedReq) => {
  try {
    const res = await request.post(`/merchant/product/list`, {
      count: count ?? 100,
      page: page ?? 0
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const saveProductReq = async ({
  productId,
  productName,
  description
}: {
  productId?: number
  productName: string
  description: string
}) => {
  const isNew = productId == null
  const url = `/merchant/product/${isNew ? 'new' : 'edit'}`
  const body = {
    productName,
    description,
    productId: !isNew ? productId : undefined
  }
  try {
    const res = await request.post(url, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const deleteProductReq = async (productId: number) => {
  try {
    const res = await request.post(`/merchant/product/delete`, {
      productId
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getProductDetailReq = async (productId: number) => {
  try {
    const res = await request.post(
      `/merchant/product/detail?productId=${productId}`,
      {
        productId
      }
    )
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TGetCreditConfigList = {
  types: CreditType[]
  currency: string
}
export const getCreditConfigListReq = async (
  body: TGetCreditConfigList,
  refreshCb?: () => void
) => {
  try {
    const res = await request.post(`/merchant/credit/config_list`, body)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.creditConfigs, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// create new credit config (global setting)
export const createCreditConfigReq = async (c: TCreditConfig) => {
  try {
    const res = await request.post(`/merchant/credit/new_config`, c)
    handleStatusCode(res.data.code)
    return [res.data.data.creditConfig, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// save changes for an existing credit config (global setting)
export const saveCreditConfigReq = async ({
  merchantId,
  type,
  currency,
  key,
  value
}: {
  merchantId: number
  type: CreditType
  currency: string
  key: string
  value: string | number | boolean
}) => {
  try {
    const res = await request.post(`/merchant/credit/edit_config`, {
      merchantId,
      type,
      currency,
      [key]: value
    })
    handleStatusCode(res.data.code)
    return [res.data.data.creditConfig, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// save credit config changes for single user
export const saveUserCreditConfigReq = async () => {
  try {
    const res = await request.post(`/merchant/credit/edit_credit_account`, {})
    handleStatusCode(res.data.code)
    return [res.data.data.UserCreditAccount, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export type TCreditTxParams = {
  accountType: CreditType
  userId?: number
  email?: string
  currency?: string
  transactionTypes?: CreditTxType[]
  createTimeStart?: number
  createTimeEnd?: number
  sortType?: 'desc' | 'asc'
  sortField?: 'gmt_create' | 'gmt_modify' // Default is gmt_modify
} & PagedReq
export const getCreditTxListReq = async (
  body: TCreditTxParams,
  refreshCb?: () => void
) => {
  try {
    const res = await request.post(
      `/merchant/credit/credit_transaction_list`,
      body
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getCreditUsageStatReq = async (currency: string) => {
  try {
    const res = await request.post(
      `/merchant/credit/get_promo_config_statistics`,
      { currency }
    )
    handleStatusCode(res.data.code)
    return [res.data.data.creditConfigStatistics, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const toggleUserCreditReq = async (id: number, payoutEnable: 1 | 0) => {
  try {
    const res = await request.post(`/merchant/credit/edit_credit_account`, {
      id,
      payoutEnable
    })
    handleStatusCode(res.data.code)
    return [res.data.data.UserCreditAccount, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateCreditAmtReq = async ({
  action,
  userId,
  currency,
  amount,
  description
}: {
  action: 'increment' | 'decrement'
  userId: number
  currency: string
  amount: number
  description: string
}) => {
  let url = '/merchant/credit/'
  url +=
    action == 'increment' ? 'promo_credit_increment' : 'promo_credit_decrement'
  try {
    const res = await request.post(url, {
      userId,
      currency,
      amount,
      description
    })
    handleStatusCode(res.data.code)
    return [res.data.data.UserPromoCreditAccount, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getRevenueReq = async () => {
  try {
    const res = await analyticsRequest.get('/revenue')
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateMemberProfileReq = async (body: {
  firstName: string
  lastName: string
  mobile: string
}) => {
  try {
    const res = await request.post('/merchant/member/update', body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}