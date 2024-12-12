// this is logged-in user' profile
import { Dayjs } from 'dayjs'
import { Currency } from 'dinero.js'

export enum AccountType {
  NONE,
  PERSONAL,
  BUSINESS
}

export type WithStyle<T> = T & {
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type BareStyleProps = WithStyle<{}>

export type WithDoubleConfirmFields<T> = {
  confirmTotalAmount: number
  confirmCurrency: string
} & T

// this is end user profile
interface IProfile {
  zipCode: string
  address: string
  city: string
  countryCode: string
  countryName: string
  companyName: string
  email: string
  MemberRoles: TRole[]
  isOwner: boolean
  merchantId: number
  createTime: number
  facebook: string
  firstName: string
  lastName: string
  id: number | null
  externalUserId: string
  type: AccountType
  status: number // 0-Active, 2-Frozen
  phone: string
  mobile: string
  paymentMethod: string // for card payment, this is the stripe paymentId, used for auto recurring payment
  gatewayId?: number // after a successful payment, the payment gateway is saved as default. This is null for newly registered user.
  gateway?: TGateway // ditto.
  linkedIn: string
  telegram: string
  tikTok: string
  vATNumber: string
  registrationNumber: string
  weChat: string
  whatsAPP: string
  otherSocialInfo: string
  token: string
  language: string // en | ru | cn | vi | pt,      English | Russian | Chinese | Vietnamese | Portuguese
}

// this is admin profile
interface IMerchantMemberProfile {
  id: number
  merchantId: number
  email: string
  firstName: string
  lastName: string
  createTime: number
  mobile: string
  isOwner: boolean
  status: number
  MemberRoles: TRole[]
}

interface IMerchantUserProfile {
  email: string
  firstName: string
  lastName: string
  id: number
  MemberRoles: TRole[]
  merchantId: number
  isOwner: boolean
  status: number // 0-Active, 2-Suspended
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

interface IAppConfig {
  env: string
  isProd: boolean
  supportTimeZone: string[]
  supportCurrency: { Currency: string; Symbol: string; Scale: number }[]
  gateway: TGateway[]
  taskListOpen: boolean // task list is in app.tsx, which is accessible to all pages.
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

interface IPlan {
  id: number
  plan?: IPlan
  externalPlanId?: '' // used for subscription import, the to-be-imported active sub need to bind to a plan.
  planName: string
  description: string
  type: number // 1: main plan, 2: add-on, 3: one-time addon
  currency: Currency
  intervalCount: number
  intervalUnit: string
  amount: number
  status: number // 1: editing，2: active, 3: inactive，4: expired
  publishStatus: number // 1: unpublished(not visible to users), 2: published(users could see and choose this plan)
  addons?: IAddon[]
  addonIds?: number[] // which addons have been attached to this plan.
  onetimeAddonIds?: number[] // which one-time payment addons have been attached to this plan (main plan only)
  metricPlanLimits?: { metricId: number; metricLimit: number }[]
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

interface IBillableMetrics {
  id: number
  merchantId: number
  code: string
  metricName: string
  metricDescription: string
  type: number // 1-limit_metered，2-charge_metered(come later),3-charge_recurring(come later)
  aggregationType: number // 0-count，1-count unique, 2-latest, 3-max, 4-sum
  aggregationProperty: string
  gmtModify: string
  createTime: string
}

export interface SubscriptionWrapper extends ISubscriptionType {
  subscription: ISubscriptionType
}

interface ISubscriptionType {
  id: number
  subscriptionId: string
  planId: number
  productId: number
  userId: number
  status: number
  firstPaidTime: number
  currentPeriodStart: number
  currentPeriodEnd: number
  defaultPaymentMethodId: string
  trialEnd: number // if it's non-zero (seconds from Epoch): subscription'll end on that date(it should be >= currentPeriodEnd)
  // it's used by admin to extend the next due date.
  cancelAtPeriodEnd: number // whether this sub will end at the end of billing cycle, 0: false, 1: true
  amount: number
  currency: string
  taxPercentage: number // 2000 means 20%
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

interface ISubHistoryItem {
  merchantId: number
  userId: number
  subscriptionId: string
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

interface IOneTimeHistoryItem {
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

interface IPreview {
  totalAmount: number
  currency: string
  discount: DiscountCode
  prorationDate: number
  invoice: Invoice
  nextPeriodInvoice: Invoice
}

type DiscountCode = {
  id?: number
  merchantId: number
  name: string
  code: string
  status?: number // when creating a new obj, it has no status. 1: editing, 2-active, 3-deactivate, 4-expired
  billingType: number
  discountType: number
  discountAmount: number
  discountPercentage: number
  currency: string
  cycleLimit: number
  startTime: number
  endTime: number
  validityRange: [Dayjs | null, Dayjs | null]
  createTime?: number
  planIds?: number[] // this code applies to these plan only
  quantity: number
  metadata?: {
    [key: string]: string
  }
}

export enum DiscountCodeUsageStatus {
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
  status: number
  timelineType: number
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
type Invoice = {
  currency: string
  subscriptionAmount: number
  subscriptionAmountExcludingTax: number
  discountAmount: number
  taxAmount: number
  taxPercentage: number
  totalAmount: number
  totalAmountExcludingTax: number
  lines: InvoiceItem[]
}

type TRefund = {
  currency: string
  refundAmount: number
  refundComment: string
  refundTime: number
  createTime: number
  status: number // 10-pending，20-success，30-failure, 40-cancel
  gatewayId: number
  paymentId: string
  invoiceId: string
}
// this is for user view only, generated by admin or system automatically
interface UserInvoice {
  id: number
  merchantId: number
  userId: number
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
  totalAmount: number
  taxAmount: number
  subscriptionAmount: number
  currency: string
  lines: InvoiceItem[]
  status: number // go check INVOICE_STATUS in constants.ts
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

type TGateway = {
  gatewayId?: number
  gatewayKey?: string
  gatewayName: 'paypal' | 'changelly' | 'stripe' | 'wire_transfer'
  displayName?: string
  // gatewayLogo: string
  gatewayType?: number
  webhookEndpointUrl: string
  webhookSecret: string // this is the public key(generated by Changelly), used to ensure the sender can be trusted
  createTime?: number
  minimumAmount?: number // wire transfer only
  currency?: string // ditto
  bank?: {
    // ditto
    accountHolder: string
    bic: string
    iban: string
    address: string
  }
}

export interface TRolePermission {
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
  member: IMerchantUserProfile[]
}

export enum DiscountCodeStatus {
  EDITING = 1,
  ACTIVE,
  DEACTIVATE,
  EXPIRED,
  ARCHIVED = 10
}

export enum CreditType {
  MAIN = 1, // main, rechargeable
  PROMO_CREDIT = 2 // promo credit account
}

export type TCreditConfig = {
  id: number
  merchantId: number
  createTime: number
  name: string
  description: string
  type: CreditType
  discountCodeExclusive: 0 | 1 | boolean // 1 | 0(bool like), allow credit and discount be used together
  currency: string
  exchangeRate: number
  payoutEnable: 0 | 1 | boolean // 1 | 0 (bool like), global switch to enable/disable credit use
  recurring: 0 | 1 | boolean
  rechargeEnable: 0 | 1 | boolean // bool like, only used for type: 1
  previewDefaultUsed: 0 | 1 | boolean // 1(used) | 0(not used), bool like. in purchase preview, if not specified whether or not use credit, this default value is assumed.
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
  IMerchantUserProfile,
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
