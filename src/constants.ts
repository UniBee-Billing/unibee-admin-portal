import {
  AppTaskStatus,
  CreditTxType,
  DiscountCodeBillingType,
  DiscountCodeStatus,
  DiscountType,
  InvoiceBizType,
  MerchantUserStatus,
  MetricAggregationType,
  MetricType,
  PaymentStatus,
  PaymentTimelineType,
  PlanStatus,
  PlanType,
  RefundStatus,
  SubscriptionHistoryStatus,
  SubscriptionStatus,
  UserStatus
} from './shared.types'

export const PLAN_TYPE: Record<PlanType, { label: string }> = {
  [PlanType.MAIN]: { label: 'Main plan' },
  [PlanType.ADD_ON]: { label: 'Add-on' },
  [PlanType.ONE_TIME_ADD_ON]: { label: 'One-time payment' }
}

export const PLAN_STATUS: Record<PlanStatus, { label: string; color: string }> =
  {
    [PlanStatus.EDITING]: { label: 'editing', color: 'blue' },
    [PlanStatus.ACTIVE]: { label: 'active', color: '#87d068' },
    [PlanStatus.INACTIVE]: { label: 'inactive', color: 'purple' },
    [PlanStatus.SOFT_ARCHIVED]: { label: 'soft archived', color: 'gray' },
    [PlanStatus.HARD_ARCHIVED]: { label: 'hard archived', color: 'gray' }
  }

export const SUBSCRIPTION_STATUS: Record<
  SubscriptionStatus,
  { label: string; color: string }
> = {
  [SubscriptionStatus.INITIATING]: {
    label: '', // BE might use this statusCode to represent no active subscription in SubscriptionList page.
    color: 'lightgray'
  },
  [SubscriptionStatus.PENDING]: { label: 'Pending', color: 'magenta' },
  [SubscriptionStatus.ACTIVE]: { label: 'Active', color: '#87d068' },
  [SubscriptionStatus.CANCELLED]: { label: 'Cancelled', color: 'purple' },
  [SubscriptionStatus.EXPIRED]: { label: 'Expired', color: 'red' },
  [SubscriptionStatus.INCOMPLETE]: { label: 'Incomplete', color: 'cyan' },
  [SubscriptionStatus.PROCESSING]: { label: 'Processing', color: 'blue' },
  [SubscriptionStatus.FAILED]: { label: 'Failed', color: '#b71c1c' }
}

export const SUBSCRIPTION_HISTORY_STATUS: Record<
  SubscriptionHistoryStatus,
  { label: string; color: string }
> = {
  [SubscriptionHistoryStatus.Active]: { label: 'Active', color: '#87d068' },
  [SubscriptionHistoryStatus.Finished]: { label: 'Finished', color: 'blue' },
  [SubscriptionHistoryStatus.Cancelled]: {
    label: 'Cancelled',
    color: 'purple'
  },
  [SubscriptionHistoryStatus.Expired]: { label: 'Expired', color: 'red' }
}

export const USER_STATUS: Record<UserStatus, { label: string; color: string }> =
  {
    [UserStatus.ACTIVE]: { label: 'Active', color: '#87d068' },
    [UserStatus.SUSPENDED]: { label: 'Suspended', color: 'red' }
  }

export const MERCHANT_USER_STATUS: Record<
  MerchantUserStatus,
  { label: string; color: string }
> = {
  [MerchantUserStatus.ACTIVE]: { label: 'Active', color: '#87d068' },
  [MerchantUserStatus.SUSPENDED]: { label: 'Suspended', color: 'red' }
}

export const APP_TASK_STATUS: Record<
  AppTaskStatus,
  { label: string; color: string }
> = {
  [AppTaskStatus.QUEUED]: { label: 'Queued', color: 'orange' },
  [AppTaskStatus.RUNNING]: { label: 'Running', color: 'geekblue' },
  [AppTaskStatus.SUCCEEDED]: { label: 'Succeeded', color: '#87d068' },
  [AppTaskStatus.FAILED]: { label: 'Failed', color: 'red' }
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

export const INVOICE_BIZ_TYPE: Record<InvoiceBizType, string> = {
  [InvoiceBizType.ONE_TIME]: 'One-time',
  [InvoiceBizType.MANUALLY_CREATED]: 'Manually created',
  [InvoiceBizType.SUBSCRIPTION]: 'Recurring'
}

export const METRICS_TYPE: Record<MetricType, { label: string }> = {
  [MetricType.LIMIT_METERED]: { label: 'Limit metered' },
  [MetricType.CHARGE_METERED]: { label: 'Charge metered' },
  [MetricType.CHARGE_RECURRING]: { label: 'Charge recurring' }
}

export const METRICS_AGGREGATE_TYPE: Record<
  MetricAggregationType,
  { label: string }
> = {
  [MetricAggregationType.COUNT]: { label: 'count' },
  [MetricAggregationType.COUNT_UNIQUE]: { label: 'count unique' },
  [MetricAggregationType.LATEST]: { label: 'latest' },
  [MetricAggregationType.MAX]: { label: 'max' },
  [MetricAggregationType.SUM]: { label: 'sum' }
}

export const DISCOUNT_CODE_STATUS: Record<
  DiscountCodeStatus,
  { label: string; color: string }
> = {
  [DiscountCodeStatus.EDITING]: { label: 'Editing', color: 'blue' },
  [DiscountCodeStatus.ACTIVE]: { label: 'Active', color: '#87d068' },
  [DiscountCodeStatus.INACTIVE]: { label: 'Inactive', color: 'purple' },
  [DiscountCodeStatus.EXPIRED]: { label: 'Expired', color: 'red' },
  [DiscountCodeStatus.ARCHIVED]: { label: 'Archived', color: 'gray' }
}

export const DISCOUNT_CODE_BILLING_TYPE: Record<
  DiscountCodeBillingType,
  string
> = {
  [DiscountCodeBillingType.ONE_TIME]: 'one-time',
  [DiscountCodeBillingType.RECURRING]: 'recurring'
}

export const DISCOUNT_CODE_TYPE: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: 'percentage',
  [DiscountType.AMOUNT]: 'fixed-amount'
}

export const PAYMENT_STATUS: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  [PaymentStatus.PENDING]: { label: 'Pending', color: 'blue' },
  [PaymentStatus.SUCCEEDED]: { label: 'Succeeded', color: '#87d068' },
  [PaymentStatus.FAILED]: { label: 'Failed', color: 'red' },
  [PaymentStatus.CANCELLED]: { label: 'Cancelled', color: 'purple' }
}

export const PAYMENT_TIME_LINE_TYPE: Record<
  PaymentTimelineType,
  { label: string }
> = {
  [PaymentTimelineType.PAYMENT]: { label: 'Payment' },
  [PaymentTimelineType.REFUND]: { label: 'Refund' }
}

export const REFUND_STATUS: Record<RefundStatus, { label: string }> = {
  [RefundStatus.AWAITING_REFUND]: { label: 'Awaiting refund' },
  [RefundStatus.REFUNDED]: { label: 'Refunded' },
  [RefundStatus.FAILED]: { label: 'Failed' },
  [RefundStatus.CANCELLED]: { label: 'Cancelled' }
}

// when credit amount has changed, we need the following types to track what caused the change.
export const CREDIT_TX_TYPE: Record<CreditTxType, { label: string }> = {
  [CreditTxType.TOP_UP]: { label: 'Deposit' }, // this is for deposit credit(e.g. user saved 100 eur as 100 credits), not for promo credit. Added here for future use.
  [CreditTxType.CONSUMPTION]: { label: 'Applied to an invoice' }, // credit used for invoice payment
  [CreditTxType.FROM_REFUND]: { label: 'From Refund' }, // user used few credit for invoice payment, but later apply for a refund, this type track this event.
  // But only when it's full refund, partial invoice refund has no credit returned.
  // because credit amount is always an integer number, partial refund might involve decimal credit amount.
  [CreditTxType.WITHDRAWN]: { label: 'Withdrawn' }, // this is for deposit credit only. Added for future use.
  [CreditTxType.WITHDRAWN_FAILED]: { label: 'Withdrawn Failed' }, // Withdraw failed, the credit returned to user. This is for deposit credit only. Added for future use.
  [CreditTxType.ADMIN_CHANGE]: { label: 'Admin Change' }, // admin manually change the credit amount
  [CreditTxType.DEPOSIT_REFUND]: { label: 'Deposit refund' } // similar to Withdraw. It's the opposite of Deposit.
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
  'promo-credit': {
    order: 6,
    group: 'promo-credit',
    label: 'Promo credit',
    width: 100,
    permissions: ['access']
  },
  user: {
    order: 7,
    group: 'user',
    label: 'User List',
    width: 100,
    permissions: ['access']
  },
  admin: {
    order: 8,
    group: 'admin',
    label: 'Admin List',
    width: 100,
    permissions: ['access']
  },
  /* analytics: {
    order: 9,
    group: 'analytics',
    label: 'Analytics',
    width: 100,
    permissions: ['access']
  }, */
  report: {
    order: 10,
    group: 'report',
    label: 'Report',
    width: 100,
    permissions: ['access']
  },
  'my-account': {
    order: 11,
    group: 'my-account',
    label: 'My Account',
    width: 100,
    permissions: ['access']
  },
  'activity-logs': {
    order: 12,
    group: 'activity-logs',
    label: 'Activity Logs',
    width: 100,
    permissions: ['access']
  },
  configuration: {
    order: 13,
    group: 'configuration',
    label: 'Configuration',
    width: 140,
    permissions: ['access']
  }
}

export const PERMISSION_LIST = Object.entries(PERMISSIONS)
  .map((values) => values[1])
  .sort((a, b) => a.order - b.order)
