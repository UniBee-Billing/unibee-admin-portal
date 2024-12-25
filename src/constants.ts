import { CreditTxType } from './shared.types'

export enum PlanType {
  MainPlan = 1,
  Addon = 2,
  OnetimePayment = 3
}

enum PlanStatus {
  Editing = 1,
  Active = 2,
  Inactive = 3,
  Expired = 4
}

export const PLAN_STATUS: { [key: number]: string } = {
  [PlanStatus.Editing]: 'editing',
  [PlanStatus.Active]: 'active',
  [PlanStatus.Inactive]: 'inactive',
  [PlanStatus.Expired]: 'expired'
}

export const SUBSCRIPTION_STATUS: { [key: number]: string } = {
  // 0: 'Initiating', // used when creating the sub, it only exist for a very short time, user might not realize it exists
  1: 'Pending', // when sub is created, but user hasn't paid yet. this is for bank card payment
  2: 'Active', // 2: active: user paid the sub fee
  // 3: "Suspended", // suspend: not used yet. For future implementation: users might want to suspend the sub for a period of time, during which, they don't need to pay
  // 3: 'Pending', // when status is transitioning from 1 to 2, or 2 to 4, there is a pending status, it's not synchronous
  // so we have to wait, in status 3: no action can be taken on UI.
  4: 'Cancelled', // users(or admin) cancelled the sub(immediately or automatically at the end of billing cycle). It's triggered by human.
  5: 'Expired', // sub ended.
  // 6: 'Suspended', // suspend for a while, might want to resume later
  7: 'Incomplete', // user claimed they have wired the transfer, admin mark the invoice as Incomplete until a DATE, so user can use it before that DATE
  8: 'Processing', // user claimed they have wired the transfer(this status if for wire only), but we're checking
  9: 'Failed' //
}

export const SUBSCRIPTION_HISTORY_STATUS: { [key: number]: string } = {
  1: 'Active',
  2: 'Finished',
  3: 'Cancelled',
  4: 'Expired'
}

export const USER_STATUS: { [key: number]: string } = {
  0: 'Active',
  2: 'Suspended'
}

export const MERCHANT_USER_STATUS: { [key: number]: string } = {
  0: 'Active',
  2: 'Suspended'
}

export const TASK_STATUS: { [key: number]: string } = {
  0: 'Queued',
  1: 'Running',
  2: 'Succeeded',
  3: 'Failed'
}

export const CURRENCY: {
  [key: string]: {
    symbol: string
    stripe_factor: number
    decimal_places: number | null
  }
} = {
  // what about PayPal
  CNY: { symbol: '¥', stripe_factor: 100, decimal_places: 2 },
  USD: { symbol: '$', stripe_factor: 100, decimal_places: 2 },
  JPY: { symbol: '¥', stripe_factor: 1, decimal_places: 0 },
  EUR: { symbol: '€', stripe_factor: 100, decimal_places: 2 },
  USDT: { symbol: '₮', stripe_factor: 100, decimal_places: null }
}

export const INVOICE_STATUS: { [key: number]: string } = {
  0: 'Initiating', // this status only exist for a very short period, users/admin won't even know it exist
  1: 'Draft', // admin manually create an invoice, for edit/delete, but users won't receive this invoice.
  2: 'Awaiting payment', // admin has clicked the 'create' button in invoice editing modal, user will receive a mail with payment link. Admin can revoke the invoice if user hasn't made the payment.
  3: 'Paid', // user paid the invoice
  4: 'Failed', // user not pay the invoice before it get expired
  5: 'Cancelled', // admin cancel the invoice after publishing, only if user hasn't paid yet. If user has paid, admin cannot cancel it.
  6: 'Reversed' // 取消后被通知支付成功的，这种情况一般是要排查的
}

export const METRICS_TYPE: { [key: number]: string } = {
  1: 'limit_metered',
  2: 'charge_metered', // not used yet
  3: 'charge_recurring' // not used yet
}

export const METRICS_AGGREGATE_TYPE: { [key: number]: string } = {
  1: 'count',
  2: 'count unique',
  3: 'latest',
  4: 'max',
  5: 'sum'
}

export const DISCOUNT_CODE_STATUS: { [key: number]: string } = {
  1: 'Editing',
  2: 'Active',
  3: 'Inactive',
  4: 'Expired',
  10: 'Archived'
}

export const DISCOUNT_CODE_BILLING_TYPE: { [key: number]: string } = {
  1: 'one-time',
  2: 'recurring'
}

export const DISCOUNT_CODE_TYPE: { [key: number]: string } = {
  1: 'percentage',
  2: 'fixed-amount'
}

export const PAYMENT_STATUS: { [key: number]: string } = {
  0: 'Pending',
  1: 'Succeeded',
  2: 'Failed',
  3: 'Cancelled'
}

export const PAYMENT_TYPE: { [key: number]: string } = {
  0: 'Payment',
  1: 'Refund'
}

export const REFUND_STATUS: { [key: number]: string } = {
  10: 'Awaiting refund',
  20: 'Refunded',
  30: 'Failed',
  40: 'Cancelled'
}

export const CREDIT_TX_TYPE: Record<CreditTxType, string> = {
  [CreditTxType.TOP_UP]: 'Top Up',
  [CreditTxType.CONSUMPTION]: 'Consumption',
  [CreditTxType.REFUND_TOP_UP]: 'Refund Top Up',
  [CreditTxType.WITHDRAWN]: 'Withdrawn',
  [CreditTxType.WITHDRAWN_FAILED]: 'Withdrawn Failed',
  [CreditTxType.ADMIN_UPDATE]: 'Admin Update',
  [CreditTxType.RECHARGE_REFUND_OUT]: 'Recharge Refund Out'
}

const PERMISSIONS = {
  plan: {
    order: 0,
    group: 'plan',
    label: 'Product and Plan',
    width: 100,
    permissions: ['access']
  },
  'billable-metric': {
    order: 1,
    label: 'Billable Metric',
    width: 150,
    group: 'billable-metric',
    permissions: ['access']
  },
  'discount-code': {
    order: 2,
    group: 'discount-code',
    label: 'Discount Code',
    width: 120,
    permissions: ['access']
  },
  subscription: {
    order: 3,
    group: 'subscription',
    label: 'Subscription',
    width: 150,
    permissions: ['access']
  },
  invoice: {
    order: 4,
    group: 'invoice',
    label: 'Invoice',
    width: 100,
    permissions: ['access']
  },
  transaction: {
    order: 5,
    group: 'transaction',
    label: 'Transaction',
    width: 100,
    permissions: ['access']
  },
  user: {
    order: 6,
    group: 'user',
    label: 'User List',
    width: 100,
    permissions: ['access']
  },
  admin: {
    order: 7,
    group: 'admin',
    label: 'Admin List',
    width: 100,
    permissions: ['access']
  },
  /* analytics: {
    order: 8,
    group: 'analytics',
    label: 'Analytics',
    width: 100,
    permissions: ['access']
  }, */
  report: {
    order: 9,
    group: 'report',
    label: 'Report',
    width: 100,
    permissions: ['access']
  },
  'my-account': {
    order: 10,
    group: 'my-account',
    label: 'My Account',
    width: 100,
    permissions: ['access']
  },
  'activity-logs': {
    order: 11,
    group: 'activity-logs',
    label: 'Activity Logs',
    width: 100,
    permissions: ['access']
  },
  configuration: {
    order: 12,
    group: 'configuration',
    label: 'Configuration',
    width: 140,
    permissions: ['access']
  }
}

export const PERMISSION_LIST = Object.entries(PERMISSIONS)
  .map((values) => values[1])
  .sort((a, b) => a.order - b.order)
