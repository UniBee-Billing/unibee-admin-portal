import { Divider, message, Select, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import HiddenIcon from '../../../assets/hidden.svg?react'
import { formatPlanPrice } from '../../../helpers'
import { getPlanList } from '../../../requests'
import {
  IPlan,
  PlanPublishStatus,
  PlanStatus,
  PlanType
} from '../../../shared.types'
import LongTextPopover from '../../ui/longTextPopover'

interface PlanSelectorProps {
  productId: number
  currentPlanId?: number // this is used only in <ChangePlan /> modal: when upgrade from planA(current) to planB, planA need to be highlighted.
  selectedPlanId: number | null
  filterPredicate?: (plan: IPlan | undefined) => boolean
  onPlanSelected?: (plan: IPlan) => void
}

export const PlanSelector = ({
  productId,
  currentPlanId,
  selectedPlanId,
  onPlanSelected,
  filterPredicate
}: PlanSelectorProps) => {
  // todo: planList can be passed from parent, if null, run getPlanList.
  const [plans, setPlans] = useState<IPlan[]>([])
  const [loading, setLoading] = useState(false)
  const fetchPlan = async () => {
    setLoading(true)
    const [planList, err] = await getPlanList(
      {
        type: [PlanType.MAIN],
        productIds: [productId],
        status: [PlanStatus.ACTIVE],
        page: 0,
        count: 200
      },
      fetchPlan
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { plans } = planList
    setPlans(
      plans == null
        ? []
        : plans.map((p: IPlan) => ({
            ...p,
            ...p.plan
          }))
    )
  }

  useEffect(() => {
    fetchPlan()
  }, [])

  const innerPlans = useMemo(
    () =>
      plans
        .map((p) => {
          // if addons is not empty, set quantity to 1 as default value.
          if (p.addons != null && p.addons.length > 0) {
            p.addons = p.addons.map((a) => ({ ...a, quantity: 1 }))
            return p
          } else {
            return p
          }
        })
        .filter(filterPredicate ?? (() => true)),
    [plans, filterPredicate]
  )

  const optionMapper = (p: IPlan) => ({
    value: p?.id,
    label: (
      <div className="flex items-center" data-plan-name={p.planName}>
        <div>
          <div id="selector-plan-name">
            <LongTextPopover text={p.planName} width="250px" />
          </div>
          <div className="text-xs text-gray-400">{`(${formatPlanPrice(p)})`}</div>
        </div>
        {currentPlanId == p.id && (
          <div className="ml-2">
            <Tag color="orange">Current Plan</Tag>
          </div>
        )}
        {p.publishStatus == PlanPublishStatus.UNPUBLISHED && (
          <div className="absolute flex h-4 w-4" style={{ right: '14px' }}>
            <HiddenIcon />
          </div>
        )}
      </div>
    )
  })

  const options = useMemo(() => {
    const published = innerPlans
      .filter((p) => p.publishStatus != 1)
      .map(optionMapper)
    const divider = {
      value: -1,
      label: (
        <Divider style={{ margin: '2px 0' }}>
          <span className="text-xs font-light text-gray-400">
            ↓ Unpublished plans ↓
          </span>
        </Divider>
      ),
      disabled: true
    }
    const unpublished = innerPlans
      .filter((p) => p.publishStatus == PlanPublishStatus.UNPUBLISHED)
      .map(optionMapper)

    return unpublished.length == 0
      ? published
      : [...published, divider, ...unpublished]
  }, [innerPlans])

  return (
    <Select
      size="large"
      style={{ height: '60px' }}
      showSearch
      loading={loading}
      disabled={loading}
      options={options}
      filterOption={(input, option) => {
        const planName = option?.label.props['data-plan-name']
        return planName?.toLowerCase().includes(input.toLowerCase())
      }}
      value={selectedPlanId}
      onChange={(value) =>
        onPlanSelected?.(innerPlans.find((plan) => plan?.id === value)!)
      }
      className="w-full"
    ></Select>
  )
}
