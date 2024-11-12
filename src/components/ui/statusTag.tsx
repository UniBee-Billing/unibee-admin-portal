import { InfoCircleOutlined } from '@ant-design/icons'
import { Tag, Tooltip } from 'antd'
import React, { ReactElement } from 'react'
import {
  DISCOUNT_CODE_STATUS,
  INVOICE_STATUS,
  MERCHANT_USER_STATUS,
  PAYMENT_STATUS,
  PLAN_STATUS,
  SUBSCRIPTION_HISTORY_STATUS,
  SUBSCRIPTION_STATUS,
  TASK_STATUS,
  USER_STATUS
} from '../../constants'

const SUB_STATUS: { [key: number]: ReactElement } = {
  1: <Tag color="magenta">{SUBSCRIPTION_STATUS[1]}</Tag>, // 1: pending
  2: <Tag color="#87d068">{SUBSCRIPTION_STATUS[2]}</Tag>, // 2: active
  4: <Tag color="purple">{SUBSCRIPTION_STATUS[4]}</Tag>, // 4: cancelled
  5: <Tag color="red">{SUBSCRIPTION_STATUS[5]}</Tag>, // 5: expired
  7: <Tag color="cyan">{SUBSCRIPTION_STATUS[7]}</Tag>, // 7: Incomplete
  8: <Tag color="blue">{SUBSCRIPTION_STATUS[8]}</Tag>, // 8: processing
  9: <Tag color="#b71c1c">{SUBSCRIPTION_STATUS[9]}</Tag> // 9: failed
}
const SubscriptionStatus = (statusId: number) => SUB_STATUS[statusId]

const SUB_HISTORY_STATUS: { [key: number]: ReactElement } = {
  1: <Tag color="#87d068">{SUBSCRIPTION_HISTORY_STATUS[1]}</Tag>, // 1: active
  2: <Tag color="blue">{SUBSCRIPTION_HISTORY_STATUS[2]}</Tag>, // 2: finished
  3: <Tag color="purple">{SUBSCRIPTION_HISTORY_STATUS[3]}</Tag>, // 3: cancelled
  4: <Tag color="red">{SUBSCRIPTION_HISTORY_STATUS[4]}</Tag> // 4: expired
}
const SubHistoryStatus = (statusId: number) => SUB_HISTORY_STATUS[statusId]

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

const PLAN_STATUS_TAG: { [key: number]: ReactElement } = {
  1: <Tag color="blue">{PLAN_STATUS[1]}</Tag>,
  2: <Tag color="#87d068">{PLAN_STATUS[2]}</Tag>,
  3: <Tag color="purple">{PLAN_STATUS[3]}</Tag>,
  4: <Tag color="red">{PLAN_STATUS[4]}</Tag>
}
const PlanStatus = (statusId: number) => PLAN_STATUS_TAG[statusId]

const DISCOUNT_CODE_STATUS_TAG: { [key: number]: ReactElement } = {
  1: <Tag color="blue">{DISCOUNT_CODE_STATUS[1]}</Tag>,
  2: <Tag color="#87d068">{DISCOUNT_CODE_STATUS[2]}</Tag>,
  3: <Tag color="purple">{DISCOUNT_CODE_STATUS[3]}</Tag>,
  4: <Tag color="red">{DISCOUNT_CODE_STATUS[4]}</Tag>
}
const getDiscountCodeStatusTagById = (statusId: number) =>
  DISCOUNT_CODE_STATUS_TAG[statusId]

const PAYMENT_STATUS_TAG: { [key: number]: ReactElement } = {
  0: <Tag color="blue">{PAYMENT_STATUS[0]}</Tag>, // pending
  1: <Tag color="#87d068">{PAYMENT_STATUS[1]}</Tag>, // succeeded
  2: <Tag color="purple">{PAYMENT_STATUS[2]}</Tag>, // failed
  3: <Tag color="red">{PAYMENT_STATUS[3]}</Tag> // cancelled
}
const PaymentStatus = (statusId: number) => PAYMENT_STATUS_TAG[statusId]

const USER_STATUS_TAG: { [key: number]: ReactElement } = {
  0: <Tag color="#87d068">{USER_STATUS[0]}</Tag>, // active
  2: <Tag color="red">{USER_STATUS[2]}</Tag> // suspended
}
const UserStatus = (statusId: number) => USER_STATUS_TAG[statusId]

const MERCHANT_USER_STATUS_TAG: { [key: number]: ReactElement } = {
  0: <Tag color="#87d068">{MERCHANT_USER_STATUS[0]}</Tag>, // active
  2: <Tag color="red">{MERCHANT_USER_STATUS[2]}</Tag> // suspended
}
const MerchantUserStatus = (statusId: number) =>
  MERCHANT_USER_STATUS_TAG[statusId]

const TASK_STATUS_TAG: { [key: number]: ReactElement } = {
  0: <Tag color="orange">{TASK_STATUS[0]}</Tag>, // queued
  1: <Tag color="geekblue">{TASK_STATUS[1]}</Tag>, // running
  2: <Tag color="#87d068">{TASK_STATUS[2]}</Tag>, // succeeded
  3: <Tag color="red">{TASK_STATUS[3]}</Tag> // failed
}
const TaskStatus = (statusId: number) => TASK_STATUS_TAG[statusId]

export {
  getDiscountCodeStatusTagById,
  InvoiceStatus,
  MerchantUserStatus,
  PaymentStatus,
  PlanStatus,
  SubHistoryStatus,
  SubscriptionStatus,
  TaskStatus,
  UserStatus
}
