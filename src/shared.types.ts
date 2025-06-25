// this is logged-in user' profile
import { Dayjs } from 'dayjs'
import { Currency } from 'dinero.js'
import { DISCOUNT_CODE_UPGRADE_SCOPE } from './components/discountCode/helpers'

export const enum AccountType {
  NONE = 0,
  PERSONAL = 1,
  BUSINESS = 2
}

export type WithStyle<T> = T & {
  className?: string
}
export type ListReqType = {
  page?: number
  count?: number
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type BareStyleProps = WithStyle<{}>

export type WithDoubleConfirmFields<T> = {
  confirmTotalAmount: number
  confirmCurrency: string
} & T

export type TPromoAccount = {
  id: number
  userId: number
  type: CreditType
  currency: string
  amount: number // current balance
  exchangeRate: number
  totalIncrementAmount: number // total added
  totalDecrementAmount: number // total used
  currencyAmount: number
  payoutEnable: boolean | 1 | 0
  rechargeEnable: boolean | 1 | 0
  createTime: number
}

export const enum UserStatus {
  ACTIVE = 0,
  SUSPENDED = 2
}
// this is end user profile
interface IProfile {
  id: number | null
  externalUserId: string
  token: string
  firstName: string
  lastName: string
  email: string
  type: AccountType
  status: UserStatus
  taxPercentage: number
  isOwner: boolean
  merchantId: number
  promoCreditAccounts?: TPromoAccount[]
  gatewayId?: number // after a successful payment, the payment gateway is saved as default. This is null for newly registered user.
  gateway?: TGateway // ditto.
  paymentMethod: string // for card payment, this is the stripe paymentId, used for auto recurring payment
  gatewayPaymentType: string // some gateways like Payssion has subgateways(named paymentTypes in BE).
  zipCode: string
  address: string
  city: string
  phone: string
  mobile: string
  countryCode: string
  countryName: string
  companyName: string
  vATNumber: string // company account only
  registrationNumber: string // company account only
  language: string // en | ru | cn | vi | pt,      English | Russian | Chinese | Vietnamese | Portuguese
  facebook: string
  linkedIn: string
  telegram: string
  tikTok: string
  weChat: string
  whatsAPP: string
  otherSocialInfo: string
  createTime: number
}

export const enum MerchantUserStatus {
  ACTIVE = 0,
  SUSPENDED = 2
}
// this is the admin user profile
interface IMerchantMemberProfile {
  id: number
  merchantId: number
  email: string
  firstName: string
  lastName: string
  createTime: number
  mobile: string
  isOwner: boolean
  status: MerchantUserStatus
  MemberRoles: TRole[]
}

type TMerchantInfo = {
  id: number
  address: string
  companyId: string
  companyLogo: string
  companyName: string
  email: string
  location: string
  phone: string
}

type Country = {
  code: string
  name: string
}

export type TIntegrationKeys = {
  openApiKey: string // UniBee API key
  sendGridKey: string
  vatSenseKey: string
  exchangeRateApiKey: string // money exchange rate service provider key
  segmentServerSideKey: string
  segmentUserPortalKey: string
}

export type CURRENCY = { Currency: Currency; Symbol: string; Scale: number }
// { Currency: 'CNY', Symbol: '¥', Scale: 100 }, or
// { Currency: 'USD', Symbol: '$', Scale: 100 }, ...
interface IAppConfig {
  env: string
  isProd: boolean
  supportTimeZone: string[]
  supportCurrency: CURRENCY[]
  currency: Partial<Record<Currency, CURRENCY>> // this is just the record version of supportCurrency for easier lookup, key is currency code, like 'CNY', 'USD', ...
  // its initial value is empty, hence Partial here. Maybe it's better to provide a default value, like: EUR: { Currency: 'EUR', Symbol: '€', Scale: 100 },
  gateway: TGateway[]
  taskListOpen: boolean // task list is in app.tsx, but this value is accessible to all pages.
  integrationKeys: TIntegrationKeys
}

interface IAddon extends IPlan {
  quantity: number | null
  checked: boolean
}

interface IProduct {
  id: number
  productName: string
  description: string
  status: number // ，1-active，2-inactive, default active
  metaData: string // json string
  createTime: number
  isDeleted: number
}

export enum PlanType {
  MAIN = 1,
  ADD_ON = 2, // must be used with MAIN, cannot be bought alone
  ONE_TIME_ADD_ON = 3 // can be bought alone, has no dependencies on anything
}

export enum PlanStatus {
  EDITING = 1,
  ACTIVE = 2,
  INACTIVE = 3,
  SOFT_ARCHIVED = 4,
  HARD_ARCHIVED = 5
}
export const enum PlanPublishStatus {
  UNPUBLISHED = 1, // on UserPortal, use this flag to hide unpublished plans
  PUBLISHED = 2
}
export type MetricGraduatedAmount = {
  localId: string // not exist in BE, only for easy array manipulation in FE. localId in all other data structure are all for this purpose.
  perAmount: number | null
  startValue: number | null
  endValue: number | null
  flatAmount: number | null
}
export type MetricLimits = {
  localId: string
  metricId: number | null
  metricLimit: number | null
  graduatedAmounts?: MetricGraduatedAmount[] // this prop is not needed in business sense, its existence is only for TS type checking. I want to handle MetricLimits and MetricMeteredCharge in the same way.
  expanded?: boolean // not exist in BE, not exist in business sense, just for easy type checking.
}
export const enum MetricChargeType {
  STANDARD = 0,
  GRADUATED = 1
}
export type MetricMeteredCharge = {
  localId: string
  metricId: number | null
  chargeType: MetricChargeType
  standardAmount: number | null
  standardStartValue: number | null
  graduatedAmounts: MetricGraduatedAmount[]
  expanded?: boolean // not exist in BE, only for UI display. If true, and chargeType == GRADUATED: graduatedAmounts are expanded for user to update, false: collapsed.
}

interface IPlan {
  id: number
  plan?: IPlan
  externalPlanId?: '' // used for subscription import, the to-be-imported active sub need to bind to a plan.
  planName: string
  internalName: string
  description: string
  type: PlanType // 1: main plan, 2: add-on, 3: one-time addon
  currency: Currency
  intervalCount: number
  intervalUnit: string
  amount: number
  status: PlanStatus
  publishStatus: PlanPublishStatus
  addons?: IAddon[]
  addonIds?: number[] // which addons have been attached to this plan.
  onetimeAddonIds?: number[] // which one-time payment addons have been attached to this plan (main plan only)
  metricPlanLimits?: { metricId: number; metricLimit: number }[]
  // -- billable metrics related fields
  metricLimits?: MetricLimits[]
  metricMeteredCharge?: MetricMeteredCharge[] // they shared the same structure.
  metricRecurringCharge?: MetricMeteredCharge[]
  // --
  metadata?: string
  createTime: number
  companyId: number
  merchantId: number
  enableTrial?: boolean
  trialAmount?: number
  trialDurationTime?: number
  trialDemand?: 'paymentMethod' | '' | boolean // backend requires this field to be a fixed string of 'paymentMethod' or '', but to ease the UX, front-end use <Switch />
  cancelAtTrialEnd?: 0 | 1 | boolean // backend requires this field to be a number of 1 | 0, but to ease the UX, front-end use <Switch />
  productId: number
  product: IProduct
}

export interface ISubAddon extends IPlan {
  // when update subscription plan, I need to know which addons users have selected,
  // then apply them on the plan
  quantity: number
  addonPlanId: number
  addonPlan: ISubAddon
}

export const enum MetricType {
  LIMIT_METERED = 1,
  CHARGE_METERED = 2,
  CHARGE_RECURRING = 3
}

export const enum MetricAggregationType {
  COUNT = 1,
  COUNT_UNIQUE = 2,
  LATEST = 3,
  MAX = 4,
  SUM = 5
}
interface IBillableMetrics {
  id: number
  MetricId: number // same as id, they are the same.
  merchantId: number
  code: string
  metricName: string
  metricDescription: string
  type: MetricType
  aggregationType: MetricAggregationType
  aggregationProperty: string
  gmtModify: string
  createTime: string
}

export interface LimitMetricUsage {
  metricLimit: IBillableMetrics & { TotalLimit: number }
  CurrentUsedValue: number
}

export interface ChargedMetricUsage {
  isRecurring: boolean
  // metricLimit: IBillableMetrics & { TotalLimit: number }
  merchantMetric: IBillableMetrics
  CurrentUsedValue: number
  totalChargeAmount: number
  // graduatedStep
  chargePricing: MetricMeteredCharge
}

export interface SubscriptionWrapper extends ISubscriptionType {
  subscription: ISubscriptionType
}

export enum SubscriptionStatus {
  INITIATING = 0, // used when creating the sub, it only exist for a very short time, user might not realize it existed
  PENDING = 1, // when sub is created, but user hasn't paid yet.
  ACTIVE = 2, // 2: active: user paid the sub fee
  // PendingInActive = 3, // when status is transitioning from 1 to 2, or 2 to 4, there is a pending status, it's not synchronous
  // so we have to wait, in status 3: no action can be taken on UI.
  CANCELLED = 4, // users(or admin) cancelled the sub(immediately or automatically at the end of billing cycle). It's triggered by human.
  EXPIRED = 5,
  // SUSPENDED = 6, // suspend for a while, might want to resume later. NOT USED YET.
  INCOMPLETE = 7, // user claimed they have wired the transfer, admin mark the subscription as Incomplete until a DATE, so user can use it before that DATE.
  // if admin had confirmed the transfer, admin has to mark the corresponding invoice as PAID, then this sub will become ACTIVE.
  PROCESSING = 8, // user claimed they have wired the transfer, but we're checking. This status is for wire-transfer only.
  FAILED = 9 // we have't received the payment.
}

interface ISubscriptionType {
  id: number
  subscriptionId: string
  planId: number
  productId: number
  userId: number
  status: SubscriptionStatus
  firstPaidTime: number
  currentPeriodStart: number
  currentPeriodEnd: number
  defaultPaymentMethodId: string
  trialEnd: number // if it's non-zero (seconds from Epoch): subscription'll end on that date(it should be >= currentPeriodEnd)
  // it's used by admin to extend the next due date.
  cancelAtPeriodEnd: number // whether this sub will end at the end of billing cycle, 0: false, 1: true
  amount: number
  currency: string
  taxPercentage: number // BE returns 2000, UI need to show 20%.
  plan: IPlan | undefined // ?????????? why it can be undefined.
  addons: ISubAddon[]
  user: IProfile | null
  testClock?: number
  unfinishedSubscriptionPendingUpdate?: {
    // downgrading will be effective on the next cycle, this props show this pending stat
    effectImmediate: number
    effectTime: number
    prorationAmount: number // for plan upgrading, you need to pay the difference amt.
    paid: number // 1: paid,
    link: string // stripe payment link
    plan: IPlan // original plan
    updatePlan: IPlan // plan after change(upgrade/downgrade, or quantity change)
    // these are pending subscription's actual data
    updateAmount: number
    updateCurrency: string
    updateAddons: ISubAddon[]
    note: string
  }
  gatewayId: number
  latestInvoice?: UserInvoice
}
export const enum SubscriptionEndMode {
  END_NOW = 1,
  END_AT_END_OF_BILLING_CYCLE = 2
}

export const enum SubscriptionHistoryStatus {
  // UNKNOWN_ZERO = 0,
  Active = 1, // current active subscription also show up in history list
  Finished = 2, // when user upgrade from planA to planB, the old subscription with plan A will be marked as finished.
  Cancelled = 3,
  Expired = 4
  //UNKNOWN_FIVE = 5
}

interface ISubHistoryItem {
  merchantId: number
  userId: number
  subscriptionId: string
  status: SubscriptionHistoryStatus
  periodStart: number
  periodEnd: number
  invoiceId: string
  uniqueId: string
  currency: string
  planId: number
  plan: IPlan
  quantity: number
  addons: { quantity: number; addonPlan: IPlan }[]
  gatewayId: number
  createTime: number
}

type IOneTimeHistoryItem = {
  id: number
  bizType: number
  merchantId: number
  userId: number
  subscriptionId: string
  invoiceId: string
  uniqueId: string
  currency: string
  amount: number
  unitAmount: number
  quantity: number
  paymentId: string
  status: number
  createTime: number
  description: string
  name: string
}

type IPreview = {
  totalAmount: number
  currency: string
  discount: DiscountCode
  discountAmount: number
  discountMessage: string // this should be named as 'discountErrorMessage', non empty means: something wrong with this discount code, and you cannot use it.
  applyPromoCredit: boolean
  prorationDate: number
  invoice: Invoice
  nextPeriodInvoice: Invoice
}
export const enum DiscountType {
  PERCENTAGE = 1,
  AMOUNT = 2
}
export const enum DiscountCodeBillingType {
  ONE_TIME = 1,
  RECURRING = 2
}
export const enum DiscountCodeStatus {
  EDITING = 1,
  ACTIVE = 2,
  INACTIVE = 3,
  EXPIRED = 4,
  ARCHIVED = 10
}
export const enum DiscountCodeApplyType {
  ALL = 0,
  SELECTED = 1,
  NOT_SELECTED = 2,
  APPLY_TO_PLANS_BY_BILLING_PERIOD = 3,
  APPLY_TO_PLANS_EXCEPT_BY_BILLING_PERIOD = 4
}
export const enum DiscountCodeUserScope {
  ALL_USERS = 0, // all users can use this code
  NEW_USERS = 1, // only new users can use this code
  RENEWAL_USERS = 2 // only for subscription renewal
}
type PlanApplyGroup = {
  groupPlanIntervalSelector?: {
    intervalUnit: 'month' | 'year'
    intervalCount: number
  }[]
}
type DiscountCode = {
  id?: number
  merchantId: number
  name: string
  code: string
  status: DiscountCodeStatus
  billingType: DiscountCodeBillingType
  discountType: DiscountType
  discountAmount: number
  discountPercentage: number
  currency: Currency
  cycleLimit: number
  startTime: number
  endTime: number
  validityRange: [Dayjs | null, Dayjs | null]
  createTime?: number
  planApplyType: DiscountCodeApplyType
  planIds?: number[] // this code applies to these plan only
  planApplyGroup?: PlanApplyGroup
  quantity: number
  liveQuantity: number // remaining quantity
  quantityUsed: number // used quantity
  metadata?: {
    [key: string]: string
  }
  advance: boolean // enable advanced configuration
  userScope: DiscountCodeUserScope
  userLimit: number | boolean // how many time the same user can use this code. 0: unlimited, 1: once.
  // Only 1, 0 are used in current release(need to convert to bool on FE, it's a switch). Number type is for future requirement change(100: same user can use 100 times).

  upgradeScope?: DISCOUNT_CODE_UPGRADE_SCOPE // upgrade can be applied to longer plan upgrade only(monthly to annually) or plan amt upgrade only(same recurring cycle but more amount)
  // or can be used in both the above cases. In this case, the below 2 options must be false.
  // 'upgradeScope' doesn't exist in BE, in FE, a radio group is rendered to represent these 3 options.
  upgradeOnly: boolean // code use for subscription upgrade(with more payment amount regardless of from which plan upgrade to which plan)
  upgradeLongerOnly: boolean // code use for long plan subscription upgrade(from monthly to yearly)
}

export const enum DiscountCodeUsageStatus {
  FINISHED = 1,
  ROLLBACK
}

type DiscountCodeUsage = {
  id: number
  merchantId: number
  user: IProfile
  code: string
  plan: IPlan
  subscriptionId: string
  paymentId: string
  invoiceId: string
  createTime: number
  applyAmount: number
  currency: string
  status: DiscountCodeUsageStatus
}

type TransactionItem = {
  gateway: TGateway
  invoice: UserInvoice
  payment: PaymentItem
  user: IProfile
}

export const enum PaymentStatus {
  PENDING = 0,
  SUCCEEDED = 1,
  FAILED = 2,
  CANCELLED = 3
}

// payment can go bi-directional, user -> merchant: payment, merchant -> user: refund
export const enum PaymentTimelineType {
  PAYMENT = 0,
  REFUND = 1
}

// used in transaction list (/merchant/payment/timeline/list)
// this list was originally called 'payment list' on UI, no need to rename it here.
type PaymentItem = {
  id: number
  transactionId: string
  externalTransactionId: string
  merchantId: number
  userId: number
  subscriptionId: string
  invoiceId: string
  currency: string
  totalAmount: number
  gatewayId: number
  paymentId: string
  payment: {
    externalPaymentId: string
    authorizeReason: string
    authorizeStatus: number
    failureReason: string
    invoiceId: string // if this is a refund payment, this invoiceId is the original invoice based on which this refund is created
  }
  refund?: TRefund
  status: PaymentStatus
  timelineType: PaymentTimelineType
  createTime: number
}

type InvoiceItem = {
  id?: string // when creating new invoice, list needs an id for each row, but backend response has no id.
  amount: number | string // when admin creating an invoice, inputbox value is string.
  amountExcludingTax: number | string
  currency: string
  description: string
  periodEnd?: number
  periodStart?: number
  proration?: boolean
  quantity: number | string
  tax: number | string // tax amount,
  taxPercentage: number | string // tax rate. Admin can manually create an invoice, in this case, tax percentage is a <Input /> value, hence the string type.
  // when the invoice is generated from backend, it's always number.
  unitAmountExcludingTax: number | string
  discountAmount: number
  originAmount?: number
}

// when admin update user subscription, this Invoice is part of the response
// when admin change user's plan, assign a plan, the preview req will return this as part of the response
type Invoice = {
  currency: string
  subscriptionAmount: number
  subscriptionAmountExcludingTax: number
  discountAmount: number
  taxAmount: number
  taxPercentage: number
  totalAmount: number
  totalAmountExcludingTax: number
  promoCreditAccount: TPromoAccount | null // null when promoCredit not used
  promoCreditDiscountAmount: number // 0 when not promoCredit not used
  promoCreditPayout: {
    creditAmount: number
    currencyAmount: number
    exchangeRate: number
  } | null // null when promoCredit not used
  lines: InvoiceItem[]
}

export const enum RefundStatus {
  AWAITING_REFUND = 10,
  REFUNDED = 20,
  FAILED = 30,
  CANCELLED = 40
}

type TRefund = {
  currency: string
  refundAmount: number
  refundComment: string
  refundTime: number
  createTime: number
  status: RefundStatus
  gatewayId: number
  paymentId: string
  invoiceId: string
}

export const enum InvoiceBizType {
  ONE_TIME = 1,
  MANUALLY_CREATED = 2,
  SUBSCRIPTION = 3
}

export const enum InvoiceStatus {
  INITIATING = 0, // this status only exist for a very short period, users/admin won't even know it exist
  DRAFT = 1, // admin manually create an invoice, for edit/delete, but users won't receive this invoice.
  AWAITING_PAYMENT = 2, // admin has clicked the 'create' button in invoice editing modal, user will receive a mail with payment link. Admin can revoke the invoice if user hasn't made the payment.
  PAID = 3, // user paid the invoice
  FAILED = 4, // user not pay the invoice before it get expired
  CANCELLED = 5, // admin cancel the invoice after publishing, only if user hasn't paid yet. If user has paid, admin cannot cancel it.
  REVERSED = 6 // 取消后被通知支付成功的，这种情况一般是要排查的
}
type UserInvoice = {
  id: number
  merchantId: number
  userId: number
  bizType: InvoiceBizType
  subscriptionId: string
  invoiceId: string
  invoiceName: string
  gatewayInvoiceId: string
  uniqueId: string
  createTime: number
  createFrom: string
  originAmount?: number
  discountAmount: number
  discount?: DiscountCode
  promoCreditDiscountAmount: number
  promoCreditTransaction?: TCreditTx
  totalAmount: number
  taxAmount: number
  subscriptionAmount: number
  currency: string
  lines: InvoiceItem[]
  status: InvoiceStatus
  sendStatus: number
  sendEmail: string
  sendPdf: string
  data: string
  isDeleted: number
  link: string
  gateway: TGateway
  gatewayId: number
  gatewayStatus: string
  gatewayPaymentId: string
  gatewayUserId: string
  gatewayInvoicePdf: string
  taxPercentage: number
  sendNote: string
  sendTerms: string
  totalAmountExcludingTax: number
  subscriptionAmountExcludingTax: number
  periodStart: number
  periodEnd: number
  paymentId: string
  payment?: {
    paidTime: number
    paymentAmount: number
    paymentId: string
    invoiceId: string // for refund invoice, this is the original invoice, based on which this refund invoice is created
  }
  refundId: string
  refund?: TRefund //
  userAccount: IProfile
  subscription?: ISubscriptionType
}

type TInvoicePerm = {
  editable: boolean // in list view, can I click the record, and open a Modal to edit it
  savable: boolean // in Modal, can I click save (save a newly created invoice, not yet publish)
  creatable: boolean // in Modal, can I click create, to create an invoice.
  publishable: boolean // in Modal, can I click 'publish', after publish, user can see it and receive a mail with payment link
  revokable: boolean // the opposite of publish, if user hasn't paid the invoice within *** days, admin can revoke it. But if user has paid, admin cannot revoke it.
  deletable: boolean // in list view, can I click the delete icon, only manually created invoice, and before publish
  refundable: boolean // in list view, can I click the refund icon
  downloadable: boolean // download invoice, true: for all system-generated invoice, and amdin manually generated(only after publish)
  sendable: boolean // send invoice via email, ditto
  asRefundedMarkable?: boolean
  asPaidMarkable?: boolean
}

type TAdminNote = {
  id: number
  firstName: string
  lastName: string
  createTime: number
  note: string
}

type TUserNote = {
  id: number
  createTime: number
  note: string
  userId: number
  userAccount: IProfile
  merchantMemberId: number
  merchantMember: IMerchantMemberProfile
}

type TWebhook = {
  id: number
  merchantId: number
  webhookUrl: string
  webhookEvents: string[]
  gmtModify: number
  createTime: number
}

type TWebhookLogs = {
  id: number
  merchantId: number
  endpointId: number
  webhookUrl: string
  webhookEvent: string
  requestId: string
  body: string
  response: string
  mamo: string
  gmtCreate: string
  gmtModify: string
  createTime: 0
}

export type TGatewayExRate = {
  localId?: string
  from_currency: string
  to_currency: string
  exchange_rate: number
}
export type GatewayPaymentType = {
  autoCharge: boolean
  category: string
  countryName: string
  name: string
  paymentType: string
}
export enum GatewayType {
  BANK_CARD = 1,
  CRYPTO = 2,
  WIRE_TRANSFER = 3
}
type TGateway = {
  IsSetupFinished: boolean // true: this gateway is ready for use
  archive: boolean
  gatewayId: number // == 0: totally new gateway, admin hasn't configured anything yet.
  // as long as admin has configured something, even just the displayName or icons, gatewayId will become non-zero, but this doesn't mean this gateway is ready for use.
  gatewayPaymentTypes?: GatewayPaymentType[] // this is the list of payment types that are actually configured for this container gateway. It's only useful when setupGatewayPaymentTypes is not empty.
  id?: string // to make configItem sortable, SortableItem component needs an unique id field. gatewayConfig has gatewayId, but it's 0 if not configured. This 'id' is totally local.
  name: string // e.g., Stripe
  description: string
  gatewayKey: string // public key(desensitized)
  gatewaySecret: string // private key(desensitized)
  gatewayName: string // e.g., stripe.
  displayName: string // e.g., Bank Cards
  publicKeyName: string
  privateSecretName: string
  setupGatewayPaymentTypes?: GatewayPaymentType[] // some gateways are just a container(e.g., Payssion), the actual gateways are defined in setupGatewayPaymentTypes. This is the list of all possible subgateways types.
  subGateway: string
  subGatewayName: string
  gatewayLogo: string
  gatewayIcons: string[]
  gatewayType: GatewayType
  gatewayWebsiteLink: string
  webhookEndpointUrl: string
  webhookIntegrationLink: string
  webhookSecret: string // this is the public key(generated by Changelly), used to ensure the sender can be trusted
  createTime: number
  currencyExchangeEnabled: boolean // some gateways like Unitpay required exchange rate setting, like 1 euro = 102 Russian Rubles, 1$ = 98.027243 Russian Rubles
  currencyExchange: TGatewayExRate[] | null // exchange_rate == 0 means: BE'd go to https://app.exchangerate-api.com/ to get exchange rate.
  minimumAmount: number // wire transfer only
  currency: string // ditto
  bank?: {
    // ditto
    accountHolder: string
    bic: string
    iban: string
    address: string
  }
  sort: number
}

export type TRolePermission = {
  group: string
  permissions: string[]
}

export type TRole = {
  id?: number
  localId: string
  createTime?: number
  merchantId?: number
  role: string
  permissions: TRolePermission[]
}

export type TActivityLogs = {
  id: number
  merchantId: number
  memberId: number
  optTarget: string
  optContent: string
  createTime: number
  subscriptionId: string
  userId: number
  invoiceId: string
  planId: number
  discountCode: string
  member: IMerchantMemberProfile[]
}

export const enum CreditType {
  MAIN = 1, // main, rechargeable
  PROMO_CREDIT = 2 // promo credit account
}

export type TCreditConfig = {
  id?: number // when saving a creditConfig, backend doesn't require an id.
  merchantId: number
  createTime: number
  name: string
  description: string
  type: CreditType
  currency: string
  exchangeRate: number | string // in FE, it's shown in an <input />, so it has to be string
  payoutEnable: 0 | 1 | boolean // 1 | 0 (bool like), global switch to enable/disable credit use
  discountCodeExclusive: 0 | 1 | boolean // 1 | 0(bool like), allow credit and discount be used together
  recurring: 0 | 1 | boolean
  rechargeEnable: 0 | 1 | boolean // bool like, only used for type: 1
  previewDefaultUsed: 0 | 1 | boolean // 1(used) | 0(not used), bool like. in purchase preview, if not specified whether or not use credit, this default value is assumed.
}

export type TCreditTx = {
  id: number
  user: IProfile
  creditAccount: TPromoAccount
  accountType: CreditType
  currency: string
  transactionId: string
  transactionType: CreditTxType
  creditAmountAfter: number
  creditAmountBefore: number
  deltaAmount: number
  deltaCurrencyAmount: number
  bizId: string
  name: string
  description: string
  createTime: number
  merchantId: number
  invoiceId: string
  adminMember?: IMerchantMemberProfile
  by: string // if credit amt is updated by admin, adminMember is not null. if amt is updated by user themselves(consumed, earned or other methods), this field is not empty.
}

export const enum CreditTxType {
  TOP_UP = 1,
  CONSUMPTION = 2,
  FROM_REFUND = 3,
  WITHDRAWN = 4,
  WITHDRAWN_FAILED = 5,
  ADMIN_CHANGE = 6,
  DEPOSIT_REFUND = 7
}

export type AppTask = {
  id: number
  merchantId: number
  memberId: number
  taskName: TExportDataType
  payload: string
  downloadUrl: string
  uploadFileUrl: string
  status: AppTaskStatus
  startTime: number
  finishTime: number
  failureReason: string
  taskCost: number
  format: 'xlsx' | 'csv'
}
export const enum AppTaskStatus {
  QUEUED = 0,
  RUNNING = 1,
  SUCCEEDED = 2,
  FAILED = 3
}

export type TExportDataType =
  | 'InvoiceExport'
  | 'UserExport'
  | 'TransactionExport'
  | 'SubscriptionExport'
  | 'UserDiscountExport'
  | 'DiscountExport'
  | 'UserDiscountExport'
  | 'MultiUserDiscountExport'
  | 'CreditTransactionExport'

export type TImportDataType =
  | 'UserImport'
  | 'ActiveSubscriptionImport'
  | 'HistorySubscriptionImport'

export class ExpiredError extends Error {
  constructor(m: string) {
    super(m)
  }
}

export type {
  Country,
  DiscountCode,
  DiscountCodeUsage,
  IAddon,
  IAppConfig,
  IBillableMetrics,
  IMerchantMemberProfile,
  Invoice,
  InvoiceItem,
  IOneTimeHistoryItem,
  IPlan,
  IPreview,
  IProduct,
  IProfile,
  ISubHistoryItem,
  ISubscriptionType,
  PaymentItem,
  TAdminNote,
  TGateway,
  TInvoicePerm,
  TMerchantInfo,
  TransactionItem,
  TRefund,
  TUserNote,
  TWebhook,
  TWebhookLogs,
  UserInvoice
}
