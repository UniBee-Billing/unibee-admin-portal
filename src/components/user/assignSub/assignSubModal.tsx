import { Button, Divider, Form, Input, message, Modal, Switch } from 'antd'
import update from 'immutability-helper'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { showAmount } from '../../../helpers'
import { useLoading } from '../../../hooks'
// import { PublishStatus } from '../../../hooks/usePlans'
import {
  BusinessUserData,
  createSubscriptionReq,
  UserData
} from '../../../requests'
import { request, Response } from '../../../requests/client'
import {
  AccountType,
  IPlan,
  IProfile,
  WithDoubleConfirmFields
} from '../../../shared.types'
import { useAppConfigStore } from '../../../stores'
import { isEmpty, useDebouncedCallbackWithDefault } from '../../../utils'
import Plan from '../../subscription/plan'
import PaymentMethodSelector from '../../ui/paymentSelector'
import { AccountTypeForm, AccountTypeFormInstance } from './accountTypeForm'
import {
  BusinessAccountValues,
  getValidStatusByMessage
} from './businessAccountForm'
import { CheckoutItem } from './checkoutItem'
import { InfoItem } from './infoItem'
import { PersonalAccountValues } from './personalAccountForm'
import { PlanSelector } from './planSelector'
import { UserInfoCard } from './userInfoCard'

interface Props {
  user: IProfile
  productId: number
  refresh: () => void
  closeModal: () => void
}

type TSelectedAddon = {
  quantity: number
  addonPlanId: number
  checked?: boolean
}

interface CreateSubScriptionBody {
  planId: number
  gatewayId: number
  userId: number
  startIncomplete: boolean
  trialEnd?: number
  user: UserData & Partial<BusinessUserData>
  vatCountryCode: string | undefined
  vatNumber: string | undefined
  discountCode: string | undefined
  addonParams?: TSelectedAddon[]
}

type VATNumberValidateResult = {
  isValid: boolean
}

interface InvoicePreviewData {
  taxAmount: number
  subscriptionAmountExcludingTax: number
  discountAmount: number
}

enum DiscountType {
  PERCENTAGE = 1,
  AMOUNT
}

interface DiscountData {
  discountAmount: number
  discountPercentage: number
  discountType: DiscountType
}

export interface PreviewData {
  taxPercentage: number
  totalAmount: number
  originAmount: number
  discountMessage: string
  vatNumberValidate: VATNumberValidateResult
  vatNumberValidateMessage: string
  invoice: InvoicePreviewData
  discount: DiscountData | null
}

type AccountValues = Pick<PersonalAccountValues, 'country'> &
  BusinessAccountValues

const TRIGGER_PREVIEW_FIELDS = ['country', 'vat', 'discountCode']

export const AssignSubscriptionModal = ({
  user,
  productId,
  closeModal,
  refresh
}: Props) => {
  const appConfig = useAppConfigStore()
  const accountTypeFormRef = useRef<AccountTypeFormInstance>(null)
  const { isLoading, withLoading } = useLoading()
  const [gatewayId, setGatewayId] = useState<undefined | number>(
    appConfig.gateway.find((g) => g.gatewayName === 'stripe')?.gatewayId
  )
  const [selectedPlan, setSelectedPlan] = useState<IPlan | undefined>()
  const [requirePayment, setRequirePayment] = useState(true)
  // const [includeUnpublishedPlan, setIncludeUnpublishedPlan] = useState(false)
  const [applyPromo, setApplyPromo] = useState(false)
  const onApplyPromoChange = () => setApplyPromo(!applyPromo)
  const [accountType, setAccountType] = useState(user.type)
  const [previewData, setPreviewData] = useState<PreviewData | undefined>()
  const [discountCode, setDiscountCode] = useState<string | undefined>()
  const accountFormValues = useRef<AccountValues | undefined>()

  const onAddonChange = (
    addonId: number,
    quantity: number | null,
    checked: boolean | null
  ) => {
    if (selectedPlan == undefined) {
      return
    }
    const addOnIdx = selectedPlan.addons?.findIndex((a) => a.id == addonId)
    if (addOnIdx == -1 || addOnIdx == undefined) {
      return
    }
    let newAddon = selectedPlan.addons
    if (quantity != null) {
      // todo: add quantity is >0 integer check.
      newAddon = update(newAddon, {
        [addOnIdx]: { quantity: { $set: quantity } }
      })
    }
    if (checked != null) {
      newAddon = update(newAddon, {
        [addOnIdx]: { checked: { $set: checked } }
      })
    }

    setSelectedPlan(update(selectedPlan, { addons: { $set: newAddon } }))
  }

  const parsedTax = useMemo(
    () => (previewData?.taxPercentage ?? 0) / 100,
    [previewData]
  )

  const formatAmount = useCallback(
    (amount: number | undefined) =>
      selectedPlan && !isEmpty(amount)
        ? showAmount(amount, selectedPlan.currency)
        : undefined,
    [selectedPlan]
  )

  const formattedDiscountValue = useMemo(() => {
    const discount = previewData?.discount

    if (!discount) {
      return
    }

    return discount.discountType === DiscountType.PERCENTAGE
      ? `${discount.discountPercentage / 100}%`
      : showAmount(discount.discountAmount, selectedPlan?.currency)
  }, [selectedPlan, previewData])

  const formattedDiscountLabel = useMemo(
    () =>
      previewData?.discount?.discountType === DiscountType.PERCENTAGE
        ? 'Discounted percentage'
        : 'Discounted amount',
    [previewData]
  )

  const getSubmitData = useCallback(
    (values?: AccountValues) => {
      const {
        country,
        address,
        companyName,
        vat,
        postalCode,
        registrationNumber,
        city
      } = values ?? {}

      const personalUserData = {
        email: user.email,
        countryCode: country,
        type: accountType
      }
      const userData =
        accountType === AccountType.PERSONAL
          ? personalUserData
          : {
              ...personalUserData,
              address,
              companyName,
              zipCode: postalCode,
              vatNumber: vat,
              registrationNumber,
              city
            }

      const submitData = {
        planId: selectedPlan?.id,
        gatewayId: gatewayId,
        userId: user.id!,
        startIncomplete: false,
        user: userData,
        vatNumber: vat,
        vatCountryCode: country,
        discountCode: discountCode,
        addonParams: [] as TSelectedAddon[]
      }
      if (selectedPlan?.addons != null && selectedPlan.addons.length > 0) {
        submitData.addonParams = selectedPlan.addons
          .filter((a) => a.checked)
          .map((a) => ({ quantity: a.quantity as number, addonPlanId: a.id }))
      }

      if (!requirePayment) {
        const fiveYearFromNow = new Date(
          new Date().setFullYear(new Date().getFullYear() + 5)
        )

        return {
          ...submitData,
          trialEnd: Math.round(fiveYearFromNow.getTime() / 1000)
        }
      }

      return { ...submitData, startIncomplete: true }
    },
    [
      selectedPlan,
      gatewayId,
      user,
      accountType,
      discountCode,
      user,
      requirePayment
    ]
  )

  const onSubmit = async () => {
    const values = await accountTypeFormRef.current?.submit()

    if (!previewData) {
      message.error(
        'Please wait for the price to be calculated before proceeding with the payment'
      )
      return
    }

    if (previewData.discountMessage) {
      message.error(previewData.discountMessage)
      return
    }

    if (!selectedPlan) {
      message.error('Please choose a plan')
      return
    }
    if (!gatewayId) {
      message.error('Please choose a payment method')
      return
    }

    const submitData = getSubmitData(values)

    const body = {
      ...submitData,
      confirmTotalAmount: previewData?.totalAmount,
      confirmCurrency: selectedPlan?.currency
    } as WithDoubleConfirmFields<CreateSubScriptionBody>
    if (selectedPlan.addons != undefined && selectedPlan.addons.length > 0) {
      body.addonParams = selectedPlan.addons
        .filter((a) => a.checked)
        .map((a) => ({
          quantity: a.quantity,
          addonPlanId: a.id
        })) as TSelectedAddon[]
    }
    /*
    type TSelectedAddon = {
  quantity: number
  addonPlanId: number
  checked?: boolean
}
    */

    const [_, err] = await withLoading(async () => createSubscriptionReq(body))

    if (err) {
      message.error(err.message)
      return
    }

    message.success('Subscription created')
    closeModal()
    refresh()
  }

  const updatePrice = useCallback(async () => {
    const [data, err] = await withLoading(async () => {
      const submitData = getSubmitData(accountFormValues.current)

      return request.post<Response<PreviewData>>(
        '/merchant/subscription/create_preview',
        submitData
      )
    })

    if (err) {
      message.error(err.message)
      return
    }

    const previewData = data?.data?.data

    setPreviewData(previewData)
  }, [getSubmitData])

  const debouncedUpdateDiscountCode = useDebouncedCallbackWithDefault(
    (value: string) => setDiscountCode(value)
  )

  useEffect(() => {
    if (!selectedPlan) {
      return
    }

    updatePrice()
  }, [selectedPlan, updatePrice])

  return (
    <Modal
      title="Choose a subscription plan"
      open={true}
      width={'720px'}
      footer={[
        <Button onClick={closeModal} disabled={isLoading}>
          Cancel
        </Button>,
        <Button
          type="primary"
          onClick={onSubmit}
          loading={isLoading}
          disabled={isLoading || isEmpty(selectedPlan)}
        >
          OK
        </Button>
      ]}
      closeIcon={null}
    >
      <div className="my-6">
        <UserInfoCard user={user} />
        <Divider orientation="left" style={{ margin: '16px 0' }} />
        <div className="flex gap-8">
          <div className="w-1/2">
            <div className="mb-2 text-lg font-bold text-gray-600">
              Choose plan
            </div>
            <PlanSelector
              onPlanSelected={setSelectedPlan}
              productId={productId.toString()}
            />

            {selectedPlan && (
              <div className="mt-4 flex justify-center">
                <Plan
                  plan={selectedPlan}
                  selectedPlan={selectedPlan.id}
                  isThumbnail
                  isActive={false}
                  onAddonChange={onAddonChange}
                />
              </div>
            )}
            <InfoItem title="Account type" className="mt-6">
              <AccountTypeForm
                loading={isLoading}
                previewData={previewData}
                onFormValuesChange={(changedValues, values, accountType) => {
                  const [changedKey] = Object.keys(changedValues)

                  setAccountType(accountType)
                  accountFormValues.current = values as AccountValues

                  if (
                    TRIGGER_PREVIEW_FIELDS.includes(changedKey) &&
                    selectedPlan
                  ) {
                    updatePrice()
                  }
                }}
                ref={accountTypeFormRef}
                user={user}
              ></AccountTypeForm>
            </InfoItem>
          </div>

          <div className="w-1/2">
            <div className="mb-2 text-lg font-bold text-gray-600">Payment</div>
            <div className="mr-16 w-full flex-1">
              <PaymentMethodSelector
                selected={gatewayId}
                onSelect={setGatewayId}
                disabled={isLoading}
              />
            </div>

            <div className="mt-4 flex-1">
              <InfoItem title="Discount code">
                <Form.Item
                  validateStatus={getValidStatusByMessage(
                    previewData?.discountMessage
                  )}
                  help={previewData?.discountMessage}
                >
                  <Input
                    onChange={(e) =>
                      debouncedUpdateDiscountCode(e.target.value)
                    }
                    placeholder="Discount code"
                  />
                </Form.Item>
              </InfoItem>

              <div className="mt-1">
                <InfoItem title="Require payment" horizontal isBold={false}>
                  <Switch
                    value={requirePayment}
                    onChange={(switched) => setRequirePayment(switched)}
                  />
                </InfoItem>
              </div>
              <div className="mt-2">
                <div className="flex justify-between">
                  <div>Apply promo credits</div>
                  <div>
                    <Switch value={applyPromo} onChange={onApplyPromoChange} />
                  </div>
                </div>
              </div>

              {applyPromo && (
                <div className="mt-2">
                  <div className="flex justify-between">
                    <Input style={{ width: 240 }} />
                    <div></div>
                  </div>
                </div>
              )}

              <div className="my-8 h-[1px] w-full bg-gray-100"></div>
              <CheckoutItem
                label="Subtotal"
                loading={isLoading}
                value={formatAmount(
                  previewData?.invoice.subscriptionAmountExcludingTax
                )}
              />
              {selectedPlan && (
                <CheckoutItem
                  loading={isLoading}
                  label={`Tax(${parsedTax}%)`}
                  value={formatAmount(previewData?.invoice.taxAmount)}
                />
              )}
              <CheckoutItem
                label={formattedDiscountLabel}
                loading={isLoading}
                value={formattedDiscountValue}
              />
              {selectedPlan && (
                <div className="my-8 h-[1px] w-full bg-gray-100"></div>
              )}
              <CheckoutItem
                labelStyle="text-lg"
                loading={isLoading}
                label="Total"
                value={formatAmount(previewData?.totalAmount)}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
