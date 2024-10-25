import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Switch
} from 'antd'
import update from 'immutability-helper'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import HiddenIcon from '../../../assets/hidden.svg?react'
import { showAmount } from '../../../helpers'
import {
  BusinessUserData,
  createSubscriptionReq,
  getPlanList,
  TPlanListBody,
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
import {
  isEmpty,
  safeRun,
  useDebouncedCallbackWithDefault
} from '../../../utils'
import Plan from '../../subscription/plan'
import PaymentMethodSelector from '../../ui/paymentSelector'
import { AccountTypeForm, AccountTypeFormInstance } from './accountTypeForm'
import {
  BusinessAccountValues,
  getValidStatusByMessage
} from './businessAccountForm'
import { CheckoutItem } from './checkoutItem'
import { PernsonalAccountValues } from './personalAccountForm'

interface Props {
  user: IProfile
  productId: number
  refresh: () => void
  closeModal: () => void
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

type AccountValues = Pick<PernsonalAccountValues, 'country'> &
  BusinessAccountValues

const TRIGGER_PREVIEW_FIELDS = ['country', 'vat', 'discountCode']

const Index = ({ user, productId, closeModal, refresh }: Props) => {
  const appConfig = useAppConfigStore()
  const accountTypeFormRef = useRef<AccountTypeFormInstance>(null)
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<IPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [requirePayment, setRequirePayment] = useState(true)
  const [includeUnpublished, setIncludeUnpublished] = useState(false)
  const [accountType, setAccountType] = useState(user.type)
  const [previewData, setPreviewData] = useState<PreviewData | undefined>()
  const [discountCode, setDiscountCode] = useState<string | undefined>()
  const [accountFormValues, setAccountFormValues] = useState<
    AccountValues | undefined
  >()
  const [accountFormChangedKey, setAccountFormChangedKey] = useState<
    string | undefined
  >()
  const onIncludeChange = (checked: boolean) => {
    if (!checked) {
      if (
        selectedPlanId != null &&
        plans
          .filter((p) => p.publishStatus == 2)
          .findIndex((p) => p.id == selectedPlanId) == -1
      ) {
        // if selected plan doesn't exist in published plans, reset it to null
        setSelectedPlanId(null)
      }
    }
    setIncludeUnpublished(!includeUnpublished)
  }
  const selectedPlan = useMemo(
    () => plans.find(({ id }) => id === selectedPlanId),
    [selectedPlanId, plans]
  )
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

  // set card payment as default gateway
  const [gatewayId, setGatewayId] = useState<undefined | number>(
    appConfig.gateway.find((g) => g.gatewayName == 'stripe')?.gatewayId
  )

  //const onGatewayChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
  const onGatewayChange = (gatewayId: number) => {
    setGatewayId(gatewayId)
  }

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
        planId: selectedPlanId,
        gatewayId: gatewayId,
        userId: user.id!,
        startIncomplete: false,
        user: userData,
        vatNumber: vat,
        vatCountryCode: country,
        discountCode: discountCode
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
      selectedPlanId,
      gatewayId,
      user,
      accountType,
      discountCode,
      user,
      requirePayment
    ]
  )

  const onAddonChange = (
    addonId: number,
    quantity: number | null, // null means: don't update this field, keep its original value. I don't want to define 2 fn to do similar jobs.
    checked: boolean | null // ditto
  ) => {
    const planIdx = plans.findIndex((p) => p.id == selectedPlanId)
    if (planIdx == -1) {
      return
    }
    const addonIdx = plans[planIdx].addons!.findIndex((a) => a.id == addonId)
    if (addonIdx == -1) {
      return
    }

    let newPlans = plans
    if (quantity == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { checked: { $set: checked as boolean } } }
        }
      })
    } else if (checked == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { quantity: { $set: quantity as number } } }
        }
      })
    }
    setPlans(newPlans)
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

    if (selectedPlanId == null) {
      message.error('Please choose a plan')
      return
    }
    if (gatewayId == undefined) {
      message.error('Please choose a payment method')
      return
    }

    const submitData = getSubmitData(values)

    const body = {
      ...submitData,
      confirmTotalAmount: previewData?.totalAmount,
      confirmCurrency: selectedPlan?.currency
    } as WithDoubleConfirmFields<CreateSubScriptionBody>

    setLoading(true)

    const [_, err] = await createSubscriptionReq(body)

    setLoading(false)

    if (null != err) {
      message.error(err.message)
      return
    }

    message.success('Subscription created')
    closeModal()
    refresh()
  }

  const fetchPlan = async () => {
    const body: TPlanListBody = {
      type: [1], // main plan
      status: [2], // active
      productIds: [productId],
      page: 0,
      count: 150
    }

    setLoading(true)

    const [res, err] = await getPlanList(body, fetchPlan)

    setLoading(false)

    if (err != null) {
      message.error(err.message)
      return
    }
    const { plans } = res
    setPlans(
      plans == null
        ? []
        : plans.map((p: IPlan) => ({
            ...p.plan,
            metricPlanLimits: p.metricPlanLimits
          }))
    )
  }

  const updatePrice = useCallback(
    async (accountFormValues?: AccountValues) => {
      setLoading(true)

      const submitData = getSubmitData(accountFormValues)
      const [data, err] = await safeRun(() =>
        request.post<Response<PreviewData>>(
          '/merchant/subscription/create_preview',
          submitData
        )
      )

      setLoading(false)

      if (err) {
        message.error(err.message)
        return
      }

      const previewData = data?.data?.data

      setPreviewData(previewData)
    },
    [getSubmitData]
  )

  const debouncedUpdateDiscountCode = useDebouncedCallbackWithDefault(
    (value: string) => setDiscountCode(value)
  )

  useEffect(() => {
    if (
      !selectedPlanId ||
      (accountFormChangedKey &&
        !TRIGGER_PREVIEW_FIELDS.includes(accountFormChangedKey))
    ) {
      return
    }

    updatePrice(accountFormValues)
  }, [selectedPlanId, accountFormValues, accountFormChangedKey, updatePrice])

  useEffect(() => {
    fetchPlan()
  }, [])

  return (
    <Modal
      title="Assign subscription"
      open={true}
      width={'720px'}
      footer={null}
      closeIcon={null}
    >
      <Divider>Choose a subscription plan</Divider>
      <div className="flex justify-between">
        <div className="my-6 w-3/6">
          <Row gutter={[16, 48]}>
            <Col span={7} className="font-bold text-gray-700">
              UserId
            </Col>
            <Col span={17}>{user.id}</Col>
          </Row>
          <Row gutter={[16, 48]}>
            <Col span={7} className="font-bold text-gray-700">
              User name
            </Col>
            <Col span={17}>{`${user.firstName} ${user.lastName}`}</Col>
          </Row>
          <Row gutter={[16, 48]} className="mb-4">
            <Col span={7} className="font-bold text-gray-700">
              Email
            </Col>
            <Col span={17}>{user.email}</Col>
          </Row>
          <PaymentMethodSelector
            selected={gatewayId}
            onSelect={onGatewayChange}
            disabled={loading}
          />
          <div className="mt-4">
            <div className="mb-2 font-bold">Account type</div>

            <AccountTypeForm
              loading={loading}
              previewData={previewData}
              onFormValuesChange={(changedValues, values, accountType) => {
                const [changedKey] = Object.keys(changedValues)

                setAccountType(accountType)
                setAccountFormValues(values as AccountValues)
                setAccountFormChangedKey(changedKey)
              }}
              ref={accountTypeFormRef}
              user={user}
            ></AccountTypeForm>
          </div>
        </div>

        <div className="ml-1">
          <div>
            <div className="my-6 flex flex-col justify-center">
              <div className="mb-2 font-bold">Discount code</div>
              <Form.Item
                validateStatus={getValidStatusByMessage(
                  previewData?.discountMessage
                )}
                help={previewData?.discountMessage}
              >
                <Input
                  onChange={(e) => debouncedUpdateDiscountCode(e.target.value)}
                  placeholder="Discount code"
                />
              </Form.Item>
              <div className="mb-2 font-bold">Choose Plan</div>
              <Select
                loading={loading}
                disabled={loading}
                style={{ width: 260 }}
                value={selectedPlanId}
                onChange={setSelectedPlanId}
                options={plans
                  .filter((p) =>
                    includeUnpublished ? true : p.publishStatus == 2
                  )
                  .map((p) => ({
                    value: p.id,
                    label: (
                      <div key={p.id} className="flex items-center">
                        <span>{p.planName}</span>
                        {p.publishStatus == 1 && (
                          <div
                            className="absolute flex h-4 w-4"
                            style={{ right: '14px' }}
                          >
                            <HiddenIcon />
                          </div>
                        )}
                      </div>
                    )
                  }))}
              />
            </div>

            <div className="mb-12 flex flex-col items-center justify-center">
              {selectedPlanId != null && (
                <Plan
                  plan={plans.find((p) => p.id == selectedPlanId)!}
                  selectedPlan={selectedPlanId}
                  setSelectedPlan={setSelectedPlanId}
                  onAddonChange={onAddonChange}
                  isActive={false}
                />
              )}
              <div className="w-full">
                <Row style={{ margin: '12px 0' }}>
                  <Col span={18}>Require payment</Col>
                  <Col span={6}>
                    <Switch
                      disabled={loading}
                      checked={requirePayment}
                      onChange={setRequirePayment}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col span={18}>Include unpublished plans</Col>
                  <Col span={6}>
                    <Switch
                      disabled={loading}
                      checked={includeUnpublished}
                      onChange={onIncludeChange}
                    />
                  </Col>
                </Row>
                <div className="my-8 h-[1px] w-full bg-gray-100"></div>
                <CheckoutItem
                  label="Subtotal"
                  loading={loading}
                  value={formatAmount(
                    previewData?.invoice.subscriptionAmountExcludingTax
                  )}
                />
                {selectedPlanId && (
                  <CheckoutItem
                    loading={loading}
                    label={`Tax(${parsedTax}%)`}
                    value={formatAmount(previewData?.invoice.taxAmount)}
                  />
                )}
                <CheckoutItem
                  label={formattedDiscountLabel}
                  loading={loading}
                  value={formattedDiscountValue}
                />
                {selectedPlanId && (
                  <div className="my-8 h-[1px] w-full bg-gray-100"></div>
                )}
                <CheckoutItem
                  labelStyle="text-lg"
                  loading={loading}
                  label="Total"
                  value={formatAmount(previewData?.totalAmount)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-end gap-4"
        style={{
          marginTop: '24px'
        }}
      >
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onSubmit}
          loading={loading}
          disabled={loading || isEmpty(selectedPlan)}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default Index
