import { InfoCircleOutlined } from '@ant-design/icons'
import { Tag, Tooltip } from 'antd'
import React, { ReactElement } from 'react'
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
} from '../../constants'
import {
  AppTaskStatus,
  DiscountCodeStatus,
  MerchantUserStatus,
  PaymentStatus,
  PlanStatus,
  SubscriptionHistoryStatus,
  SubscriptionStatus,
  UserStatus
} from '../../shared.types'

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

const IV_STATUS: { [key: number]: ReactElement } = {
  0: <span>Initiating</span>, // this status only exist for a very short period, users/admin won't even know it exist
  1: (
    <div>
      <Tag color="gray">{INVOICE_STATUS[1]}</Tag>
      <Tooltip title="You can still edit/delete this draft, user won't receive this invoice until you 'create' it.">
        <InfoCircleOutlined />
      </Tooltip>
    </div>
  ), // 1: draft
  2: <Tag color="blue">{INVOICE_STATUS[2]}</Tag>, // 2: awaiting payment/refund
  3: <Tag color="#87d068">{INVOICE_STATUS[3]}</Tag>, // 3: paid/refunded
  4: (
    <div>
      <Tag color="red">{INVOICE_STATUS[4]}</Tag>
      <Tooltip title="User didn't finish the payment on time.">
        <InfoCircleOutlined />
      </Tooltip>
    </div>
  ), // 4: failed
  5: <Tag color="purple">{INVOICE_STATUS[5]}</Tag>, // 5: cancellled
  6: <Tag color="cyan">{INVOICE_STATUS[6]}</Tag> // reversed???
}
const InvoiceStatus = (statusId: number, isRefund?: boolean) => {
  if (statusId == 3 && isRefund) {
    // show 'refunded', status == 3 means invoice Paid, for refund invoice, description should be Refunded
    return <Tag color="#87d068">Refunded</Tag>
  } else if (statusId == 3) {
    // show 'paid'
    return <Tag color="#87d068">{INVOICE_STATUS[3]}</Tag>
  } else if (statusId == 2 && isRefund) {
    // show 'Awaiting refund'
    return <Tag color="blue">Awaiting refund</Tag>
  } else if (statusId == 2) {
    // show 'Awaiting payment'
    return <Tag color="blue">{INVOICE_STATUS[2]}</Tag>
  } else {
    return IV_STATUS[statusId]
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
  InvoiceStatus,
  MerchantUserStatusTag,
  PaymentStatusTag,
  PlanStatusTag,
  SubHistoryStatus,
  SubscriptionStatusTag,
  UserStatusTag
}
