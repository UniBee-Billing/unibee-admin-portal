import { Button, Divider, Input, InputNumber, message, Modal } from 'antd'
import { useEffect, useState } from 'react'
// import HiddenIcon from '../../../assets/hidden.svg?react'
// import { formatPlanPrice } from '../../../helpers'
import { CURRENCY } from '../../../constants'
import { showAmount } from '../../../helpers'
import { applyDiscountPreviewReq } from '../../../requests'
import {
  DiscountCode,
  DiscountType,
  IPlan,
  IProfile,
  ISubscriptionType,
  TPromoAccount
} from '../../../shared.types'
import { PlanSelector } from '../../user/assignSub/planSelector'
import Plan from '../plan'

interface Props {
  userProfile: IProfile | undefined
  subInfo: ISubscriptionType | null
  selectedPlanId: number | null
  plans: IPlan[]
  discountCode: string
  creditAmt: null | number
  setCreditAmt: (v: number) => void
  onCodeChange: React.ChangeEventHandler<HTMLInputElement>
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
  discountAmount: number
  discountCode: DiscountCode | null // null is used when isValid: false
  failureReason: string
}

const ChangePlan = ({
  userProfile,
  subInfo,
  selectedPlanId,
  plans,
  discountCode,
  creditAmt,
  setCreditAmt,
  onCodeChange,
  setSelectedPlan,
  onAddonChange,
  onCancel,
  onConfirm
}: Props) => {
  const [codePreview, setCodePreview] = useState<DiscountCodePreview | null>(
    null
  ) // null: no code provided
  const [codeChecking, setCodeChecking] = useState(false)

  if (selectedPlanId == null) {
    return null
  }
  const selectedPlan = plans.find((p) => p.id == selectedPlanId)
  if (selectedPlan == null) {
    return null
  }

  const onOK = () => {
    if (
      (codePreview === null && discountCode !== '') || // code provided, but not applied(apply btn not clicked)
      (codePreview !== null && codePreview.discountCode?.code !== discountCode) // code provided and applied, but changed in input field
    ) {
      onPreviewCode()
      return
    }
    onConfirm()
  }

  const getCreditInfo = () => {
    if (
      userProfile == undefined ||
      userProfile.promoCreditAccounts == undefined
    ) {
      return null
    }
    const credit: TPromoAccount | undefined =
      userProfile.promoCreditAccounts?.find((c) => c.currency == 'EUR')
    if (credit == undefined) {
      return { credit: null, note: 'No credit available' }
    }
    return {
      credit: {
        amount: credit.amount,
        currencyAmount: credit.currencyAmount / 100,
        currency: credit.currency,
        exchangeRate: credit.exchangeRate
      },
      note: `Credits available: ${credit.amount} (${showAmount(credit.currencyAmount, credit.currency)})`
    }
  }

  const creditUseNote = () => {
    const credit = getCreditInfo()
    if (credit?.credit == null) {
      return null
    }
    if (creditAmt == 0 || creditAmt == null) {
      return <div className="text-xs text-gray-500">No promo credit used</div>
    }
    if (creditAmt) {
      return (
        <div className="text-xs text-green-500">{`At most ${creditAmt} credits (${(creditAmt * credit.credit.exchangeRate) / 100}${CURRENCY[credit.credit.currency].symbol}) to be used.`}</div>
      )
    }
  }

  const discountCodeUseNote = () => {
    if (discountCode == '' || codePreview == null) {
      return <div className="text-xs text-gray-500">No discount code used</div>
    }
    if (codePreview != null) {
      if (codePreview.isValid) {
        return (
          <div className="text-xs text-green-500">
            Discount code is valid(
            {`${
              codePreview.discountCode?.discountType == DiscountType.PERCENTAGE
                ? codePreview.discountCode?.discountPercentage / 100 + '%'
                : showAmount(
                    codePreview.discountCode?.discountAmount,
                    codePreview.discountCode?.currency
                  )
            } off`}
            )
          </div>
        )
      } else {
        return (
          <div className="text-xs text-red-500">
            {codePreview.failureReason}
          </div>
        )
      }
    }
    return null
  }

  const onPreviewCode = async () => {
    setCodeChecking(true)
    const [res, err] = await applyDiscountPreviewReq(
      discountCode,
      selectedPlanId
    )
    setCodeChecking(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { discountAmount, failureReason, valid } = res
    setCodePreview({
      isValid: valid,
      discountCode: res.discountCode,
      failureReason,
      discountAmount
    })
  }

  useEffect(() => {
    if (discountCode === '') {
      // user manually cleared the code, preview obj also need to be cleared
      setCodePreview(null)
    }
  }, [discountCode])

  return (
    <Modal
      title="Change plan"
      open={true}
      width={'480px'}
      footer={null}
      closeIcon={null}
    >
      <Divider>Choose a new subscription plan</Divider>
      <div className="mx-3 my-6 flex items-center justify-center">
        <PlanSelector
          currentPlanId={subInfo?.planId}
          selectedPlanId={selectedPlanId}
          productId={subInfo!.productId}
          onPlanSelected={(p: IPlan) => setSelectedPlan(p.id)}
        />
      </div>

      <div className="flex items-center justify-center">
        <Plan
          plan={selectedPlan}
          width="320px"
          selectedPlan={selectedPlanId}
          setSelectedPlan={setSelectedPlan}
          onAddonChange={onAddonChange}
          isActive={selectedPlan.id == subInfo?.planId}
        />
      </div>

      <div
        style={{ width: '320px' }}
        className="mx-auto my-4 flex w-64 flex-col justify-center"
      >
        <div className="flex justify-between">
          <InputNumber
            min={1}
            max={getCreditInfo()?.credit?.amount}
            onChange={(v) => setCreditAmt(v as number)}
            style={{ width: 240 }}
            value={creditAmt}
            disabled={getCreditInfo()?.credit == null}
            placeholder={getCreditInfo()?.note}
          />
          <Button>Apply</Button>
        </div>
        <div className="flex">{creditUseNote()}</div>
      </div>

      <div
        style={{ width: '320px' }}
        className="mx-auto my-4 flex w-full flex-col justify-center"
      >
        <div className="flex justify-between">
          <Input
            style={{ width: 240 }}
            value={discountCode}
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
        <div className="flex">{discountCodeUseNote()}</div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={onCancel} disabled={codeChecking}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onOK}
          loading={codeChecking}
          disabled={
            codeChecking || (codePreview !== null && !codePreview.isValid)
          }
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default ChangePlan
