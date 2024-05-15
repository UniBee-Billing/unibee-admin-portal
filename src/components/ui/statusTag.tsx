import { Tag } from 'antd'
import React, { ReactElement } from 'react'
import {
  CURRENCY,
  DISCOUNT_CODE_STATUS,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  PLAN_STATUS,
  SUBSCRIPTION_STATUS,
  USER_STATUS
} from '../../constants'

const SUB_STATUS: { [key: number]: ReactElement } = {
  1: <Tag color="magenta">{SUBSCRIPTION_STATUS[1]}</Tag>, // 1: pending
  2: <Tag color="#87d068">{SUBSCRIPTION_STATUS[2]}</Tag>, // 2: active
  4: <Tag color="purple">{SUBSCRIPTION_STATUS[4]}</Tag>, // 4: cancelled
  5: <Tag color="red">{SUBSCRIPTION_STATUS[5]}</Tag>, // 5: expired
  7: <Tag color="cyan">{SUBSCRIPTION_STATUS[7]}</Tag>, // 7: Incomplete
  8: <Tag color="blue">{SUBSCRIPTION_STATUS[8]}</Tag> // 8: processing
}
const SubscriptionStatus = (statusId: number) => SUB_STATUS[statusId]

const IV_STATUS: { [key: number]: ReactElement } = {
  0: <span>Initiating</span>, // this status only exist for a very short period, users/admin won't even know it exist
  1: <Tag color="magenta">{INVOICE_STATUS[1]}</Tag>, // 1: pending
  2: <Tag color="blue">{INVOICE_STATUS[2]}</Tag>, // 2: processing
  3: <Tag color="#87d068">{INVOICE_STATUS[3]}</Tag>, // 3: paid
  4: <Tag color="red">{INVOICE_STATUS[4]}</Tag>, // 4: failed
  5: <Tag color="purple">{INVOICE_STATUS[5]}</Tag> // 5: cancellled
}
const InvoiceStatus = (statusId: number) => IV_STATUS[statusId]

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
const DiscountCodeStatus = (statusId: number) =>
  DISCOUNT_CODE_STATUS_TAG[statusId]

const PAYMENT_STATUS_TAG: { [key: number]: ReactElement } = {
  0: <Tag color="blue">{PAYMENT_STATUS[0]}</Tag>, // pending
  1: <Tag color="#87d068">{PAYMENT_STATUS[1]}</Tag>, // succeeded
  2: <Tag color="purple">{PAYMENT_STATUS[2]}</Tag> // failed
}
const PaymentStatus = (statusId: number) => PAYMENT_STATUS_TAG[statusId]

const USER_STATUS_TAG: { [key: number]: ReactElement } = {
  0: <Tag color="#87d068">{USER_STATUS[0]}</Tag>, // active
  2: <Tag color="red">{USER_STATUS[2]}</Tag> // suspended
}
const UserStatus = (statusId: number) => USER_STATUS_TAG[statusId]

export {
  DiscountCodeStatus,
  InvoiceStatus,
  PaymentStatus,
  PlanStatus,
  SubscriptionStatus,
  UserStatus
}