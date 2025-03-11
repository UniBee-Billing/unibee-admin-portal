import {
  Button,
  Divider,
  Input,
  InputNumber,
  message,
  Modal,
  Switch
} from 'antd'
import { Currency } from 'dinero.js'
import update from 'immutability-helper'
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { showAmount } from '../../../helpers'
import { useLoading } from '../../../hooks'
import {
  BusinessUserData,
  createSubscriptionReq,
  UserData
} from '../../../requests'
import { request, Response } from '../../../requests/client'
import {
  AccountType,
  DiscountType,
  IPlan,
  IProfile,
  PlanStatus,
  TPromoAccount,
  WithDoubleConfirmFields
} from '../../../shared.types'
import { useAppConfigStore } from '../../../stores'
import { isEmpty } from '../../../utils'
import Plan from '../../subscription/plan'
import PaymentMethodSelector from '../../ui/paymentSelector'
import { AccountTypeForm, AccountTypeFormInstance } from './accountTypeForm'
import { BusinessAccountValues } from './businessAccountForm'
import { CheckoutItem } from './checkoutItem'
import { InfoItem } from './infoItem'
import { PersonalAccountValues } from './personalAccountForm'
import { PlanSelector } from './planSelector'
import { UserInfoCard } from './userInfoCard'

interface Props {
  user: IProfile
  productId: number
  refresh: () => void // after assigning a sub to a user, we need to refresh subscription detail in parent
  refreshUserProfile: () => void // if credit is used, we need to refresh user profile in grand-grand parent
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
  gatewayPaymentType?: string
  userId: number
  startIncomplete: boolean
  trialEnd?: number
  user: UserData & Partial<BusinessUserData>
  vatCountryCode: string | undefined
  vatNumber: string | undefined
  discountCode: string | undefined
  addonParams?: TSelectedAddon[]
  applyPromoCredit?: boolean
  applyPromoCreditAmount?: number
}

type VATNumberValidateResult = {
  isValid: boolean
}

interface InvoicePreviewData {
  taxAmount: number
  currency: string
  subscriptionAmountExcludingTax: number
  discountAmount: number
  promoCreditDiscountAmount: number
  promoCreditPayout?: {
    creditAmount: number
    currencyAmount: number
    exchangeRate: number
  }
  promoCreditAccount?: TPromoAccount
}

interface DiscountData {
  discountAmount: number
  discountPercentage: number
  discountType: DiscountType
  currency: string
  code: string
}

export interface PreviewData {
  currency: string
  taxPercentage: number
  totalAmount: number
  originAmount: number
  discountMessage: string
  discountAmount: number
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
  refresh,
  refreshUserProfile
}: Props) => {
  const appConfig = useAppConfigStore()
  const accountTypeFormRef = useRef<AccountTypeFormInstance>(null)
  const { isLoading, withLoading } = useLoading()
  const [loading, setLoading] = useState(false)
  const [gatewayId, setGatewayId] = useState<undefined | number>(
    appConfig.gateway.find((g) => g.gatewayName === 'stripe')?.gatewayId
  )
  const [gatewayPaymentType, setGatewayPaymentType] = useState<
    string | undefined
  >()
  const [selectedPlan, setSelectedPlan] = useState<IPlan | undefined>()
  const [requirePayment, setRequirePayment] = useState(true)
  const [accountType, setAccountType] = useState(user.type)
  const [previewData, setPreviewData] = useState<PreviewData | undefined>()
  const [discountCode, setDiscountCode] = useState<string | undefined>()
  const accountFormValues = useRef<AccountValues | undefined>()
  const [creditAmt, setCreditAmt] = useState<null | number>(null)

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
    if (previewData == null) {
      return undefined
    }

    return showAmount(-1 * previewData.discountAmount, previewData.currency)
  }, [selectedPlan, previewData])

  const formattedDiscountLabel = useMemo(
    () =>
      previewData?.discount?.discountType === DiscountType.PERCENTAGE
        ? `Discounted Amount(${previewData.discount.discountPercentage / 100}%)`
        : 'Discounted Amount',
    [previewData]
  )

  const getSubmitData = (values?: AccountValues) => {
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
      gatewayPaymentType: gatewayPaymentType,
      userId: user.id!,
      startIncomplete: false,
      user: userData,
      vatNumber: vat,
      vatCountryCode: country,
      discountCode: discountCode,
      addonParams: [] as TSelectedAddon[],
      applyPromoCredit: creditAmt != null && creditAmt > 0,
      applyPromoCreditAmount: creditAmt
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
  }

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
      confirmCurrency: selectedPlan?.currency,
      applyPromoCredit: creditAmt != null && creditAmt > 0,
      applyPromoCreditAmount: creditAmt
    } as WithDoubleConfirmFields<CreateSubScriptionBody>
    if (selectedPlan.addons != undefined && selectedPlan.addons.length > 0) {
      body.addonParams = selectedPlan.addons
        .filter((a) => a.checked)
        .map((a) => ({
          quantity: a.quantity,
          addonPlanId: a.id
        })) as TSelectedAddon[]
    }

    setLoading(true)
    const [_, err] = await createSubscriptionReq(body)
    setLoading(false)
    if (err) {
      message.error(err.message)
      return
    }

    message.success('Subscription created')
    closeModal()
    refresh()
    if (creditAmt != null && creditAmt != 0) {
      // even creditAmt is > 0, it's not necessarily used, discountCode might cover the whole payment
      refreshUserProfile() // but to make things simple, just refresh it.
    }
  }

  const updatePrice = async () => {
    if (selectedPlan == null) {
      message.error('Please choose a plan')
      return
    }
    if (gatewayId == null) {
      message.error('Please choose a payment method')
      return
    }
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
    if (previewData.discount != null) {
      setDiscountCode(previewData.discount.code)
    }
    setPreviewData(previewData)
  }
  // }, [getSubmitData])

  const getCreditInfo = () => {
    if (user == undefined || user.promoCreditAccounts == undefined) {
      return null
    }
    const credit: TPromoAccount | undefined = user.promoCreditAccounts?.find(
      (c) => c.currency == 'EUR'
    )
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
        <div className="mt-1 text-xs text-green-500">{`At most ${creditAmt} credits (${appConfig.currency[credit.credit.currency as Currency]?.Symbol}${(creditAmt * credit.credit.exchangeRate) / 100}) to be used.`}</div>
      )
    }
  }

  const discountCodeUseNote = () => {
    if (
      previewData == null ||
      (previewData.discount == null && previewData.discountMessage == '')
    ) {
      return <div className="text-xs text-gray-500">No discount code used</div>
    }
    // discountMessage is discount related error message
    if (previewData.discount == null && previewData.discountMessage != '') {
      // invalid discount code or other error
      return (
        <div className="text-xs text-red-500">
          {previewData.discountMessage}
        </div>
      )
    }
    if (previewData.discount != null) {
      if (previewData.discount.discountType == DiscountType.PERCENTAGE) {
        return (
          <div className="text-xs text-green-500">{`
            Discount code is valid(${previewData.discount.discountPercentage / 100}% off).
            `}</div>
        )
      } else {
        return (
          <div className="text-xs text-green-500">
            {`Discount code is valid(${showAmount(
              previewData.discount.discountAmount,
              previewData.discount.currency
            )} off).`}
          </div>
        )
      }
    }
    return null
  }

  const onApplyPromoCredit = () => {
    if (creditAmt != null && creditAmt <= 0) {
      message.error('Please enter a valid amount')
      return
    }
    updatePrice()
  }

  const onApplyDiscountCode = () => {
    updatePrice()
  }

  useEffect(() => {
    if (!selectedPlan) {
      return
    }
    updatePrice()
  }, [selectedPlan, requirePayment, gatewayId, gatewayPaymentType]) // different gateway has different vat rate, so we need to update the price when gateway changed

  const onDiscountCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDiscountCode(e.target.value)
    if (e.target.value == '' && previewData != null) {
      const preview = JSON.parse(JSON.stringify(previewData))
      preview.discount = null
      preview.discountMessage = ''
      preview.discountAmount = 0
      setPreviewData(preview)
    }
  }

  return (
    <Modal
      title="Choose a Subscription Plan"
      open={true}
      width={'760px'}
      footer={[
        <Button key="cancel" onClick={closeModal} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="ok"
          type="primary"
          onClick={onSubmit}
          loading={loading}
          disabled={
            loading ||
            isEmpty(selectedPlan) ||
            (previewData != null && previewData.discountMessage != '')
          }
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
            <div className="mb-2 text-lg text-gray-800">Choose plan</div>
            <PlanSelector
              onPlanSelected={setSelectedPlan}
              productId={productId}
              selectedPlanId={
                selectedPlan == undefined ? null : selectedPlan.id
              }
              filterPredicate={(p) =>
                p?.status != PlanStatus.SOFT_ARCHIVED &&
                p?.status != PlanStatus.HARD_ARCHIVED
              }
            />

            {selectedPlan && (
              <div className="mt-4 flex justify-center">
                <Plan
                  plan={selectedPlan}
                  width="280px"
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
            <div className="text-lg text-gray-800">Payment</div>
            <div className="my-4">
              <InfoItem title="Require payment" horizontal isBold={false}>
                <Switch
                  value={requirePayment}
                  onChange={(switched) => setRequirePayment(switched)}
                />
              </InfoItem>
            </div>
            <div className="mr-16 w-full flex-1">
              <PaymentMethodSelector
                selected={gatewayId}
                selectedPaymentType={gatewayPaymentType}
                onSelect={setGatewayId}
                onSelectPaymentType={setGatewayPaymentType}
                disabled={isLoading || !requirePayment}
              />
            </div>

            <div className="mt-4 flex-1">
              <div className="mb-1 mt-2 text-gray-700">Promo Credit</div>
              <div className="mb-1 flex justify-between">
                <InputNumber
                  placeholder={getCreditInfo()?.note}
                  min={1}
                  style={{ width: 240 }}
                  value={creditAmt}
                  onChange={(value) => setCreditAmt(value)}
                />
                <Button onClick={onApplyPromoCredit}>Apply</Button>
              </div>
              {creditUseNote()}

              <div className="mb-1 mt-4 text-gray-700">Discount Code</div>
              <div className="mb-1 flex justify-between">
                <Input
                  style={{ width: 240 }}
                  value={discountCode}
                  onChange={onDiscountCodeChange}
                />
                <Button onClick={onApplyDiscountCode}>Apply</Button>
              </div>
              {discountCodeUseNote()}

              <div className="my-8 h-[1px] w-full bg-gray-100"></div>
              <CheckoutItem
                label="Subtotal"
                loading={isLoading}
                value={formatAmount(
                  previewData?.invoice.subscriptionAmountExcludingTax
                )}
              />
              {previewData != undefined &&
                previewData.invoice.promoCreditDiscountAmount != 0 && (
                  <CheckoutItem
                    label={`Credit used(${previewData.invoice.promoCreditPayout?.creditAmount})`}
                    loading={isLoading}
                    value={showAmount(
                      -1 * previewData.invoice.promoCreditDiscountAmount,
                      previewData.invoice.currency
                    )}
                  />
                )}
              <CheckoutItem
                label={formattedDiscountLabel}
                loading={isLoading}
                value={formattedDiscountValue}
              />

              {selectedPlan && (
                <CheckoutItem
                  loading={isLoading}
                  label={`Tax(${parsedTax}%)`}
                  value={formatAmount(previewData?.invoice.taxAmount)}
                />
              )}
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
