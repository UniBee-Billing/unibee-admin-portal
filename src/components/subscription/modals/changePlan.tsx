import {
  Button,
  Divider,
  Input,
  InputNumber,
  message,
  Modal,
  Tooltip
} from 'antd'
import { useEffect, useState } from 'react'
// import HiddenIcon from '../../../assets/hidden.svg?react'
// import { formatPlanPrice } from '../../../helpers'
import { InfoCircleOutlined } from '@ant-design/icons'
import { CURRENCY } from '../../../constants'
import { showAmount } from '../../../helpers'
import { applyDiscountPreviewReq } from '../../../requests'
import {
  DiscountCode,
  IPlan,
  IProfile,
  ISubscriptionType,
  TPromoAccount
} from '../../../shared.types'
import CouponPopover from '../../ui/couponPopover'
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
  preview: DiscountCode | null // null is used when isValid: false
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
  /*
  const sameProductPlans = useMemo(
    () => plans.filter((plan) => subInfo?.productId === plan.productId),
    [plans, subInfo]
  )
    */

  // const [creditAmt, setCreditAmt] = useState<null | number>(null)
  /*
  const onCreditAmtChange = (v: number) => {
    setCreditAmt(v)
  }
    */

  if (selectedPlanId == null) {
    return null
  }
  const selectedPlan = plans.find((p) => p.id == selectedPlanId)
  if (selectedPlan == null) {
    return null
  }

  const onOK = () => {
    if (
      (codePreview === null && discountCode !== '') || // code provided, but not applied
      (codePreview !== null && codePreview.preview?.code !== discountCode) // code provided and applied, but changed in input field
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
        <div className="mt-1 text-xs text-green-500">{`${creditAmt} credits (${(creditAmt * credit.credit.exchangeRate) / 100}${CURRENCY[credit.credit.currency].symbol}) to be used.`}</div>
      )
    }
  }

  useEffect(() => {
    if (discountCode === '') {
      // user manually cleared the code, preview obj also need to be cleared
      setCodePreview(null)
    }
  }, [discountCode])

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
    setCodePreview({ isValid: res.valid, preview: res.discountCode })
  }

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
        {/* <Select
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
        /> */}
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
        <div className="flex justify-between">
          <Input
            style={{ width: 170 }}
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
        <div className="flex">
          {codePreview !== null &&
            (codePreview.isValid ? (
              <>
                <span className="text-xs text-green-500">
                  Code is valid{' '}
                  <CouponPopover coupon={codePreview.preview as DiscountCode} />
                </span>
              </>
            ) : (
              <span className="text-xs text-red-500">Code is invalid</span>
            ))}
        </div>
      </div>

      <div className="mx-auto my-4 flex w-64 flex-col justify-center">
        <div className="flex justify-between">
          <div>
            <InputNumber
              min={0}
              max={getCreditInfo()?.credit?.amount}
              onChange={(v) => setCreditAmt(v as number)}
              style={{ width: 170 }}
              value={creditAmt}
              disabled={getCreditInfo()?.credit == null}
              placeholder="Promo credit"
            />
            &nbsp;&nbsp;&nbsp;&nbsp;
            {userProfile != undefined && (
              <Tooltip title={getCreditInfo()?.note}>
                <InfoCircleOutlined />
              </Tooltip>
            )}
          </div>
        </div>
        <div className="flex">{creditUseNote()}</div>
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
