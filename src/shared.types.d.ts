// this is logged-in user' profile
import { Currency } from 'dinero.js'

interface IProfile {
  address: string
  // country: string;
  countryCode: string
  countryName: string
  companyName: string
  email: string
  facebook: string
  firstName: string
  lastName: string
  id: number | null
  phone: string
  mobile: string
  paymentMethod: string
  linkedIn: string
  telegram: string
  tikTok: string
  vATNumber: string
  weChat: string
  whatsAPP: string
  otherSocialInfo: string
  token: string
}

interface IMerchantUserProfile {
  email: string
  firstName: string
  lastName: string
  id: number
  role: string
  merchantId: number
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
  gateway: {
    gatewayId: number
    gatewayName: string
    gatewayLogo: string
    gatewayType: number
  }[]
}

interface IAddon extends IPlan {
  quantity: number | null
  checked: boolean
}

interface IPlan {
  id: number
  planName: string
  description: string
  type: number // 1: main plan, 2: add-on
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
  metadata?: { property: string; value: string }[] // backend structure is metadata: {key1: val1, key2: val2, ...}, but both key and value are editable, so I convert it to this structure
  createTime: number
  companyId: number
  merchantId: number
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
  taxScale: number // 20000 means 20%
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
}

interface IPreview {
  totalAmount: number
  currency: string
  prorationDate: number
  invoice: Invoice
  nextPeriodInvoice: Invoice
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
  taxScale: number | string // tax rate
  unitAmountExcludingTax: number | string
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
  totalAmount: number
  taxAmount: number
  taxScale: number
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
  gateway: { gatewayId: number; gatewayName: string }
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
  refundId: string
  userAccount: IProfile
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

export class ExpiredError extends Error {
  constructor(m: string) {
    super(m)
  }
}

export type {
  Country,
  IAppConfig,
  IBillableMetrics,
  IMerchantUserProfile,
  IPlan,
  IPreview,
  IProfile,
  ISubscriptionType,
  InvoiceItem,
  TAdminNote,
  TInvoicePerm,
  TMerchantInfo,
  TWebhook,
  TWebhookLogs,
  UserInvoice
}
