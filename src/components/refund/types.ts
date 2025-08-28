// Refund 模块相关类型定义

// Credit Note API 接口类型
export interface CreditNoteListRequest {
  searchKey?: string
  emails?: string
  file?: File
  status?: number[]
  gatewayIds?: number[]
  planIds?: number[]
  currency?: string
  sortField?: string
  sortType?: 'asc' | 'desc'
  page?: number
  count?: number
  createTimeStart?: number
  createTimeEnd?: number
}

export interface CreditNoteListResponse {
  code: number
  message: string
  data: {
    creditNotes: CreditNote[]
    total: number
  }
  redirect?: string
  requestId?: string
}

export interface CreditNote {
  id: number
  merchantId: number
  userId: number
  subscriptionId: string
  invoiceName: string
  productName: string
  invoiceId: string
  originAmount: number
  totalAmount: number
  discountCode: string
  discountAmount: number
  taxAmount: number
  subscriptionAmount: number
  currency: string
  lines: CreditNoteLine[]
  gatewayId: number
  status: number
  link: string
  taxPercentage: number
  totalAmountExcludingTax: number
  subscriptionAmountExcludingTax: number
  periodStart: number
  periodEnd: number
  paymentId: string
  refundId: string
  gateway: Gateway
  userSnapshot: UserSnapshot
  subscription: Subscription
  payment: Payment
  refund: Refund
  discount: Discount
  createFrom: string
  metadata: Record<string, any>
  countryCode: string
  vatNumber: string
  finishTime: number
  createTime: number
  paidTime: number
  bizType: number
  originalPaymentInvoice: OriginalPaymentInvoice
  promoCreditDiscountAmount: number
  promoCreditTransaction: PromoCreditTransaction
  partialCreditPaidAmount: number
  message: string
  planSnapshot: PlanSnapshot
}

export interface CreditNoteLine {
  currency: string
  originAmount: number
  originUnitAmountExcludeTax: number
  discountAmount: number
  amount: number
  tax: number
  amountExcludingTax: number
  taxPercentage: number
  unitAmountExcludingTax: number
  name: string
  description: string
  pdfDescription: string
  proration: boolean
  quantity: number
  periodEnd: number
  periodStart: number
  plan: Plan
  metricCharge?: MetricCharge
}

export interface Plan {
  id: number
  planId: string
  planName: string
  description: string
  intervalCount: number
  intervalUnit: string
  currency: string
  amount: number
  status: number
  createTime: number
  updateTime: number
}

export interface Gateway {
  gatewayId: number
  name: string
  displayName: string
  status: number
  config: Record<string, any>
}

export interface UserSnapshot {
  id: number
  merchantId: number
  userName: string
  mobile: string
  email: string
  gender: string
  avatarUrl: string
  isSpecial: number
  birthday: string
  profession: string
  school: string
  state: string
  lastLoginAt: number
  isRisk: number
  gatewayId: number
  version: number
  phone: string
  address: string
  firstName: string
  lastName: string
  companyName: string
  vATNumber: string
  telegram: string
  whatsAPP: string
  weChat: string
  tikTok: string
  linkedIn: string
  facebook: string
  otherSocialInfo: string
  paymentMethod: string
  countryCode: string
  countryName: string
  subscriptionName: string
  subscriptionId: string
  subscriptionStatus: number
  recurringAmount: number
  billingType: number
  timeZone: string
  createTime: number
  externalUserId: string
  status: number
  taxPercentage: number
  type: number
  city: string
  zipCode: string
  language: string
  registrationNumber: string
  metadata: Record<string, any>
  gatewayPaymentType: string
  custom: string
}

export interface Subscription {
  id: number
  subscriptionId: string
  externalSubscriptionId: string
  userId: number
  taskTime: string
  amount: number
  currency: string
  merchantId: number
  planId: number
  quantity: number
  addonData: string
  latestInvoiceId: string
  type: number
  gatewayId: number
  status: number
  link: string
  gatewayStatus: string
  features: string
  cancelAtPeriodEnd: number
  lastUpdateTime: number
  currentPeriodStart: number
  currentPeriodEnd: number
  originalPeriodEnd: number
  billingCycleAnchor: number
  dunningTime: number
  trialEnd: number
  returnUrl: string
  firstPaidTime: number
  cancelReason: string
}

export interface Payment {
  id: number
  paymentId: string
  externalPaymentId: string
  userId: number
  subscriptionId: string
  invoiceId: string
  amount: number
  currency: string
  status: number
  gatewayId: number
  gatewayStatus: string
  createTime: number
  updateTime: number
}

export interface Refund {
  id: number
  refundId: string
  externalRefundId: string
  paymentId: string
  amount: number
  currency: string
  status: number
  reason: string
  createTime: number
  updateTime: number
}

export interface Discount {
  id: number
  discountId: string
  code: string
  type: number
  value: number
  currency: string
  status: number
  createTime: number
  updateTime: number
}

export interface OriginalPaymentInvoice {
  id: number
  invoiceId: string
  data: string
  createTime: number
}

export interface PromoCreditTransaction {
  id: number
  transactionId: string
  userId: number
  amount: number
  type: number
  createTime: number
}

export interface PlanSnapshot {
  id: number
  plan: Plan
  createTime: number
}

export interface MetricCharge {
  id: number
  metricId: number
  metricName: string
  value: number
  unitPrice: number
  amount: number
  currency: string
  createTime: number
}

// 用于显示的类型
export interface RefundItem {
  id: string
  invoiceId: string
  email: string
  userId?: number
  planName: string
  subscriptionId: string
  planInterval: string
  refundAmount: number
  currency: string
  refundDate: string
  refundMethod: string
  refundReason: string
  refundStatus: 'completed' | 'partial' | 'failed' | 'processing' | 'cancelled'
  merchant: string
  planIntervalCount: number
  planIntervalUnit: string
}

export interface SearchResult {
  matched: RefundItem[]
  unmatched: string[]
  total: number
  uniqueMatchedCount: number
} 