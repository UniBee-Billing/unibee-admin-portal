import '@/components/discountCode/detail/summary.css'
import LongTextPopover from '@/components/ui/longTextPopover'
import { PlanStatusTag } from '@/components/ui/statusTag'
import { PLAN_TYPE } from '@/constants'
import { IPlan, PlanPublishStatus, PlanStatus, PlanType } from '@/shared.types'
import { Col, Divider, Row } from 'antd'
import { useContext } from 'react'
import { MetricDataContext } from './metricDataContext'
import { TrialSummary } from './types'

export const NotSetPlaceholder = () => (
  <span className="text-red-500">Not set</span>
)

const labelStyle = 'flex h-11 items-center text-gray-400'
const contentStyle =
  'flex h-11 items-center justify-end overflow-hidden overflow-ellipsis whitespace-nowrap'
const labelStyle2 = 'flex h-6 text-gray-400'
// const contentStyle2 = 'flex h-6'
type SummaryItem = {
  name: string
  description: string
  watchPlanType?: PlanType
  getPlanPrice: () => string | undefined
  planStatus: PlanStatus
  publishStatus: PlanPublishStatus
  selectAddons: IPlan[]
  selectOnetime: IPlan[]
  watchAddons: number[]
  watchOnetimeAddons: number[]
  trialSummary: TrialSummary
}

const Index = ({
  name,
  description,
  watchPlanType,
  getPlanPrice,
  planStatus,
  publishStatus,
  selectAddons,
  selectOnetime,
  watchAddons,
  watchOnetimeAddons,
  trialSummary
}: SummaryItem) => {
  const { metricData } = useContext(MetricDataContext)
  const formatAddonList = (addonType: 'addon' | 'onetimeAddon') => {
    const list = addonType == 'addon' ? selectAddons : selectOnetime
    const selectedList = addonType == 'addon' ? watchAddons : watchOnetimeAddons
    return list
      ?.filter((item) => selectedList?.includes(item.id))
      .map((item) => {
        return `${item.planName}`
      })
      .join(', ')
  }
  const items = [
    {
      label: 'Plan Name',
      renderContent:
        name != '' && name != undefined ? (
          <div className="w-full">
            <LongTextPopover text={name} placement="left" />
          </div>
        ) : (
          <NotSetPlaceholder />
        )
    },
    {
      label: 'Plan Description',
      renderContent:
        description != '' && description != undefined ? (
          <div className="w-full">
            <LongTextPopover text={description} placement="left" />
          </div>
        ) : (
          <NotSetPlaceholder />
        )
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
    }
    /* {
      label: 'Published to user portal',
      renderContent: publishStatus == PlanPublishStatus.PUBLISHED ? 'Yes' : 'No'
    }*/
  ]

  const advancedItems = [
    {
      group: 'Add-ons',
      items: [
        {
          label: 'Add-ons',
          renderContent: (
            <div className="w-full">
              <LongTextPopover
                text={formatAddonList('addon')}
                placement="left"
              />
            </div>
          ),
          hidden: watchAddons == null || watchAddons.length == 0
        },
        {
          label: 'One time add-ons',
          renderContent: (
            <div className="w-full">
              <LongTextPopover
                text={formatAddonList('onetimeAddon')}
                placement="left"
              />
            </div>
          ),
          hidden: watchOnetimeAddons == null || watchOnetimeAddons.length == 0
        }
      ]
    },
    {
      group: 'Trial',
      items: [
        {
          label: 'Allow Trial',
          renderContent: trialSummary.trialEnabled ? 'Yes' : 'No'
        },
        {
          label: 'Trial Price',
          hidden: !trialSummary.trialEnabled,
          renderContent: trialSummary.price || <NotSetPlaceholder />
        },
        {
          label: 'Trial Length',
          hidden: !trialSummary.trialEnabled,
          renderContent:
            trialSummary.durationTime == undefined ? (
              <NotSetPlaceholder />
            ) : (
              trialSummary.durationTime
            )
        },
        {
          label: 'Require bank card',
          hidden: !trialSummary.trialEnabled,
          renderContent: trialSummary.requireBankInfo ? 'Yes' : 'No'
        },
        {
          label: 'Auto renew',
          hidden: !trialSummary.trialEnabled,
          renderContent: trialSummary.AutoRenew ? 'Yes' : 'No'
        }
      ]
    },
    {
      group: 'Usage-based Billing Model',
      items: [
        {
          label: 'Limit Metered',
          renderContent:
            metricData?.metricLimits.length > 0 ? 'Added' : 'Not Added'
        },
        {
          label: 'Charge Metered',
          renderContent:
            metricData?.metricMeteredCharge.length > 0 ? 'Added' : 'Not Added'
        },
        {
          label: 'Charge Metered (Recurring)',
          renderContent:
            metricData?.metricRecurringCharge.length > 0 ? 'Added' : 'Not Added'
        }
      ]
    }
  ]
  return (
    <div className="px-4">
      <div className="flex h-[46px] items-center text-lg">Summary</div>
      <Divider className="mb-5 mt-0" />
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
      {advancedItems.map((grp, idx) => (
        <div key={grp.group}>
          <div>
            <div className="my-4">{grp.group}</div>
            {grp.items.map((item) => (
              <div key={item.label}>
                <Row className="flex items-baseline">
                  <Col span={10} className={labelStyle2}>
                    {item.label}
                  </Col>{' '}
                  <Col span={14} className={contentStyle}>
                    {item.renderContent}
                  </Col>
                </Row>
              </div>
            ))}
          </div>
          {idx != advancedItems.length - 1 && <Divider className="my-1" />}
        </div>
      ))}
    </div>
  )
}

export default Index
