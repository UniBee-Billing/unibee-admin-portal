import { PLAN_TYPE } from '@/constants'
import {
  Alert,
  Button,
  DatePicker,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
} from 'antd'
import dayjs from 'dayjs'
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
  UserData,
  getCreditConfigForCurrencyReq
} from '../../../requests'
import { request, Response } from '../../../requests/client'
import {
  AccountType,
  DiscountType,
  IPlan,
  IProfile,
  PlanStatus,
  PlanType,
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

interface MultiCurrency {
  currency: string
  autoExchange: boolean
  exchangeRate: number
  amount: number
  disable: boolean
}

// Extended plan interface to include multiCurrencies
interface IPlanWithMultiCurrencies extends IPlan {
  multiCurrencies?: MultiCurrency[]
}

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
  freeTimeEnd?: number
  user: UserData & Partial<BusinessUserData>
  vatCountryCode: string | undefined
  vatNumber: string | undefined
  discountCode: string | undefined
  addonParams?: TSelectedAddon[]
  applyPromoCredit?: boolean
  applyPromoCreditAmount?: number
  currency: string // Add currency field
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

// Add enum for payment requirement options
enum PaymentRequireType {
  ACTIVATE_AFTER_PAYMENT = 'activateAfterPayment',
  ACTIVATE_BEFORE_PAYMENT = 'activateBeforePayment',
  FREE_FIRST_PERIOD = 'freeForFirstPeriod'
}

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
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>(
    PlanType.MAIN
  )
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>()
  const [creditConfigEnabled, setCreditConfigEnabled] = useState<boolean>(false)
  const [fetchingCreditConfig, setFetchingCreditConfig] = useState<boolean>(false)

  useEffect(() => {
    setSelectedPlan(undefined)
    setSelectedCurrency(undefined)
  }, [selectedPlanType])

  // Update selected currency only when a different plan is selected (not on addon toggle)
  const prevPlanIdRef = useRef<number | undefined>()
  useEffect(() => {
    if (selectedPlan) {
      if (prevPlanIdRef.current !== selectedPlan.id) {
        setSelectedCurrency(selectedPlan.currency)
      }
      prevPlanIdRef.current = selectedPlan.id
    } else {
      setSelectedCurrency(undefined)
      prevPlanIdRef.current = undefined
    }
  }, [selectedPlan])

  // Replace requirePayment boolean with enum
  const [paymentRequireType, setPaymentRequireType] = useState<PaymentRequireType>(PaymentRequireType.ACTIVATE_AFTER_PAYMENT)
  const [freeMode, setFreeMode] = useState<'custom_end_time' | 'one_period'>('custom_end_time')
  const [freeEndDate, setFreeEndDate] = useState<dayjs.Dayjs | null>(null)

  // Reset free mode state when payment type changes
  useEffect(() => {
    setFreeMode('custom_end_time')
    setFreeEndDate(null)
  }, [paymentRequireType])

  // Use the "To" date as the free end time for validation/submission
  const combinedFreeEndTime = useMemo(() => {
    if (!freeEndDate) return null
    return freeEndDate
  }, [freeEndDate])

  const isFreeEndTimeValid = useMemo(() => {
    if (paymentRequireType !== PaymentRequireType.FREE_FIRST_PERIOD) return true
    if (freeMode !== 'custom_end_time') return true
    return combinedFreeEndTime != null && combinedFreeEndTime.isAfter(dayjs())
  }, [paymentRequireType, freeMode, combinedFreeEndTime])

  const [accountType, setAccountType] = useState(user.type)
  const [previewData, setPreviewData] = useState<PreviewData | undefined>()
  const [discountCode, setDiscountCode] = useState<string | undefined>()
  const accountFormValues = useRef<AccountValues | undefined>()
  const [creditAmt, setCreditAmt] = useState<null | number>(null)

  // Fetch credit config when plan currency changes
  const fetchCreditConfig = useCallback(async (currency: string) => {
    if (!currency) return;
    
    setFetchingCreditConfig(true);
    try {
      const [result, error] = await getCreditConfigForCurrencyReq(currency);
      
      if (error || result === null) {
        setCreditConfigEnabled(false);
      } else {
        setCreditConfigEnabled(result.isEnabled);
      }
    } catch (_error) {
      setCreditConfigEnabled(false);
    } finally {
      setFetchingCreditConfig(false);
    }
  }, []);

  // Update credit config when selected currency changes
  useEffect(() => {
    if (selectedCurrency) {
      fetchCreditConfig(selectedCurrency);
    } else {
      setCreditConfigEnabled(false);
    }
  }, [selectedCurrency, fetchCreditConfig]);

  // Get available currencies for the selected plan
  const getAvailableCurrencies = useCallback(() => {
    if (!selectedPlan) return [];
    
    const currencies: string[] = [selectedPlan.currency];
    const planWithMultiCurrencies = selectedPlan as IPlanWithMultiCurrencies;
    
    // Add multiCurrencies if they exist (only enabled ones)
    if (planWithMultiCurrencies.multiCurrencies && planWithMultiCurrencies.multiCurrencies.length > 0) {
      planWithMultiCurrencies.multiCurrencies.forEach((multiCurrency: MultiCurrency) => {
        // Only add currencies that are not disabled
        if (!multiCurrency.disable && !currencies.includes(multiCurrency.currency)) {
          currencies.push(multiCurrency.currency);
        }
      });
    }
    
    return currencies;
  }, [selectedPlan]);

  // Get price for selected currency
  const getPlanPriceForCurrency = useCallback((currency?: string) => {
    if (!selectedPlan || !currency) return selectedPlan?.amount;
    
    const planWithMultiCurrencies = selectedPlan as IPlanWithMultiCurrencies;
    
    // If it's the main currency, return the main amount
    if (currency === selectedPlan.currency) {
      return selectedPlan.amount;
    }
    
    // Look for the currency in multiCurrencies
    if (planWithMultiCurrencies.multiCurrencies && planWithMultiCurrencies.multiCurrencies.length > 0) {
      const multiCurrency = planWithMultiCurrencies.multiCurrencies.find((mc: MultiCurrency) => mc.currency === currency);
      if (multiCurrency) {
        return multiCurrency.amount;
      }
    }
    
    return selectedPlan.amount;
  }, [selectedPlan]);

  // Get addon price for selected currency
  const getAddonPriceForCurrency = useCallback((addon: IPlan, currency?: string) => {
    if (!currency) return addon.amount;

    if (currency === addon.currency) {
      return addon.amount;
    }

    const addonWithMultiCurrencies = addon as IPlanWithMultiCurrencies;
    if (addonWithMultiCurrencies.multiCurrencies && addonWithMultiCurrencies.multiCurrencies.length > 0) {
      const multiCurrency = addonWithMultiCurrencies.multiCurrencies.find((mc: MultiCurrency) => mc.currency === currency);
      if (multiCurrency) {
        return multiCurrency.amount;
      }
    }

    return addon.amount;
  }, []);

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
      selectedCurrency && !isEmpty(amount)
        ? showAmount(amount, selectedCurrency)
        : undefined,
    [selectedCurrency]
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
      applyPromoCreditAmount: creditAmt,
      // Use selectedCurrency only if it's valid for the selected plan
      currency: selectedCurrency
    }
    if (selectedPlan?.addons != null && selectedPlan.addons.length > 0) {
      submitData.addonParams = selectedPlan.addons
        .filter((a) => a.checked)
        .map((a) => ({ quantity: a.quantity as number, addonPlanId: a.id }))
    }

    // Use the new payment requirement type
    if (paymentRequireType === PaymentRequireType.FREE_FIRST_PERIOD) {
      if (freeMode === 'custom_end_time' && combinedFreeEndTime) {
        return {
          ...submitData,
          freeInInitialPeriod: true,
          freeTimeEnd: combinedFreeEndTime.unix()
        }
      }
      // one_period mode
      return {
        ...submitData,
        freeInInitialPeriod: true
      }
    }

    if (paymentRequireType === PaymentRequireType.ACTIVATE_BEFORE_PAYMENT) {
      return { ...submitData, startIncomplete: true }
    }

    // Default case: ACTIVATE_AFTER_PAYMENT - don't modify the submitData
    return submitData
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
    // Prevent submitting when selected currency is not valid for the selected plan
    if (selectedPlan && selectedCurrency) {
      const currencies = getAvailableCurrencies()
      if (!currencies.includes(selectedCurrency)) {
        message.error('Selected currency is not available for this plan')
        return
      }
    }

    // Validate freeEndTime for custom_end_time mode
    if (
      paymentRequireType === PaymentRequireType.FREE_FIRST_PERIOD &&
      freeMode === 'custom_end_time'
    ) {
      if (!combinedFreeEndTime || combinedFreeEndTime.isBefore(dayjs())) {
        message.error('Please select a free end time that is later than the current time')
        return
      }
    }

    const submitData = getSubmitData(values)

    const body = {
      ...submitData,
      confirmTotalAmount: previewData?.totalAmount,
      currency: selectedCurrency, // Use selected currency instead of plan's default
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
    if (!creditConfigEnabled) {
      return null
    }
    if (user == undefined || user.promoCreditAccounts == undefined) {
      return null
    }
    const credit: TPromoAccount | undefined = user.promoCreditAccounts?.find(
      (c) => c.currency == (selectedCurrency || 'EUR')
    )
    if (credit == undefined) {
      return { credit: null, note: `No credit available for ${selectedCurrency}` }
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
    if (creditAmt && previewData) {
      return (
        <div className="mt-1 text-xs text-green-500">{`Credit used(${previewData.invoice.promoCreditPayout?.creditAmount}) ${showAmount(-1 * previewData.invoice.promoCreditDiscountAmount, previewData.invoice.currency)}`}</div>
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

  // Get placeholder text for promo credit input
  const getPromoCreditPlaceholder = () => {
    if (!creditConfigEnabled && selectedCurrency) {
      return `Not configured for ${selectedCurrency}`;
    }
    return getCreditInfo()?.note || '';
  };

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
    if (!selectedPlan || !selectedCurrency) {
      return
    }
    // Only update price when the currency is valid for the current plan
    const currencies = getAvailableCurrencies()
    if (!currencies.includes(selectedCurrency)) {
      return
    }
    // Debounce to avoid firing for transient currency changes (e.g., RUB -> USD)
    const timer = setTimeout(() => {
      updatePrice()
    }, 250)
    return () => clearTimeout(timer)
  }, [selectedPlan, selectedCurrency, paymentRequireType, gatewayId, gatewayPaymentType]) // different gateway has different vat rate, so we need to update the price when gateway changed

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

  // Check if credit input should be disabled
  const isCreditInputDisabled = !creditConfigEnabled || !getCreditInfo()?.credit || fetchingCreditConfig;

  return (
    <Modal
      title="Choose and Assign Subscription Plan"
      open={true}
      width={'800px'}
      onCancel={closeModal}
      styles={{ header: { textAlign: 'center', borderBottom: 'none', paddingBottom: 0 }, body: { padding: '24px' }, content: { padding: '20px 24px' } }}
      footer={
        <div style={{ display: 'flex', gap: 16, padding: '0' }}>
          <Button
            key="cancel"
            onClick={closeModal}
            disabled={loading}
            style={{ flex: 1, height: 44, borderRadius: 8, fontWeight: 500, fontSize: 15 }}
          >
            Cancel
          </Button>
          <Button
            key="ok"
            type="primary"
            onClick={onSubmit}
            loading={loading}
            disabled={
              loading ||
              isEmpty(selectedPlan) ||
              (previewData != null && previewData.discountMessage != '') ||
              !selectedCurrency ||
              (selectedPlan != null && selectedCurrency != null && !getAvailableCurrencies().includes(selectedCurrency)) ||
              !isFreeEndTimeValid
            }
            style={{ flex: 1, height: 44, borderRadius: 8, fontWeight: 600, fontSize: 15 }}
          >
            Confirm
          </Button>
        </div>
      }
    >
      <div>
        <UserInfoCard user={user} />
        <div className="flex gap-8" style={{ marginTop: 24 }}>
          <div className="w-1/2">
            <InfoItem title="" className="">
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

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Select Plan Type:</div>
              <Select
                style={{ width: '100%' }}
                options={[
                  {
                    label: PLAN_TYPE[PlanType.MAIN].label,
                    value: PlanType.MAIN
                  },
                  {
                    label: PLAN_TYPE[PlanType.ONE_TIME_ADD_ON].label,
                    value: PlanType.ONE_TIME_ADD_ON
                  }
                ]}
                onChange={(value) => setSelectedPlanType(value)}
                value={selectedPlanType}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Select Plan:</div>
            </div>
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
              planType={selectedPlanType}
            />

            {/* Currency Selector */}
            {selectedPlan && getAvailableCurrencies().length > 1 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Currency:</div>
                <Select
                  style={{ width: '100%', height: '40px' }}
                  value={selectedCurrency}
                  onChange={(value) => setSelectedCurrency(value)}
                  options={getAvailableCurrencies().map((currency) => {
                    const currencyInfo = appConfig.supportCurrency.find(c => c.Currency === currency);
                    const price = getPlanPriceForCurrency(currency);
                    return {
                      value: currency,
                      label: (
                        <div className="flex items-center justify-between">
                          <span>{`${currency} (${currencyInfo?.Symbol || currency})`}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            {price ? showAmount(price, currency) : '-'}
                          </span>
                        </div>
                      )
                    };
                  })}
                />
              </div>
            )}

            {selectedPlan && (
              <div className="mt-4 flex justify-center">
                <Plan
                  plan={{
                    ...selectedPlan,
                    currency: selectedCurrency as any,
                    amount: getPlanPriceForCurrency(selectedCurrency) || selectedPlan.amount,
                    addons: selectedPlan.addons?.map(addon => ({
                      ...addon,
                      currency: selectedCurrency as any,
                      amount: getAddonPriceForCurrency(addon, selectedCurrency)
                    }))
                  }}
                  width="280px"
                  selectedPlan={selectedPlan.id}
                  isThumbnail
                  isActive={false}
                  onAddonChange={onAddonChange}
                />
              </div>
            )}
          </div>

          <div className="w-1/2">
            <div className="flex items-center gap-2">
              <div className="text-lg text-gray-800">Payment</div>
              {paymentRequireType === PaymentRequireType.FREE_FIRST_PERIOD && (
                <span style={{ background: '#d1fae5', color: '#059669', fontSize: 12, fontWeight: 500, padding: '2px 10px', borderRadius: 999 }}>Free</span>
              )}
            </div>
            <div className="my-4">
              <InfoItem title="" horizontal isBold={false}>
                <Select
                  style={{ width: 360 }}
                  value={paymentRequireType}
                  onChange={(value: PaymentRequireType) => setPaymentRequireType(value)}
                  options={[
                    { value: PaymentRequireType.ACTIVATE_AFTER_PAYMENT, label: 'Activate After Payment' },
                    { value: PaymentRequireType.ACTIVATE_BEFORE_PAYMENT, label: 'Activate Before Payment' },
                    { value: PaymentRequireType.FREE_FIRST_PERIOD, label: 'Free For First Period' },
                  ]}
                />
              </InfoItem>

              {paymentRequireType === PaymentRequireType.FREE_FIRST_PERIOD && (
                <div
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '16px',
                    marginTop: 12,
                    background: '#f9fafb'
                  }}
                >
                  <Radio.Group
                    value={freeMode}
                    onChange={(e) => {
                      setFreeMode(e.target.value)
                      if (e.target.value === 'one_period') {
                        setFreeEndDate(null)
                      }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    <Radio value="custom_end_time" style={{ fontWeight: freeMode === 'custom_end_time' ? 600 : 400 }}>
                      Custom Free End Time
                    </Radio>
                    <Radio value="one_period" style={{ fontWeight: freeMode === 'one_period' ? 600 : 400 }}>
                      One Period Free
                    </Radio>
                  </Radio.Group>

                  {freeMode === 'custom_end_time' && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ marginBottom: 6, color: '#6b7280', fontSize: 13 }}>
                        Select End Date and Time
                      </div>
                      <DatePicker
                        showTime
                        value={freeEndDate}
                        onChange={(val) => setFreeEndDate(val)}
                        disabledDate={(current) =>
                          current != null && current < dayjs().startOf('day')
                        }
                        style={{ width: '100%' }}
                        placeholder="Select date and time"
                      />
                      {combinedFreeEndTime && combinedFreeEndTime.isBefore(dayjs()) && (
                        <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                          Selected time must be later than the current time
                        </div>
                      )}
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>
                        The free period will end at the selected date and time. After this, the subscription will begin billing according to the selected plan.
                      </div>
                    </div>
                  )}

                  {freeMode === 'one_period' && (
                    <div style={{ color: '#6b7280', fontSize: 13, marginTop: 16 }}>
                      The user will receive the first billing period completely free. Billing will automatically start at the beginning of the second period based on the selected plan&apos;s billing cycle.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mr-16 w-full flex-1">
              <PaymentMethodSelector
                selected={gatewayId}
                selectedPaymentType={gatewayPaymentType}
                onSelect={setGatewayId}
                onSelectPaymentType={setGatewayPaymentType}
                disabled={isLoading || paymentRequireType === PaymentRequireType.FREE_FIRST_PERIOD}
              />
            </div>

            <div className="mt-4 flex-1">
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Discounts</div>

              <div style={{ marginBottom: 16 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Promotional Credits</span>
                  {(!creditAmt || creditAmt <= 0) && (
                    <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', borderRadius: 999, padding: '1px 8px' }}>No applied</span>
                  )}
                </div>
                <div className="flex" style={{ gap: 8 }}>
                  <InputNumber
                    placeholder={getPromoCreditPlaceholder()}
                    min={1}
                    style={{ flex: 1 }}
                    value={creditAmt}
                    onChange={(value) => setCreditAmt(value)}
                    disabled={isCreditInputDisabled}
                  />
                  <Button
                    onClick={onApplyPromoCredit}
                    disabled={isCreditInputDisabled}
                    type="primary"
                    style={{ fontWeight: 600, borderRadius: 6 }}
                  >Apply</Button>
                </div>
                {creditUseNote()}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Discount Code</span>
                  {(!discountCode || discountCode.trim() === '') && (
                    <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', borderRadius: 999, padding: '1px 8px' }}>No applied</span>
                  )}
                </div>
                <div className="flex" style={{ gap: 8 }}>
                  <Input
                    style={{ flex: 1 }}
                    value={discountCode}
                    onChange={onDiscountCodeChange}
                    placeholder="Enter Discount Code"
                  />
                  <Button
                    onClick={onApplyDiscountCode}
                    type="primary"
                    style={{ fontWeight: 600, borderRadius: 6 }}
                  >Apply</Button>
                </div>
                {discountCodeUseNote()}
              </div>

              {/* Checkout summary items */}
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
            </div>
          </div>
        </div>

        {/* Total bar */}
        <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '12px 16px', marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{formatAmount(previewData?.totalAmount)}</span>
        </div>
      </div>
    </Modal>
  )
}