import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Radio,
  Select,
  Space
} from 'antd'

import { getDiscountCodeStatusTagById } from '@/components/ui/statusTag'
import { currencyDecimalValidate } from '@/helpers'
import {
  DiscountCode,
  DiscountCodeApplyType,
  DiscountCodeBillingType,
  DiscountCodeStatus,
  DiscountType,
  IPlan
} from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import { Form, FormInstance } from 'antd'
import { Currency } from 'dinero.js'
import { Dispatch, ReactNode, SetStateAction, useMemo } from 'react'
import { formatQuantity } from '../helpers'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { nanoid } from 'nanoid'

const { RangePicker } = DatePicker

type BillingPeriod = {
  intervalUnit: 'day' | 'week' | 'month' | 'year'
  intervalCount: number
  localId: string
}

const Index = ({
  code,
  isNew,
  formEditable,
  watchApplyType,
  watchBillingType,
  watchDiscountType,
  watchCurrency,
  planList,
  getPlanLabel,
  setIsOpenUpdateDiscountCodeQuantityModal,
  canActiveItemEdit,
  billingPeriods,
  setBillingPeriods,
  form
}: {
  code: DiscountCode
  isNew: boolean
  formEditable: boolean
  watchApplyType: number
  watchBillingType: number
  watchDiscountType: number
  watchCurrency: string
  planList: IPlan[]
  getPlanLabel: (planId: number) => ReactNode
  setIsOpenUpdateDiscountCodeQuantityModal: Dispatch<SetStateAction<boolean>>
  canActiveItemEdit: (status?: DiscountCodeStatus) => boolean
  billingPeriods: BillingPeriod[]
  setBillingPeriods: Dispatch<SetStateAction<BillingPeriod[]>>
  form: FormInstance
}) => {
  const appConfigStore = useAppConfigStore()

  const filteredPlanList = useMemo(() => {
    if (
      watchApplyType ===
        DiscountCodeApplyType.APPLY_TO_PLANS_BY_BILLING_PERIOD ||
      watchApplyType ===
        DiscountCodeApplyType.APPLY_TO_PLANS_EXCEPT_BY_BILLING_PERIOD
    ) {
      return planList.filter((plan) => {
        return billingPeriods.some(
          (period) =>
            plan.intervalUnit === period.intervalUnit &&
            plan.intervalCount === Number(period.intervalCount)
        )
      })
    }
    return planList
  }, [planList, billingPeriods, watchApplyType])

  const RENDERED_QUANTITY_ITEMS_MAP: Record<number, ReactNode> = useMemo(
    () => ({
      [DiscountCodeStatus.ACTIVE]: (
        <div>
          <span className="mr-2">{formatQuantity(code?.quantity ?? 0)}</span>
          <Button
            disabled={!code?.id}
            onClick={() => setIsOpenUpdateDiscountCodeQuantityModal(true)}
          >
            Update
          </Button>
        </div>
      ),
      [DiscountCodeStatus.EXPIRED]: (
        <InputNumber style={{ width: 180 }} disabled />
      )
    }),
    [code?.quantity, code?.id]
  )

  const renderedQuantityItems = useMemo(
    () =>
      RENDERED_QUANTITY_ITEMS_MAP[code?.status ?? -1] ?? (
        <InputNumber min={0} style={{ width: 180 }} />
      ),
    [code?.status, code?.quantity]
  )

  return (
    <div className="pt-4">
      {!isNew && (
        <Form.Item label="ID" name="id" hidden>
          <Input disabled />
        </Form.Item>
      )}
      <Form.Item label="merchant Id" name="merchantId" hidden>
        <Input disabled />
      </Form.Item>
      <Form.Item
        label="Name"
        name="name"
        rules={[
          {
            required: true,
            message: 'Please input your discount code name!'
          }
        ]}
      >
        <Input disabled={!canActiveItemEdit(code?.status)} />
      </Form.Item>

      <Form.Item
        label="Code"
        name="code"
        rules={[
          {
            required: true,
            message: 'Please input your discount code!'
          }
        ]}
      >
        <Input disabled={!isNew} />
      </Form.Item>
      {!isNew && code.status != null && (
        <Form.Item label="Status">
          {getDiscountCodeStatusTagById(code.status as number)}
        </Form.Item>
      )}
      <Form.Item
        label="Quantity"
        name="quantity"
        rules={[
          {
            required: true,
            message: 'Please input valid quantity'
          }
        ]}
        extra={'0 quantity means unlimited.'}
      >
        {renderedQuantityItems}
      </Form.Item>
      <Form.Item
        label="Discount Type"
        name="discountType"
        className="mb-0"
        rules={[
          {
            required: true,
            message: 'Please choose your discountType type!'
          }
        ]}
      >
        <Select
          style={{ width: 180 }}
          options={[
            { value: DiscountType.PERCENTAGE, label: 'Percentage' },
            { value: DiscountType.AMOUNT, label: 'Fixed amount' }
          ]}
          disabled={!isNew}
        />
      </Form.Item>
      <div className="my-5 ml-[180px] rounded-xl bg-[#FAFAFA] px-4 py-6">
        {' '}
        <Form.Item
          label="Discount percentage"
          name="discountPercentage"
          rules={[
            {
              required: watchDiscountType == DiscountType.PERCENTAGE,
              message: 'Please choose your discount percentage!'
            },
            () => ({
              validator(_, value) {
                if (watchDiscountType == DiscountType.AMOUNT) {
                  return Promise.resolve()
                }
                const num = Number(value)
                if (isNaN(num) || num <= 0 || num > 100) {
                  return Promise.reject(
                    'Please input a valid percentage number between 0 ~ 100.'
                  )
                }
                return Promise.resolve()
              }
            })
          ]}
        >
          <InputNumber
            min={0}
            max={100}
            style={{ width: 180 }}
            disabled={watchDiscountType == DiscountType.AMOUNT || !formEditable}
            suffix="%"
          />
        </Form.Item>
        <Form.Item
          label="Currency"
          name="currency"
          rules={[
            {
              required: watchDiscountType != DiscountType.PERCENTAGE,
              message: 'Please select your currency!'
            }
          ]}
        >
          <Select
            showSearch
            filterSort={(optionA, optionB) => {
              return (optionA?.label ?? '')
                .toLocaleLowerCase()
                .localeCompare((optionB?.label ?? '').toLocaleLowerCase())
            }}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            disabled={
              watchDiscountType == DiscountType.PERCENTAGE || !formEditable
            }
            style={{ width: 180 }}
            options={appConfigStore.supportCurrency.map((c) => ({
              label: `${c.Currency} (${c.Symbol})`,
              value: c.Currency
            }))}
          />
        </Form.Item>
        <Form.Item
          label="Discount Amount"
          name="discountAmount"
          dependencies={['currency']}
          className="mb-0"
          rules={[
            {
              required: watchDiscountType != DiscountType.PERCENTAGE,
              message: 'Please input your discount amount!'
            },
            () => ({
              validator(_, value) {
                if (watchDiscountType == DiscountType.PERCENTAGE) {
                  return Promise.resolve()
                }
                const num = Number(value)
                if (isNaN(num) || num <= 0) {
                  return Promise.reject('Please input a valid amount (> 0).')
                }
                if (!currencyDecimalValidate(num, watchCurrency as Currency)) {
                  return Promise.reject('Please input a valid amount')
                }
                return Promise.resolve()
              }
            })
          ]}
        >
          <InputNumber
            min={0}
            style={{ width: 180 }}
            prefix={
              watchCurrency == null || watchCurrency == ''
                ? ''
                : appConfigStore.currency[watchCurrency as Currency]?.Symbol
            }
            disabled={
              watchDiscountType == DiscountType.PERCENTAGE || !formEditable
            }
          />
        </Form.Item>
      </div>
      <Form.Item
        label="One-time or recurring"
        name="billingType"
        className=""
        rules={[
          {
            required: true,
            message: 'Please choose your billing type!'
          }
        ]}
      >
        <Select
          style={{ width: 180 }}
          options={[
            { value: DiscountCodeBillingType.ONE_TIME, label: 'One time use' },
            { value: DiscountCodeBillingType.RECURRING, label: 'Recurring' }
          ]}
          disabled={!isNew}
        />
      </Form.Item>
      <div className="my-5 ml-[180px] rounded-xl bg-[#FAFAFA] px-4 py-6">
        {' '}
        <Form.Item
          label="Recurring cycle"
          extra="How many billing cycles this discount code can be applied on a
                recurring subscription (0 means unlimited)."
        >
          <Form.Item
            noStyle
            name="cycleLimit"
            rules={[
              {
                required: watchBillingType != DiscountCodeBillingType.ONE_TIME,
                message: 'Please input your cycleLimit!'
              },
              () => ({
                validator(_, value) {
                  const num = Number(value)
                  if (!Number.isInteger(num)) {
                    return Promise.reject(
                      'Please input a valid cycle limit number between 0 ~ 1000.'
                    )
                  }
                  if (isNaN(num) || num < 0 || num > 1000) {
                    return Promise.reject(
                      'Please input a valid cycle limit number between 0 ~ 1000.'
                    )
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: 180 }}
              disabled={
                watchBillingType == DiscountCodeBillingType.ONE_TIME ||
                !formEditable
              }
            />
          </Form.Item>
        </Form.Item>
      </div>

      <Form.Item
        label="Code Apply Date Range"
        name="validityRange"
        rules={[
          {
            required: true,
            message: 'Please choose your validity range!'
          },
          () => ({
            validator(_, value) {
              if (value == null || value[0] == null || value[1] == null) {
                return Promise.reject('Please select a valid date range.')
              }
              const d = new Date()
              const sec = Math.round(d.getTime() / 1000)
              if (value[1].unix() < sec) {
                return Promise.reject('End date must be greater than now.')
              }
              return Promise.resolve()
            }
          })
        ]}
      >
        <RangePicker
          showTime
          format="YYYY-MMM-DD HH:mm:ss"
          disabled={!canActiveItemEdit(code?.status)}
        />
      </Form.Item>
      <Form.Item label="Apply Discount Code To" name="planApplyType">
        <Radio.Group disabled={!canActiveItemEdit(code?.status)}>
          <Space direction="vertical">
            <Radio value={DiscountCodeApplyType.ALL}>All plans</Radio>
            <Radio value={DiscountCodeApplyType.SELECTED}>Selected plans</Radio>
            <Radio value={DiscountCodeApplyType.NOT_SELECTED}>
              All plans except selected plans
            </Radio>
            <Radio
              value={DiscountCodeApplyType.APPLY_TO_PLANS_BY_BILLING_PERIOD}
            >
              Apply to Plans by Billing Period
            </Radio>
            <Radio
              value={
                DiscountCodeApplyType.APPLY_TO_PLANS_EXCEPT_BY_BILLING_PERIOD
              }
            >
              Apply to Plans except by Billing Period
            </Radio>
          </Space>
        </Radio.Group>
      </Form.Item>
      {(watchApplyType ===
        DiscountCodeApplyType.APPLY_TO_PLANS_BY_BILLING_PERIOD ||
        watchApplyType ===
          DiscountCodeApplyType.APPLY_TO_PLANS_EXCEPT_BY_BILLING_PERIOD) && (
        <Form.Item label="Billing Periods">
          <div className="flex flex-col gap-4">
            {billingPeriods.map((period, index) => (
              <Space key={period.localId} className="flex items-center">
                <label className="w-[100px]">
                  <span className="mr-1 text-red-500">*</span>Billing Period
                </label>
                <span className="mr-2">Every</span>
                <InputNumber
                  min={1}
                  value={period.intervalCount}
                  onChange={(value) => {
                    const newBillingPeriods = [...billingPeriods]
                    newBillingPeriods[index].intervalCount = value || 1
                    setBillingPeriods(newBillingPeriods)
                  }}
                  style={{ width: '100px' }}
                  disabled={!canActiveItemEdit(code?.status)}
                />

                <Select
                  value={period.intervalUnit}
                  onChange={(value) => {
                    const newBillingPeriods = [...billingPeriods]
                    newBillingPeriods[index].intervalUnit = value
                    setBillingPeriods(newBillingPeriods)
                  }}
                  options={[
                    { value: 'day', label: 'Day(s)' },
                    { value: 'week', label: 'Week(s)' },
                    { value: 'month', label: 'Month(s)' },
                    { value: 'year', label: 'Year(s)' }
                  ]}
                  style={{ width: 120 }}
                  disabled={!canActiveItemEdit(code?.status)}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={billingPeriods.length <= 1 || !canActiveItemEdit(code?.status)}
                  onClick={() => {
                    const removedPeriod = billingPeriods[index];
                    const newBillingPeriods = [...billingPeriods];
                    newBillingPeriods.splice(index, 1);
                    setBillingPeriods(newBillingPeriods);

                    const currentPlanIds = form.getFieldValue('planIds') as number[];
                    if (currentPlanIds?.length > 0) {
                      const plansForRemovedPeriod = planList.filter(plan =>
                        plan.intervalUnit === removedPeriod.intervalUnit &&
                        plan.intervalCount === Number(removedPeriod.intervalCount)
                      );
                      const planIdsForRemovedPeriod = plansForRemovedPeriod.map(plan => plan.id);
                      const newPlanIds = currentPlanIds.filter(id => !planIdsForRemovedPeriod.includes(id));
                      form.setFieldsValue({ planIds: newPlanIds });
                    }
                  }}
                  title="Delete this option"
                />
              </Space>
            ))}
          </div>
          <div className="flex gap-4 mt-4">
            <Button
              type="primary"
              onClick={() => {
                setBillingPeriods([
                  ...billingPeriods,
                  {
                    intervalCount: 1,
                    intervalUnit: 'month',
                    localId: nanoid()
                  }
                ])
              }}
              icon={<PlusOutlined />}
              disabled={!canActiveItemEdit(code?.status)}
            >
              Add More Options
            </Button>
          </div>
        </Form.Item>
      )}

      {(watchApplyType === DiscountCodeApplyType.SELECTED ||
        watchApplyType === DiscountCodeApplyType.NOT_SELECTED ||
        watchApplyType ===
          DiscountCodeApplyType.APPLY_TO_PLANS_BY_BILLING_PERIOD ||
        watchApplyType ===
          DiscountCodeApplyType.APPLY_TO_PLANS_EXCEPT_BY_BILLING_PERIOD) && (
        <Form.Item
          className="mb-0"
          label={
            watchApplyType === DiscountCodeApplyType.SELECTED ||
            watchApplyType ===
              DiscountCodeApplyType.APPLY_TO_PLANS_EXCEPT_BY_BILLING_PERIOD
              ? 'Include Plans'
              : 'Exclude Plans'
          }
          name="planIds"
          rules={[
            () => ({
              validator(_, plans) {
                if (plans && plans.length > 50) {
                  return Promise.reject(
                    'You can select up to 50 plans at most'
                  )
                }
                return Promise.resolve()
              }
            })
          ]}
          extra={
            watchApplyType === DiscountCodeApplyType.SELECTED
              ? 'The discount code will be applied to selected plans'
              : watchApplyType === DiscountCodeApplyType.NOT_SELECTED
              ? 'The discount code will be applied to all plans except selected plans'
              : watchApplyType === DiscountCodeApplyType.APPLY_TO_PLANS_BY_BILLING_PERIOD
              ? 'The discount code will be applied to selected billing period exclude selected plans'
              : 'The discount code will be not applied to selected billing period but include selected plans'
          }
        >
          <Select
            mode="multiple"
            maxTagCount={'responsive'}
            showSearch
            disabled={false}
            filterSort={(optionA, optionB) => {
              const labelA = String(optionA?.label ?? '')
              const labelB = String(optionB?.label ?? '')
              return labelA
                .toLocaleLowerCase()
                .localeCompare(labelB.toLocaleLowerCase())
            }}
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={filteredPlanList.map((plan) => ({
              label: getPlanLabel(plan.id),
              value: plan.id
            }))}
          />
        </Form.Item>
      )}
    </div>
  )
}

export default Index
