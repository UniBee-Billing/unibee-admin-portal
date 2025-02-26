import '@/components/discountCode/detail/summary.css'
import { PlanStatusTag } from '@/components/ui/statusTag'
import { PLAN_TYPE } from '@/constants'
import { IPlan, PlanPublishStatus, PlanStatus, PlanType } from '@/shared.types'
import { Col, Divider, Row } from 'antd'

export const NotSetPlaceholder = () => (
  <span className="text-red-500">Not set</span>
)

const labelStyle = 'flex h-11 items-center text-gray-400'
const contentStyle = 'flex h-11 items-center justify-end'
const labelStyle2 = 'flex h-6 text-gray-400'
// const contentStyle2 = 'flex h-6'
type SummaryItem = {
  name: string
  description: string
  enableTrialWatch: boolean
  watchPlanType?: PlanType
  getPlanPrice: () => string | undefined
  planStatus: PlanStatus
  publishStatus: PlanPublishStatus
  selectAddons: IPlan[]
  selectOnetime: IPlan[]
  watchAddons: number[]
  watchOnetimeAddons: number[]
}

const Index = ({
  name,
  description,
  enableTrialWatch,
  watchPlanType,
  getPlanPrice,
  planStatus,
  publishStatus,
  selectAddons,
  selectOnetime,
  watchAddons,
  watchOnetimeAddons
}: SummaryItem) => {
  const formatAddonList = (addonType: 'addon' | 'onetimeAddon') => {
    const list = addonType == 'addon' ? selectAddons : selectOnetime
    const selectedList = addonType == 'addon' ? watchAddons : watchOnetimeAddons
    return list
      .filter((item) => selectedList.includes(item.id))
      .map((item) => {
        return `${item.planName}`
      })
      .join(', ')
  }
  const items = [
    { label: 'Name', renderContent: name || <NotSetPlaceholder /> },
    {
      label: 'Description',
      renderContent: description || <NotSetPlaceholder />
    },
    {
      label: 'Plan Type',
      renderContent: watchPlanType ? (
        PLAN_TYPE[watchPlanType].label
      ) : (
        <NotSetPlaceholder />
      )
    },
    {
      label: 'Price',
      renderContent:
        getPlanPrice() == undefined ? <NotSetPlaceholder /> : getPlanPrice()
    },
    {
      label: 'Status',
      renderContent: PlanStatusTag(planStatus)
    },
    {
      label: 'Published to user portal',
      renderContent: publishStatus == PlanPublishStatus.PUBLISHED ? 'Yes' : 'No'
    }
    /* {
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
              {planIds?.map((id) => getPlanLabel(id)).join(', ')}
            </p>
          )
        ) : planIds == null || planIds.length == 0 ? (
          <NotSetPlaceholder />
        ) : (
          <div className="flex flex-col items-end">
            <div className="text-right text-red-500">All plans except:</div>
            <p className="long-content">
              {planIds?.map((id) => getPlanLabel(id)).join(', ')}
            </p>
          </div>
        )
    } */
  ]

  const advancedItems = [
    {
      label: 'Addons',
      renderContent: <p className="long-content">{formatAddonList('addon')}</p>,
      hidden: watchAddons == null || watchAddons.length == 0
    },
    {
      label: 'One time addons',
      renderContent: (
        <p className="long-content">{formatAddonList('onetimeAddon')}</p>
      ),
      hidden: watchOnetimeAddons == null || watchOnetimeAddons.length == 0
    },
    {
      label: 'Allow trial',
      renderContent: enableTrialWatch ? 'Yes' : 'No'
    }
  ]
  return (
    <div className="px-4">
      <div className="flex h-[46px] items-center text-lg">Summary</div>
      <Divider className="my-4" />
      <div className="mb-4 flex items-center">
        <Divider type="vertical" className="ml-0 h-7 w-0.5 bg-[#1677FF]" />
        <div className="text-lg">Basic Setup</div>
      </div>
      {items.map((item) => (
        <Row key={item.label} className="flex items-baseline">
          <Col span={14} className={labelStyle}>
            {item.label}
          </Col>
          <Col span={10} className={contentStyle}>
            {item.renderContent}
          </Col>
        </Row>
      ))}
      <div className="h-8"></div>
      <div className="my-4 flex items-center">
        <Divider type="vertical" className="ml-0 h-7 w-0.5 bg-[#1677FF]" />
        <div className="text-lg">Advanced Setup</div>
      </div>
      {advancedItems
        .filter((item) => !item.hidden)
        .map((item, idx: number) => (
          <div key={item.label}>
            <Row className="flex items-baseline">
              <Col span={10} className={labelStyle2}>
                {item.label}
              </Col>{' '}
              <Col span={14} className={contentStyle}>
                {item.renderContent}
              </Col>
            </Row>

            {/* {idx != advancedItems.length - 1 && <Divider className="my-3" />} */}
          </div>
        ))}
    </div>
  )
}

export default Index
