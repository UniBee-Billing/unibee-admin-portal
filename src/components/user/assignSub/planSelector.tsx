import { message, Select } from 'antd'
import { useMemo } from 'react'
import { PlanStatus, PlanType, usePlans } from '../../../hooks/usePlans'
import { IPlan } from '../../../shared.types'

interface PlanSelectorProps {
  productId: string
  filterPredicate?: (plan: IPlan | undefined) => boolean
  onPlanSelected?: (plan: IPlan) => void
}

export const PlanSelector = ({
  productId,
  onPlanSelected,
  filterPredicate
}: PlanSelectorProps) => {
  const { data, loading } = usePlans({
    type: PlanType.MAIN,
    productIds: [productId],
    status: PlanStatus.ACTIVE,
    onError: (err) => {
      message.error(err.message)
    }
  })

  const innerPlans = useMemo(
    () =>
      data
        .map((planWrapper) => ({ ...planWrapper, ...planWrapper.plan }))
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
    [data, filterPredicate]
  )

  const options = useMemo(
    () =>
      innerPlans.map((plan) => ({ value: plan?.id, label: plan?.planName })),
    [innerPlans]
  )

  return (
    <Select
      showSearch
      loading={loading}
      disabled={loading}
      options={options}
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      onChange={(value) =>
        onPlanSelected?.(innerPlans.find((plan) => plan?.id === value)!)
      }
      className="w-full"
    ></Select>
  )
}
