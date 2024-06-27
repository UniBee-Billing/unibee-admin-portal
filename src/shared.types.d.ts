// this is logged-in user' profile
import { Dayjs } from 'dayjs'
import { Currency } from 'dinero.js'

// this is end user profile
interface IProfile {
  address: string
  // country: string;
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
  type: 1 | 2 // 1: individual, 2: business
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
  weChat: string
  whatsAPP: string
  otherSocialInfo: string
  token: string
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
}

interface IAddon extends IPlan {
  quantity: number | null
  checked: boolean
}

interface IPlan {
  id: number
  planName: string
  description: string
  type: number // 1: main plan, 2: add-on, 3: one-time addon
  currency: Currency
  intervalCount: number
  intervalUnit: string
  amount: number
  status: number // 1: editing，2: active, 3: inactive，4: expired
  publishStatus: number // 1: unpublished(not visible to users), 2: published(users could see and choose this plan)
  addons?: IAddon[] // bad design, make a ISubscriptionPlan interface extending from IPlan with quantity/checked
  addonIds?: number[] // which addons have been attached to this plan.
  onetimeAddonIds?: number[] // which one-time payment addons have been attached to this plan (main plan only)
  metricPlanLimits?: { metricId: number; metricLimit: number }[]
  metadata?: string
  /*
  metadata?: {
    property: string
    value: string
    valueType: 'string' | 'boolean' | 'number'
  }[] // backend structure is metadata: {key1: val1, key2: val2, ...}, but both key and value are editable, so I convert it to this structure
  */
  createTime: number
  companyId: number
  merchantId: number
  enableTrial?: boolean
  trialAmount?: number
  trialDurationTime?: number
  trialDemand?: 'paymentMethod' | '' | boolean // backend requires this field to be a fixed string of 'paymentMethod' or '', but to ease the UX, front-end use <Switch />
  cancelAtTrialEnd?: 0 | 1 | boolean // backend requires this field to be a number of 1 | 0, but to ease the UX, front-end use <Switch />
}

interface ISubAddon extends IPlan {
  // when update subscription plan, I need to know which addons users have selected,
  // then apply them on the plan
  quantity: number
  addonPlanId: number
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

interface ISubscriptionType {
  id: number
  subscriptionId: string
  planId: number
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
  taxPercentage: number // 20000 means 20%
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
  prorationDate: number
  invoice: Invoice
  nextPeriodInvoice: Invoice
}

type DiscountCode = {
  id?: number
  merchantId: number
  name: string
  code: string
  status?: number // when creating a new obj, it has no status. 1: editing, 2-active, 3-deactive, 4-expired
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
  metadata?: {
    [key: string]: string
  }
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
  tax: number | string // tax amount
  taxPercentage: number | string // tax rate
  unitAmountExcludingTax: number | string
  discountAmount?: number
  originAmount?: number
}

// when admin update user subscription, this Invoice is part of the response
type Invoice = {
  currency: string
  subscriptionAmount: number
  subscriptionAmountExcludingTax: number
  taxAmount: number
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
  discountAmount?: number
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
  refundable: boolean // in list view, can I cilck the refund icon
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
  minimumAmount?: number // wire tranfer only
  currency?: string // ditto
  bank?: {
    // ditto
    accountHolder: string
    bic: string
    iban: string
    address: string
  }
}

export type TRole = {
  id?: number
  localId: string
  createTime?: number
  merchantId?: number
  role: string
  permissions: { group: string; permissions: string[] }[]
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

export type TExportDataType =
  | 'InvoiceExport'
  | 'UserExport'
  | 'TransactionExport'

export class ExpiredError extends Error {
  constructor(m: string) {
    super(m)
  }
}

export type {
  Country,
  DiscountCode,
  IAppConfig,
  IBillableMetrics,
  IMerchantMemberProfile,
  IMerchantUserProfile,
  IOneTimeHistoryItem,
  IPlan,
  IPreview,
  IProfile,
  ISubHistoryItem,
  ISubscriptionType,
  InvoiceItem,
  PaymentItem,
  TAdminNote,
  TGateway,
  TInvoicePerm,
  TMerchantInfo,
  TRefund,
  TWebhook,
  TWebhookLogs,
  TransactionItem,
  UserInvoice
}
