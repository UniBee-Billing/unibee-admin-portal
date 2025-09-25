import { PlanStatusTag } from '@/components/ui/statusTag'
import { currencyDecimalValidate } from '@/helpers'
import {
  CURRENCY,
  IPlan,
  IProduct,
  PlanPublishStatus,
  PlanStatus,
  PlanType
} from '@/shared.types'
import { CheckCircleOutlined, MinusOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Input, InputNumber, message, Select, Tag, Checkbox } from 'antd'

import { togglePublishReq, amountMultiCurrenciesExchangeReq } from '@/requests'
import { useAppConfigStore } from '@/stores'
import { Form } from 'antd'
import { MutableRefObject, useState, useEffect } from 'react'
import { TNewPlan } from './types'

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
  isNew: boolean
  productDetail: IProduct | null
  plan: IPlan | TNewPlan
  watchPlanType: PlanType
  formDisabled: boolean
  disableAfterActive: MutableRefObject<boolean>
  getCurrency: () => CURRENCY
  loading: boolean
  refresh: () => void
}
const Index = ({
  isNew,
  productDetail,
  plan,
  watchPlanType,
  formDisabled,
  disableAfterActive,
  getCurrency,
  loading,
  refresh
}: Props) => {
  const appConfig = useAppConfigStore()
  const [publishing, setPublishing] = useState(false)
  const [additionalCurrencies, setAdditionalCurrencies] = useState<MultiCurrency[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const form = Form.useFormInstance()

  // used only when editing an active plan
  const togglePublish = async () => {
    setPublishing(true)
    const [_, err] = await togglePublishReq({
      planId: (plan as IPlan).id,
      publishAction:
        plan!.publishStatus == PlanPublishStatus.UNPUBLISHED
          ? 'PUBLISH'
          : 'UNPUBLISH'
    })
    if (null != err) {
      message.error(err.message)
      return
    }
    setPublishing(false)
    refresh()
  }

  // Initialize currencies from plan data or API
  const initializeCurrencies = async () => {
    // For editing existing plan, load from plan.multiCurrencies if available
    if (!isNew && (plan as IPlanWithMultiCurrencies).multiCurrencies) {
      const planMultiCurrencies = (plan as IPlanWithMultiCurrencies).multiCurrencies!
      setAdditionalCurrencies(planMultiCurrencies)
      return
    }

    // For new plans, call API to get multi-currency exchange rates
    if (isNew) {
      const baseAmount = form.getFieldValue('amount')
      const baseCurrency = form.getFieldValue('currency')
      
      if (baseAmount && baseCurrency) {
        await fetchMultiCurrencyExchange()
      } else {
        setAdditionalCurrencies([])
      }
    }
  }

  // Watch for currency changes and call API (only for new plans)
  const handleCurrencyChange = async () => {
    // Only update currencies for new plans
    if (isNew) {
      await initializeCurrencies()
    }
  }

  useEffect(() => {
    initializeCurrencies()
  }, [plan, isNew])

  // Sync additionalCurrencies with form field
  useEffect(() => {
    form.setFieldValue('multiCurrencies', additionalCurrencies)
  }, [additionalCurrencies, form])

  const updateCurrency = (index: number, field: keyof MultiCurrency, value: any) => {
    setAdditionalCurrencies(prev => 
      prev.map((curr, i) => 
        i === index ? { ...curr, [field]: value } : curr
      )
    )
  }

  const _removeCurrency = (index: number) => {
    setAdditionalCurrencies(prev => prev.filter((_, i) => i !== index))
  }

  // Call API to get multi-currency exchange rates
  const fetchMultiCurrencyExchange = async () => {
    if (!isNew) return // Only for new plans
    
    const baseAmount = form.getFieldValue('amount') || 0
    const baseCurrency = form.getFieldValue('currency')
    
    if (!baseAmount || !baseCurrency) return
    
    setApiLoading(true)
    try {
      const baseCurrencyInfo = appConfig.supportCurrency.find(c => c.Currency === baseCurrency)
      const baseAmountWithScale = Math.round(baseAmount * (baseCurrencyInfo?.Scale || 100))
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const apiPromise = amountMultiCurrenciesExchangeReq(baseAmountWithScale, baseCurrency)
      const [data, error] = await Promise.race([apiPromise, timeoutPromise]) as [unknown, unknown]
      
      if (error) {
        // console.error('Failed to fetch multi-currency exchange:', error)
        return
      }

      if (data && (data as any).data && (data as any).data.multiCurrencyConfigs) {
        const apiCurrencies: MultiCurrency[] = (data as any).data.multiCurrencyConfigs.map((config: { currency: string; autoExchange: boolean; exchangeRate: number; amount: number; disable: boolean }) => ({
          currency: config.currency,
          autoExchange: config.autoExchange,
          exchangeRate: config.exchangeRate,
          amount: config.amount,
          disable: false // Default to enabled as requested
        }))
        
        setAdditionalCurrencies(apiCurrencies)
      }
    } catch (_error) {
      // console.error('Error fetching multi-currency exchange:', _error)
    } finally {
      setApiLoading(false)
    }
  }

  // Call API again when amount changes (for new plans)
  const handleAmountChange = () => {
    if (isNew) {
      fetchMultiCurrencyExchange()
    }
  }

  return (
    <div className="pt-4">
      {!isNew && (
        <Form.Item label="ID" name="id" hidden>
          <Input disabled />
        </Form.Item>
      )}

      <Form.Item name="multiCurrencies" hidden>
        <Input />
      </Form.Item>

      <Form.Item label="Product Name">
        <span>
          {productDetail != null ? (
            productDetail?.productName
          ) : (
            <Tag color="red">Invalid product</Tag>
          )}
        </span>
      </Form.Item>

      <Form.Item
        label="Plan Name"
        name="planName"
        rules={[
          {
            required: true,
            message: 'Please input your plan name!'
          }
        ]}
      >
        <Input.TextArea rows={2} maxLength={100} showCount />
      </Form.Item>

      <Form.Item
        label="Internal Plan Name"
        name="internalName"
        rules={[
          {
            required: true,
            message: 'Please input internal plan name!'
          }
        ]}
      >
        <Input maxLength={200} showCount />
      </Form.Item>

      <Form.Item
        label="Plan Description"
        name="description"
        rules={[
          {
            required: true,
            message: 'Please input your plan description!'
          }
        ]}
      >
        <Input.TextArea rows={4} maxLength={500} showCount />
      </Form.Item>

      <Form.Item label="Plan Type" name="type">
        <Select
          style={{ width: 180 }}
          disabled={!isNew || plan.status != PlanStatus.EDITING}
          options={[
            { value: PlanType.MAIN, label: 'Main plan' },
            { value: PlanType.ADD_ON, label: 'Addon' },
            { value: PlanType.ONE_TIME_ADD_ON, label: 'One time payment' }
          ]}
        />
      </Form.Item>

      <Form.Item label="External Plan Id" name="externalPlanId">
        <Input style={{ width: '180px' }} />
      </Form.Item>

      <Form.Item label="Status" name="status">
        {PlanStatusTag(plan.status)}
      </Form.Item>

      <Form.Item label="Is Published" name="publishStatus">
        <div>
          <span>
            {plan.publishStatus == PlanPublishStatus.PUBLISHED ? (
              <CheckCircleOutlined
                style={{ color: 'green', fontSize: '18px' }}
              />
            ) : (
              <MinusOutlined style={{ color: 'red', fontSize: '18px' }} />
            )}{' '}
          </span>
          <Button
            style={{ marginLeft: '12px' }}
            onClick={togglePublish}
            loading={publishing}
            disabled={plan.status != PlanStatus.ACTIVE || publishing || loading}
          >
            {/* you can only publish/unpublish an active plan */}
            {plan.publishStatus == PlanPublishStatus.PUBLISHED
              ? 'Unpublish'
              : 'Publish'}
          </Button>
        </div>
      </Form.Item>
      {plan.status == PlanStatus.ACTIVE &&
        plan.publishStatus == PlanPublishStatus.PUBLISHED && (
          <div
            className="relative ml-2 text-xs text-gray-400"
            style={{ top: '-45px', left: '336px', width: '340px' }}
          >
            Unpublish to enable plan editing after activation.
          </div>
        )}

      <Form.Item
        label="Default Currency"
        name="currency"
        rules={[
          {
            required: true,
            message: 'Please select your plan currency!'
          }
        ]}
      >
        <Select
          disabled={disableAfterActive.current || formDisabled}
          style={{ width: 180 }}
          showSearch
          onChange={handleCurrencyChange}
          filterSort={(optionA, optionB) => {
            return (optionA?.label ?? '')
              .toLocaleLowerCase()
              .localeCompare((optionB?.label ?? '').toLocaleLowerCase())
          }}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={appConfig.supportCurrency.map((c) => ({
            value: c.Currency,
            label: `${c.Currency} (${c.Symbol})`
          }))}
        />
      </Form.Item>

      <Form.Item
        label="Price"
        name="amount"
        dependencies={['currency']}
        rules={[
          {
            required: true,
            message: 'Please input your plan price!'
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              const num = Number(value)
              if (!currencyDecimalValidate(num, getFieldValue('currency'))) {
                return Promise.reject('Please input a valid price')
              }
              return Promise.resolve()
            }
          })
        ]}
      >
        <InputNumber
          disabled={disableAfterActive.current || formDisabled}
          style={{ width: 180 }}
          prefix={getCurrency()?.Symbol}
          min={0}
          onChange={handleAmountChange}
        />
      </Form.Item>

      {/* Additional Currencies Section */}
      <Form.Item label="Additional Currencies">
        <div className="space-y-4">
          {apiLoading ? (
            <div className="text-center py-4 text-gray-500">
              Loading multi-currency exchange rates...
            </div>
          ) : (
            <div className="mb-4">
              
              {/* Show plan info when loading from existing plan */}
              {!isNew && additionalCurrencies.length > 0 && (
                <div className="flex items-center space-x-2 mb-3">
                  <Tag color="green">Plan Configuration</Tag>
                </div>
              )}
              
              {additionalCurrencies.length > 0 ? (
                <div className="max-w-5xl">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Header Row */}
                    <div className="grid grid-cols-[auto,1fr,1fr,auto] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-700 min-w-[140px]">Currency</div>
                      <div className="text-sm font-medium text-gray-700">Price</div>
                      <div className="text-sm font-medium text-gray-700">Exchange Rate</div>
                      <div className="text-sm font-medium text-gray-700 text-center w-16">Actions</div>
                    </div>
                    
                    {/* Currency Rows */}
                    {additionalCurrencies.map((currency, index) => {
                      const currencyInfo = appConfig.supportCurrency.find(c => c.Currency === currency.currency)
                      return (
                        <div 
                          key={index} 
                          className={`grid grid-cols-[auto,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                            currency.disable 
                              ? 'bg-gray-100 opacity-60' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-[140px]">
                            <Checkbox
                              checked={!currency.disable}
                              onChange={(e) => updateCurrency(index, 'disable', !e.target.checked)}
                              disabled={formDisabled}
                              className="flex-shrink-0"
                            />
                            <span className={`font-medium text-sm ${
                              currency.disable ? 'text-gray-500' : 'text-gray-900'
                            }`}>
                              {currency.currency} ({currencyInfo?.Symbol})
                            </span>
                          </div>
                          
                          <div className="max-w-[140px]">
                            <InputNumber
                              value={currency.amount ? currency.amount / (currencyInfo?.Scale || 100) : 0}
                              onChange={(value) => {
                                const rawAmount = (value || 0) * (currencyInfo?.Scale || 100)
                                updateCurrency(index, 'amount', rawAmount)
                                // Update exchange rate based on new amount
                                const baseAmount = form.getFieldValue('amount') || 0
                                const baseCurrency = form.getFieldValue('currency')
                                const baseCurrencyInfo = appConfig.supportCurrency.find(c => c.Currency === baseCurrency)
                                const baseAmountWithScale = baseAmount * (baseCurrencyInfo?.Scale || 100)
                                if (baseAmountWithScale > 0) {
                                  const newRate = rawAmount / baseAmountWithScale
                                  updateCurrency(index, 'exchangeRate', newRate)
                                }
                              }}
                              disabled={true}
                              className="w-full"
                              size="small"
                              prefix={currencyInfo?.Symbol}
                              min={0}
                              precision={2}
                              placeholder="0.00"
                            />
                          </div>
                          
                          <div className="max-w-[140px]">
                            <InputNumber
                              value={currency.exchangeRate}
                              onChange={(value) => {
                                updateCurrency(index, 'exchangeRate', value || 0)
                                // Update amount based on new exchange rate
                                const baseAmount = form.getFieldValue('amount') || 0
                                const baseCurrency = form.getFieldValue('currency')
                                const baseCurrencyInfo = appConfig.supportCurrency.find(c => c.Currency === baseCurrency)
                                const baseAmountWithScale = baseAmount * (baseCurrencyInfo?.Scale || 100)
                                const newAmount = baseAmountWithScale * (value || 0)
                                updateCurrency(index, 'amount', newAmount)
                              }}
                              disabled={true}
                              className="w-full"
                              size="small"
                              min={0}
                              precision={6}
                              step={0.01}
                              placeholder="1.000000"
                            />
                          </div>
                          
                          <div className="flex justify-center w-16">
                            <Button
                              type="text"
                              danger={!currency.disable}
                              icon={<DeleteOutlined />}
                              onClick={() => updateCurrency(index, 'disable', !currency.disable)}
                              disabled={formDisabled || currency.disable}
                              size="small"
                              className={currency.disable ? "text-gray-400 cursor-not-allowed" : "hover:bg-red-50"}
                              title={currency.disable ? "Currency is disabled" : "Disable currency"}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {isNew ? (
                    !form.getFieldValue('amount') || !form.getFieldValue('currency')
                      ? 'Please enter both amount and currency to see multi-currency pricing.'
                      : 'No additional currencies available from the exchange API.'
                  ) : (
                    'No additional currencies configured for this plan.'
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Form.Item>

      <Form.Item
        label={
          <span>
            <span className="text-red-500">*</span>
            <span>Billing Period</span>
          </span>
        }
        className="mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center h-[38px] bg-white rounded-lg border border-solid border-gray-200 overflow-hidden !shadow-none [&]:shadow-none [&_*]:shadow-none" style={{ boxShadow: 'none !important', filter: 'none', WebkitBoxShadow: 'none', MozBoxShadow: 'none', WebkitAppearance: 'none' }}>
            <div className="flex items-center h-[38px] px-4 bg-gray-50 border-r border-solid border-gray-200 !shadow-none [&_*]:shadow-none relative" style={{ 
              boxShadow: 'none !important',
              WebkitBoxShadow: 'none !important',
              MozBoxShadow: 'none !important',
              WebkitAppearance: 'none',
              appearance: 'none',
              marginLeft: '-1px',
              paddingLeft: '17px',
              borderLeft: '1px solid #f9fafb',
              marginTop: '-1px',
              marginBottom: '-1px',
              height: 'calc(100% + 2px)',
              borderTop: '1px solid #f9fafb',
              borderBottom: '1px solid #f9fafb'
            }}>
              <span className="text-[15px] text-gray-600 capitalize">
                {watchPlanType === PlanType.ONE_TIME_ADD_ON ? 'For' : 'Every'}
              </span>
            </div>
            
            <Form.Item
              name="intervalCount"
              noStyle
              rules={[
                {
                  required: true,
                  message: 'Please input interval count!'
                },
                () => ({
                  validator(_, value) {
                    if (!Number.isInteger(value)) {
                      return Promise.reject(
                        `Please input a valid interval count (> 0).`
                      )
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            >
              <InputNumber
                disabled={disableAfterActive.current || formDisabled}
                className="w-[80px] h-[38px] text-center !border-0 [&.ant-input-number-outlined]:border-0 [&.ant-input-number]:border-0 [&_.ant-input-number-input-wrap]:border-0 [&_.ant-input-number-input]:border-0 [&]:hover:border-0 [&.ant-input-number-focused]:shadow-none [&.ant-input-number]:shadow-none [&.ant-input-number-outlined]:shadow-none [&_.ant-input-number-handler-wrap]:border-0 [&_.ant-input-number-handler]:border-0"
                controls={{
                  upIcon: <span className="text-[10px] text-gray-500 block">▲</span>,
                  downIcon: <span className="text-[10px] text-gray-500 block">▼</span>
                }}
                min={1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '38px'
                }}
              />
            </Form.Item>
          </div>
          
          <Form.Item
            name="intervalUnit"
            noStyle
            rules={[
              {
                required: true,
                message: 'Please select interval unit!'
              }
            ]}
          >
            <Select
              disabled={disableAfterActive.current || formDisabled}
              className="w-[60px] !rounded-lg"
              style={{ width: 180, height: 38 }}
              options={[
                { value: 'day', label: 'day' },
                { value: 'week', label: 'week' },
                { value: 'month', label: 'month' },
                { value: 'year', label: 'year' }
              ]}
              placeholder="month"
              dropdownStyle={{
                borderRadius: '8px',
                boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
              }}
            />
          </Form.Item>
        </div>
      </Form.Item>
    </div>
  )
}

export default Index
