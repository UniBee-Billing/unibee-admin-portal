import { useState, useEffect, useMemo } from 'react'
import { Modal, Form, Input, InputNumber, Select, DatePicker, Radio, Button, message, Space, Card, Spin, Typography, Popover } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { DiscountRule, DiscountTypeEnum, BillingTypeEnum, PlanApplyTypeEnum, TemplateStatus } from './types'
import {
  createBatchTemplateReq,
  editBatchTemplateReq,
  incrementBatchQuantityReq
} from '../../requests/batchDiscountService'
import { getPlanList, amountMultiCurrenciesExchangeReq, getMerchantInfoReq } from '../../requests'
import { formatPlanPrice } from '../../helpers'
import { useAppConfigStore } from '../../stores'
import { IPlan, PlanStatus, PlanType } from '../../shared.types'

const { RangePicker } = DatePicker

interface MultiCurrencyExchange {
  currency: string
  autoExchange: boolean
  exchangeRate: number
  amount: number
  disable: boolean
}

interface MultiCurrencyData {
  exchanges: MultiCurrencyExchange[]
  lastUpdated: string
  loading: boolean
}

interface CurrencyInfo {
  Currency: string
  Symbol: string
  Scale: number
}

interface EditDiscountRuleModalProps {
  open: boolean
  rule: DiscountRule | null
  onCancel: () => void
  onSubmit: (success: boolean) => void
}

const MAX_QUANTITY = 10000

export const EditDiscountRuleModal = ({
  open,
  rule,
  onCancel,
  onSubmit
}: EditDiscountRuleModalProps) => {
  const [form] = Form.useForm()
  const [quantityError, setQuantityError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [incrementAmount, setIncrementAmount] = useState<number | null>(null)
  const [incrementLoading, setIncrementLoading] = useState(false)
  const [planList, setPlanList] = useState<IPlan[]>([])
  const [multiCurrencyData, setMultiCurrencyData] = useState<MultiCurrencyData>({
    exchanges: [],
    lastUpdated: '',
    loading: false
  })
  const [currencyList, setCurrencyList] = useState<CurrencyInfo[]>([])
  const isEditing = !!rule
  const appConfigStore = useAppConfigStore()
  const watchPlanApplyType = Form.useWatch('planApplyType', form)
  const watchBillingType = Form.useWatch('billingType', form)
  const watchDiscountType = Form.useWatch('discountType', form)
  const watchCurrency = Form.useWatch('currency', form)
  const watchDiscountAmount = Form.useWatch('discountAmount', form)

  // Fetch plan list
  useEffect(() => {
    const fetchPlans = async () => {
      const [res, err] = await getPlanList({
        type: [PlanType.MAIN, PlanType.ONE_TIME_ADD_ON],
        status: [PlanStatus.ACTIVE],
        page: 0,
        count: 500
      })
      if (!err && res?.plans) {
        const plans = res.plans.map((p: { plan: IPlan }) => p.plan)
        setPlanList(plans.filter((p: IPlan) => p.status === PlanStatus.ACTIVE))
      }
    }
    if (open) {
      fetchPlans()
    }
  }, [open])

  // Fetch currency list from merchant info
  useEffect(() => {
    const fetchCurrencyList = async () => {
      try {
        const [merchantInfo, error] = await getMerchantInfoReq()
        if (error) {
          return
        }
        
        if (merchantInfo?.Currency && Array.isArray(merchantInfo.Currency)) {
          setCurrencyList(merchantInfo.Currency)
        }
      } catch {
        // Ignore error
      }
    }

    if (open) {
      fetchCurrencyList()
    }
  }, [open])

  // Fetch multi-currency exchange rates when discount amount changes
  const fetchMultiCurrencyExchange = async (amount: number, currency: string) => {
    if (!amount || amount <= 0) {
      setMultiCurrencyData({
        exchanges: [],
        lastUpdated: '',
        loading: false
      })
      return
    }

    setMultiCurrencyData(prev => ({
      ...prev,
      loading: true
    }))

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const apiPromise = amountMultiCurrenciesExchangeReq(Math.round(amount * 100), currency)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [data, error] = await Promise.race([apiPromise, timeoutPromise]) as any
      
      if (error) {
        setMultiCurrencyData({
          exchanges: [],
          lastUpdated: '',
          loading: false
        })
        return
      }

      if (data && data.data && data.data.multiCurrencyConfigs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exchangeData = data.data.multiCurrencyConfigs.map((config: any) => ({
          currency: config.currency,
          autoExchange: config.autoExchange,
          exchangeRate: config.exchangeRate,
          amount: config.amount,
          disable: config.disable
        }))
        
        setMultiCurrencyData({
          exchanges: exchangeData,
          lastUpdated: new Date().toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          loading: false
        })
      } else {
        setMultiCurrencyData({
          exchanges: [],
          lastUpdated: '',
          loading: false
        })
      }
    } catch {
      setMultiCurrencyData({
        exchanges: [],
        lastUpdated: '',
        loading: false
      })
    }
  }

  // Watch for discount amount and currency changes
  useEffect(() => {
    if (watchDiscountType === DiscountTypeEnum.FIXED_AMOUNT && watchDiscountAmount && watchCurrency) {
      fetchMultiCurrencyExchange(watchDiscountAmount, watchCurrency)
    } else {
      setMultiCurrencyData({
        exchanges: [],
        lastUpdated: '',
        loading: false
      })
    }
  }, [watchDiscountAmount, watchCurrency, watchDiscountType])

  const getPlanLabel = (plan: IPlan) => {
    const priceStr = formatPlanPrice(plan)
    return `#${plan.id} ${plan.planName} (${priceStr})`
  }

  // Filter plans based on billing type and currency (only for fixed amount)
  const filteredPlanList = planList.filter((plan) => {
    // Filter by billing type
    let typeMatch = true
    if (watchBillingType === BillingTypeEnum.ONE_TIME) {
      typeMatch = plan.type === PlanType.ONE_TIME_ADD_ON
    } else {
      typeMatch = plan.type === PlanType.MAIN
    }

    // Filter by currency only for fixed amount discount type
    let currencyMatch = true
    if (watchDiscountType === DiscountTypeEnum.FIXED_AMOUNT && watchCurrency) {
      currencyMatch = plan.currency === watchCurrency
    }

    return typeMatch && currencyMatch
  })

  // Create a map of all plans for quick lookup
  const planMap = useMemo(() => {
    const map = new Map<number, IPlan>()
    planList.forEach((p) => map.set(p.id, p))
    return map
  }, [planList])

  // Build options that include both filtered plans and already selected plans (for display)
  const selectedPlanIds = Form.useWatch('planIds', form) || []
  const planOptions = useMemo(() => {
    const filteredIds = new Set(filteredPlanList.map((p) => p.id))
    const options: { label: string; value: number }[] = []

    // Add filtered plans
    filteredPlanList.forEach((p) => {
      options.push({ label: getPlanLabel(p), value: p.id })
    })

    // Add selected plans that are not in filtered list (for display purposes)
    selectedPlanIds.forEach((id: number) => {
      if (!filteredIds.has(id)) {
        const plan = planMap.get(id)
        if (plan) {
          options.push({ label: getPlanLabel(plan), value: plan.id })
        }
      }
    })

    return options
  }, [filteredPlanList, selectedPlanIds, planMap])

  useEffect(() => {
    if (open) {
      if (rule) {
        // Fetch detail for editing
        // Use data from rule (already fetched from list API)
        setDetailLoading(false)
        form.setFieldsValue({
          name: rule.name,
          codePrefix: rule.code, // rule.code is already mapped from codePrefix in list.tsx
          quantity: rule.quantity,
          discountType: rule.discountType,
          discountPercentage: rule.discountPercentage ? rule.discountPercentage / 100 : undefined,
          discountAmount: rule.discountAmount ? rule.discountAmount / 100 : undefined,
          currency: rule.currency || '',
          billingType: rule.billingType,
          cycleLimit: rule.cycleLimit,
          validityRange: rule.startTime && rule.endTime 
            ? [dayjs.unix(rule.startTime), dayjs.unix(rule.endTime)]
            : undefined,
          planApplyType: rule.planApplyType ?? PlanApplyTypeEnum.ALL,
          planIds: rule.planIds
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          discountType: DiscountTypeEnum.PERCENTAGE,
          billingType: BillingTypeEnum.RECURRING,
          planApplyType: PlanApplyTypeEnum.ALL,
          currency: 'USD'
        })
      }
      setQuantityError(false)
      setIncrementAmount(null)
    }
  }, [open, rule, form])

  const handleQuantityChange = (value: number | null) => {
    if (value && value > MAX_QUANTITY) {
      setQuantityError(true)
    } else {
      setQuantityError(false)
    }
  }

  const handleIncrementQuantity = async () => {
    if (!rule || !incrementAmount || incrementAmount <= 0) return
    
    setIncrementLoading(true)
    const [, err] = await incrementBatchQuantityReq(rule.id, incrementAmount)
    setIncrementLoading(false)

    if (err) {
      message.error(err.message || 'Failed to increase quantity')
      return
    }

    message.success(`Successfully increased quantity by ${incrementAmount}`)
    setIncrementAmount(null)
    onSubmit(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (values.quantity > MAX_QUANTITY) {
        return
      }

      setLoading(true)

      const baseParams = {
        name: values.name,
        codePrefix: values.codePrefix,
        quantity: values.quantity,
        discountType: values.discountType,
        billingType: values.billingType,
        cycleLimit: values.cycleLimit,
        startTime: values.validityRange?.[0]?.unix(),
        endTime: values.validityRange?.[1]?.unix(),
        planApplyType: values.planApplyType,
        planIds: values.planIds
      }

      // Only include relevant fields based on discount type
      const params = values.discountType === DiscountTypeEnum.PERCENTAGE
        ? { ...baseParams, discountPercentage: Math.round(values.discountPercentage * 100) }
        : { ...baseParams, currency: values.currency, discountAmount: Math.round(values.discountAmount * 100) }

      let err: Error | null = null
      if (isEditing && rule) {
        const [, editErr] = await editBatchTemplateReq({ id: rule.id, ...params })
        err = editErr
      } else {
        const [, createErr] = await createBatchTemplateReq(params)
        err = createErr
      }

      setLoading(false)

      if (err) {
        message.error(err.message || 'Failed to save')
        return
      }

      message.success(isEditing ? 'Template updated successfully' : 'Template created successfully')
      onSubmit(true)
    } catch {
      // Form validation failed
    }
  }

  return (
    <Modal
      title={
        <div className="text-center pt-2 pb-2">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Discount Rule' : 'Edit Discount Code'}
          </h2>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={480}
      centered
      styles={{ 
        header: { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 },
        body: { maxHeight: '65vh', overflowY: 'auto', paddingTop: 16 } 
      }}
    >

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label={<span className="text-gray-600">Name</span>}
          rules={[{ required: true, message: 'Please enter a name' }]}
        >
          <Input placeholder="Spring Sale 2025" disabled={detailLoading} />
        </Form.Item>

        <Form.Item
          name="codePrefix"
          label={<span className="text-gray-600">Code Prefix</span>}
          rules={[{ required: true, message: 'Please enter a code prefix' }]}
        >
          <Input 
            placeholder="SPRING25" 
            disabled={detailLoading || isEditing}
          />
        </Form.Item>

        {!isEditing ? (
          <Form.Item
            name="quantity"
            label={<span className="text-gray-600">Quantity</span>}
            rules={[
              { required: true, message: 'Please enter quantity' },
              {
                validator: (_, value) => {
                  if (value && value > MAX_QUANTITY) {
                    return Promise.reject(new Error(`Maximum ${MAX_QUANTITY.toLocaleString()} per batch`))
                  }
                  return Promise.resolve()
                }
              }
            ]}
            extra={
              <span style={{ color: '#8c8c8c', fontSize: 13 }}>
                Max {MAX_QUANTITY.toLocaleString()} per batch
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              onChange={handleQuantityChange}
              disabled={detailLoading}
            />
          </Form.Item>
        ) : (
          <div className="mb-6">
            <div className="text-gray-600 mb-2">Quantity</div>
            {rule?.status === TemplateStatus.ACTIVE ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                    {rule?.quantity?.toLocaleString() || 0}
                  </div>
                  <span className="text-gray-400">+</span>
                  <InputNumber
                    style={{ width: 120 }}
                    min={1}
                    placeholder="Amount"
                    value={incrementAmount}
                    onChange={(val) => setIncrementAmount(val)}
                    disabled={incrementLoading}
                    status={incrementAmount && (rule.quantity + incrementAmount) > MAX_QUANTITY ? 'error' : undefined}
                  />
                  <Button
                    type="primary"
                    onClick={handleIncrementQuantity}
                    loading={incrementLoading}
                    disabled={!incrementAmount || incrementAmount <= 0 || (rule.quantity + incrementAmount) > MAX_QUANTITY}
                  >
                    Add
                  </Button>
                </div>
                {incrementAmount && (rule.quantity + incrementAmount) > MAX_QUANTITY ? (
                  <div className="mt-1 text-xs text-red-500">
                    Total quantity cannot exceed {MAX_QUANTITY.toLocaleString()}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-gray-400">
                    Enter the amount to increase the total quantity
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                  {rule?.quantity?.toLocaleString() || 0}
                </div>
                <div className="mt-1 text-xs text-amber-500">
                  Activate to increase quantity
                </div>
              </>
            )}
          </div>
        )}

        <Form.Item
          name="discountType"
          label={<span className="text-gray-600">Discount Type</span>}
          rules={[{ required: true, message: 'Please select discount type' }]}
        >
          <Select disabled={detailLoading || isEditing}>
            <Select.Option value={DiscountTypeEnum.PERCENTAGE}>Percentage</Select.Option>
            <Select.Option value={DiscountTypeEnum.FIXED_AMOUNT}>Fixed amount</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.discountType !== curr.discountType}>
          {({ getFieldValue }) => 
            getFieldValue('discountType') === DiscountTypeEnum.PERCENTAGE ? (
              <Form.Item
                name="discountPercentage"
                label={<span className="text-gray-600">Discount Percentage</span>}
                rules={[{ required: true, message: 'Please enter discount percentage' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  addonAfter="%"
                  disabled={detailLoading || isEditing}
                />
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  name="currency"
                  label={<span className="text-gray-600">Currency</span>}
                  rules={[{ required: true, message: 'Please select currency' }]}
                >
                  <Select 
                    disabled={detailLoading || isEditing}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={appConfigStore.supportCurrency.map((c) => ({
                      label: `${c.Currency} (${c.Symbol})`,
                      value: c.Currency
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  name="discountAmount"
                  label={<span className="text-gray-600">Discount Amount</span>}
                  rules={[{ required: true, message: 'Please enter discount amount' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    disabled={detailLoading || isEditing}
                  />
                </Form.Item>
              </>
            )
          }
        </Form.Item>

        {/* Multi-Currency Pricing Section */}
        {watchDiscountType === DiscountTypeEnum.FIXED_AMOUNT && watchDiscountAmount && watchDiscountAmount > 0 && (
          <div className="mb-4">
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <Typography.Text strong>
                  Multi-Currency Pricing
                  <Popover
                    content={
                      <div className="max-w-64">
                        Real-time currency conversion based on current exchange rates
                      </div>
                    }
                  >
                    <InfoCircleOutlined className="ml-2 text-gray-400" />
                  </Popover>
                </Typography.Text>
                {multiCurrencyData.lastUpdated && (
                  <span className="text-xs text-gray-500">
                    Last updated: {multiCurrencyData.lastUpdated}
                  </span>
                )}
              </div>
              
              <Spin spinning={multiCurrencyData.loading}>
                <div className="flex gap-2 flex-wrap">
                  {multiCurrencyData.exchanges?.map((exchange, index) => {
                    const getCurrencySymbol = (currency: string) => {
                      const currencyInfo = currencyList.find(c => c.Currency === currency)
                      return currencyInfo?.Symbol || currency
                    }

                    const displayAmount = exchange.amount / 100

                    return (
                      <Card key={index} size="small" className="flex-1 min-w-[100px]">
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">
                            {getCurrencySymbol(exchange.currency)} {exchange.currency}
                          </div>
                          <div className="text-base font-bold text-gray-800">
                            {getCurrencySymbol(exchange.currency)}{displayAmount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Rate: {exchange.exchangeRate.toFixed(4)}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                  {(!multiCurrencyData.exchanges || multiCurrencyData.exchanges.length === 0) && !multiCurrencyData.loading && (
                    <div className="text-center text-gray-500 py-2 w-full text-sm">
                      No multi-currency data available
                    </div>
                  )}
                </div>
              </Spin>
            </div>
          </div>
        )}

        <Form.Item
          name="billingType"
          label={<span className="text-gray-600">Billing Type</span>}
          rules={[{ required: true, message: 'Please select billing type' }]}
        >
          <Select disabled={detailLoading || isEditing}>
            <Select.Option value={BillingTypeEnum.ONE_TIME}>One-time</Select.Option>
            <Select.Option value={BillingTypeEnum.RECURRING}>Recurring</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="validityRange"
          label={<span className="text-gray-600">Valid Date Range</span>}
          rules={[{ required: true, message: 'Please select date range' }]}
        >
          <RangePicker 
            style={{ width: '100%' }}
            placeholder={['From', 'To']}
            disabled={detailLoading}
          />
        </Form.Item>

        <Form.Item
          name="planApplyType"
          label={<span className="text-gray-600">Apply To Plans</span>}
        >
          <Radio.Group disabled={detailLoading}>
            <Space direction="vertical">
              <Radio value={PlanApplyTypeEnum.ALL}>All plans</Radio>
              <Radio value={PlanApplyTypeEnum.SELECTED}>Selected plans</Radio>
              <Radio value={PlanApplyTypeEnum.NOT_SELECTED}>All plans except selected plans</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {watchPlanApplyType !== PlanApplyTypeEnum.ALL && (
          <Form.Item
            name="planIds"
            label={
              <span className="text-gray-600">
                {watchPlanApplyType === PlanApplyTypeEnum.SELECTED 
                  ? 'Select Plans to Apply' 
                  : 'Select Plans to Exclude'}
              </span>
            }
            rules={[
              {
                required: watchPlanApplyType !== PlanApplyTypeEnum.ALL,
                message: 'Please select at least one plan'
              }
            ]}
          >
            <Select
              mode="multiple"
              disabled={detailLoading}
              allowClear
              showSearch
              placeholder="Select plans..."
              style={{ width: '100%' }}
              filterOption={(input, option) => {
                const plan = planMap.get(option?.value as number)
                if (!plan) return false
                return plan.planName.toLowerCase().includes(input.toLowerCase()) ||
                       plan.id.toString().includes(input)
              }}
              options={planOptions}
            />
          </Form.Item>
        )}

        <div className="flex gap-3 mt-8">
          <Button
            onClick={onCancel}
            style={{ flex: 1, height: 40 }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={quantityError || detailLoading}
            loading={loading}
            style={{ flex: 1, height: 40 }}
          >
            {isEditing ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
