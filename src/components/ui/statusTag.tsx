import {
  APP_TASK_STATUS,
  DISCOUNT_CODE_STATUS,
  INVOICE_STATUS,
  MERCHANT_USER_STATUS,
  PAYMENT_STATUS,
  PLAN_STATUS,
  SUBSCRIPTION_HISTORY_STATUS,
  SUBSCRIPTION_STATUS,
  USER_STATUS
} from '@/constants'
import {
  AppTaskStatus,
  DiscountCodeStatus,
  InvoiceStatus,
  MerchantUserStatus,
  PaymentStatus,
  PlanStatus,
  SubscriptionHistoryStatus,
  SubscriptionStatus,
  UserStatus
} from '@/shared.types'
import { Tag } from 'antd'
import React from 'react'

const SubscriptionStatusTag = (status: SubscriptionStatus) => {
  return (
    <Tag color={SUBSCRIPTION_STATUS[status].color}>
      {SUBSCRIPTION_STATUS[status].label}
    </Tag>
  )
}

// sometimes, BE would return some new status value not defined in FE.
// or use: Object.values(STATUS_TYPE).includes(type as STATUS_TYPE) to check
// https://stackoverflow.com/questions/43804805/check-if-value-exists-in-enum-in-typescript
const SubHistoryStatus = (statusId: SubscriptionHistoryStatus) => (
  <Tag color={SUBSCRIPTION_HISTORY_STATUS[statusId]?.color ?? ''}>
    {SUBSCRIPTION_HISTORY_STATUS[statusId]?.label ?? ''}
  </Tag>
)

const InvoiceStatusTag = (statusId: InvoiceStatus, isRefund?: boolean) => {
  if (statusId == InvoiceStatus.PAID && isRefund) {
    // for PAID refund invoice, label should be 'Refunded'
    return <Tag color={INVOICE_STATUS[InvoiceStatus.PAID].color}>Refunded</Tag>
  } else if (statusId == InvoiceStatus.PAID) {
    // show 'paid'
    return (
      <Tag color={INVOICE_STATUS[InvoiceStatus.PAID].color}>
        {INVOICE_STATUS[statusId].label}
      </Tag>
    )
  } else if (statusId == InvoiceStatus.AWAITING_PAYMENT && isRefund) {
    // show 'Awaiting refund'
    return (
      <Tag color={INVOICE_STATUS[InvoiceStatus.AWAITING_PAYMENT].color}>
        Awaiting refund
      </Tag>
    )
  } else if (statusId == InvoiceStatus.AWAITING_PAYMENT) {
    // show 'Awaiting payment'
    return (
      <Tag color={INVOICE_STATUS[InvoiceStatus.AWAITING_PAYMENT].color}>
        {INVOICE_STATUS[statusId].label}
      </Tag>
    )
  } else {
    return (
      <Tag color={INVOICE_STATUS[statusId].color}>
        {INVOICE_STATUS[statusId].label}
      </Tag>
    )
  }
}

const PlanStatusTag = (status: PlanStatus) => (
  <Tag color={PLAN_STATUS[status].color}>{PLAN_STATUS[status].label}</Tag>
)

const getDiscountCodeStatusTagById = (statusId: DiscountCodeStatus) => (
  <Tag color={DISCOUNT_CODE_STATUS[statusId].color}>
    {DISCOUNT_CODE_STATUS[statusId].label}
  </Tag>
)

const PaymentStatusTag = (statusId: PaymentStatus) => (
  <Tag color={PAYMENT_STATUS[statusId]?.color ?? ''}>
    {PAYMENT_STATUS[statusId]?.label ?? ''}
  </Tag>
)

const UserStatusTag = (statusId: UserStatus) => (
  <Tag color={USER_STATUS[statusId].color}>{USER_STATUS[statusId].label}</Tag>
)

const MerchantUserStatusTag = (statusId: MerchantUserStatus) => (
  <Tag color={MERCHANT_USER_STATUS[statusId].color}>
    {MERCHANT_USER_STATUS[statusId].label}
  </Tag>
)

const AppTaskStatusTag = (statusId: AppTaskStatus) => (
  <Tag color={APP_TASK_STATUS[statusId].color}>
    {APP_TASK_STATUS[statusId].label}
  </Tag>
)

export {
  AppTaskStatusTag,
  getDiscountCodeStatusTagById,
  InvoiceStatusTag,
  MerchantUserStatusTag,
  PaymentStatusTag,
  PlanStatusTag,
  SubHistoryStatus,
  SubscriptionStatusTag,
  UserStatusTag
}
