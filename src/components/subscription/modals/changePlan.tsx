import { Button, Divider, Input, message, Modal, Select, Tag } from 'antd'
import { useMemo, useState } from 'react'
import HiddenIcon from '../../../assets/hidden.svg?react'
import { formatPlanPrice } from '../../../helpers'
import { applyDiscountPreviewReq } from '../../../requests'
import { DiscountCode, IPlan, ISubscriptionType } from '../../../shared.types'
import Plan from '../plan'

interface Props {
  isOpen: boolean
  loading: boolean
  subInfo: ISubscriptionType | null
  selectedPlanId: number | null
  plans: IPlan[]
  // onSelectPlanChange: (planId: number) => void;
  setSelectedPlan: (planId: number) => void
  onAddonChange: (
    addonId: number,
    quantity: number | null,
    checked: boolean | null
  ) => void
  onCancel: () => void
  onConfirm: () => void
}

type DiscountCodePreview = {
  isValid: boolean
  preview: DiscountCode | null // null is used when isValid: false
}

const ChangePlan = ({
  isOpen,
  loading,
  subInfo,
  selectedPlanId,
  plans,
  // onSelectPlanChange,
  setSelectedPlan,
  onAddonChange,
  onCancel,
  onConfirm
}: Props) => {
  const [code, setCode] = useState('')
  const [codePreview, setCodePreview] = useState<DiscountCodePreview | null>(
    null
  ) // null: no code provided
  const [codeChecking, setCodeChecking] = useState(false)
  const sameProductPlans = useMemo(
    () => plans.filter((plan) => subInfo?.productId === plan.productId),
    [plans, subInfo]
  )

  if (selectedPlanId == null) {
    return null
  }
  const selectedPlan = plans.find((p) => p.id == selectedPlanId)
  if (selectedPlan == null) {
    return null
  }

  const onCodeChange: React.ChangeEventHandler<HTMLInputElement> = (evt) => {
    // http://localhost:5174/subscription/sub20241118IAi7PXOfVwCwRxg
    // BF-Q4-2024, 50% off
    const v = evt.target.value
    setCode(v)
    if (v === '') {
      setCodePreview(null)
    }
  }

  const onPreviewCode = async () => {
    setCodeChecking(true)
    const [res, err] = await applyDiscountPreviewReq(code, selectedPlanId)
    setCodeChecking(false)
    console.log('apply code preview: ', res)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { valid, discountCode } = res
    setCodePreview({ isValid: valid, preview: discountCode })
  }

  return (
    <Modal
      title="Change plan"
      open={isOpen}
      width={'480px'}
      // onOk={onConfirm}
      // onCancel={onCancel}
      footer={null}
      closeIcon={null}
    >
      <Divider>Choose a new subscription plan</Divider>
      <div className="mx-3 my-6 flex items-center justify-center">
        <Select
          style={{ width: 420 }}
          value={selectedPlanId}
          onChange={setSelectedPlan}
          options={sameProductPlans.map((p) => ({
            label:
              subInfo?.planId == p.id ? (
                <div className="flex w-full items-center justify-between">
                  <div>
                    {p.planName}
                    {`(${formatPlanPrice(p)})`}
                  </div>
                  <div className="mr-3">
                    <Tag color="orange">Current Plan</Tag>
                  </div>
                  {p.publishStatus == 1 && (
                    <div
                      className="absolute flex h-4 w-4"
                      style={{ right: '14px' }}
                    >
                      <HiddenIcon />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <span>
                    {p.planName}
                    {`(${formatPlanPrice(p)})`}
                  </span>
                  {p.publishStatus == 1 && (
                    <div
                      className="absolute flex h-4 w-4"
                      style={{ right: '14px' }}
                    >
                      <HiddenIcon />
                    </div>
                  )}
                </div>
              ),
            value: p.id
          }))}
        />
      </div>

      <div className="flex items-center justify-center">
        <Plan
          plan={selectedPlan}
          selectedPlan={selectedPlanId}
          setSelectedPlan={setSelectedPlan}
          onAddonChange={onAddonChange}
          isActive={selectedPlan.id == subInfo?.planId}
        />
      </div>

      <div className="mx-auto my-4 flex w-64 flex-col justify-center">
        <div className="flex gap-5">
          <Input
            value={code}
            onChange={onCodeChange}
            status={
              codePreview !== null && !codePreview.isValid ? 'error' : undefined
            }
            disabled={codeChecking}
            placeholder="Discount code"
          />
          <Button
            onClick={onPreviewCode}
            loading={codeChecking}
            disabled={codeChecking}
          >
            Apply
          </Button>
        </div>
        <div className="flex">
          {codePreview !== null &&
            (codePreview.isValid ? (
              <>
                <span className="text-xs text-green-500">Code valid</span>
              </>
            ) : (
              <span className="text-xs text-red-500">Code invalid</span>
            ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={
            loading ||
            codeChecking ||
            (codePreview !== null && !codePreview.isValid)
          }
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default ChangePlan
