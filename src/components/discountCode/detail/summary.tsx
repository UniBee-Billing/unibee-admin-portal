import { getDiscountCodeStatusTagById } from '@/components/ui/statusTag'
import {
  DiscountCodeApplyType,
  DiscountCodeBillingType,
  DiscountCodeStatus,
  DiscountCodeUserScope,
  DiscountType
} from '@/shared.types'
import { Col, Divider, Row } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { ReactNode } from 'react'
import { DISCOUNT_CODE_UPGRADE_SCOPE } from '../helpers'
import './summary.css'
export const NotSetPlaceholder = () => (
  <span className="text-red-500">Not set</span>
)

const labelStyle = 'flex h-11 items-center text-gray-400'
const contentStyle = 'flex h-11 items-center justify-end'
const labelStyle2 = 'flex h-6 text-gray-400'
const contentStyle2 = 'flex h-6'
type SummaryItem = {
  name: string
  code: string
  status?: DiscountCodeStatus // status could be null if code is first copied, then being edited.
  quantity: number
  discountType: DiscountType
  billingType: DiscountCodeBillingType
  cycleLimit: number | string | null
  validityRange: null | [Dayjs | null, Dayjs | null]
  applyType: DiscountCodeApplyType
  planIds: null | number[]
  getPlanLabel: (planId: number, compact: boolean) => ReactNode
  userScope: DiscountCodeUserScope
  upgradeScope: DISCOUNT_CODE_UPGRADE_SCOPE
  userLimit: boolean
  getDiscountedValue: () => string | JSX.Element
}

const Summary = ({
  name,
  code,
  status,
  quantity,
  discountType,
  billingType,
  cycleLimit,
  validityRange,
  applyType,
  planIds,
  getPlanLabel,
  userScope,
  upgradeScope,
  userLimit,
  getDiscountedValue
}: SummaryItem) => {
  const items = [
    { label: 'Name', renderContent: name || <NotSetPlaceholder /> },
    { label: 'Code', renderContent: code || <NotSetPlaceholder /> },
    {
      label: 'Status',
      renderContent: getDiscountCodeStatusTagById(
        status ?? DiscountCodeStatus.EDITING
      )
    },
    {
      label: 'Quantity',
      renderContent:
        quantity === 0 ? (
          'Unlimited'
        ) : quantity == null ? (
          <NotSetPlaceholder />
        ) : (
          quantity
        )
    },
    {
      label: 'Discount Type',
      renderContent:
        discountType == DiscountType.AMOUNT ? 'Fixed amount' : 'Percentage'
    },
    {
      label: 'Discount',
      renderContent: getDiscountedValue()
    },
    {
      label: 'One time or recurring',
      renderContent:
        billingType == DiscountCodeBillingType.ONE_TIME
          ? 'One time'
          : 'Recurring'
    },
    {
      label: 'Cycle Limit',
      renderContent:
        cycleLimit === 0 ? (
          'No limit'
        ) : cycleLimit === '' || isNaN(Number(cycleLimit)) ? (
          <NotSetPlaceholder />
        ) : (
          cycleLimit
        )
    },
    {
      label: 'Code Apply Date Range',
      renderContent:
        validityRange == null ||
        validityRange[0] == null ||
        validityRange[1] == null ? (
          <NotSetPlaceholder />
        ) : (
          `${dayjs(validityRange[0]).format('YYYY-MMM-DD')} ~ ${dayjs(validityRange[1]).format('YYYY-MMM-DD')}`
        )
    },
    {
      label: 'Apply Discount Code to',
      renderContent:
        applyType == DiscountCodeApplyType.ALL ? (
          'All plans'
        ) : applyType == DiscountCodeApplyType.SELECTED ? (
          planIds == null || planIds.length == 0 ? (
            <NotSetPlaceholder />
          ) : (
            <p className="long-content">
              {planIds?.map((id) => getPlanLabel(id, true)).join(', ')}
            </p>
          )
        ) : applyType == DiscountCodeApplyType.NOT_SELECTED ? (
          planIds == null || planIds.length == 0 ? (
            <NotSetPlaceholder />
          ) : (
            <div className="flex flex-col items-end">
              <div className="text-right text-red-500">All plans except:</div>
              <p className="long-content">
                {planIds?.map((id) => getPlanLabel(id, true)).join(', ')}
              </p>
            </div>
          )
        ) : applyType ==
          DiscountCodeApplyType.APPLY_TO_PLANS_BY_BILLING_PERIOD ? (
          <div className="flex flex-col items-end">
            <div className="text-right" style={{ fontSize: '12px' }}>
              Plans by selected billing period
            </div>
            <div className="text-right" style={{ fontSize: '12px' }}>
              
              <span className="long-content">
              excluded:{' '} {planIds?.map((id) => getPlanLabel(id, true)).join(', ')}
              </span>
            </div>
          </div>
        ) : applyType ==
          DiscountCodeApplyType.APPLY_TO_PLANS_EXCEPT_BY_BILLING_PERIOD ? (
          <div className="flex flex-col items-end">
            <div className="text-right" style={{ fontSize: '12px' }}>
              Plans by except selected billing period
            </div>
            <div className="text-right" style={{ fontSize: '12px' }}>
              <span className="long-content">
              included:{' '} {planIds?.map((id) => getPlanLabel(id, true)).join(', ')}
              </span>
            </div>
          </div>
        ) : null
    }
  ]

  const advancedItems = [
    {
      label: 'Discount Code Applicable Scope',
      renderContent:
        userScope == DiscountCodeUserScope.ALL_USERS
          ? 'Apply for all'
          : userScope == DiscountCodeUserScope.NEW_USERS
            ? 'Apply only for new users'
            : 'Apply only for renewal users'
    },
    {
      label: 'Applicable Subscription Limits',
      renderContent:
        upgradeScope == DISCOUNT_CODE_UPGRADE_SCOPE.ALL
          ? 'Apply for all'
          : upgradeScope == DISCOUNT_CODE_UPGRADE_SCOPE.UPGRADE_ONLY
            ? 'Apply only for upgrades (same recurring cycle)'
            : 'Apply only for switching to any long subscriptions'
    },
    {
      label: 'Same user cannot use the same discount code again',
      renderContent: userLimit ? 'Yes' : 'No'
    }
  ]
  return (
    <div className="px-4">
      <div className="flex h-[46px] items-center text-lg">Summary</div>
      <Divider className="my-4" />
      <div className="mb-4 flex items-center">
        <Divider type="vertical" className="ml-0 h-7 w-0.5 bg-[#1677FF]" />
        <div className="text-lg">General Configuration</div>
      </div>
      {items.map((item) => (
        <Row key={item.label} className="flex items-baseline">
          <Col span={10} className={labelStyle}>
            {item.label}
          </Col>
          <Col span={14} className={contentStyle}>
            {item.renderContent}
          </Col>
        </Row>
      ))}
      <div className="h-8"></div>
      <div className="my-4 flex items-center">
        <Divider type="vertical" className="ml-0 h-7 w-0.5 bg-[#1677FF]" />
        <div className="text-lg">Advanced Configuration</div>
      </div>
      {advancedItems.map((item, idx: number) => (
        <div key={item.label}>
          <Row className="flex items-baseline">
            <Col span={24} className={labelStyle2}>
              {item.label}
            </Col>
          </Row>
          <Row className="flex items-baseline">
            <Col span={24} className={contentStyle2}>
              {item.renderContent}
            </Col>
          </Row>
          {idx != advancedItems.length - 1 && <Divider className="my-3" />}
        </div>
      ))}
    </div>
  )
}

export default Summary
