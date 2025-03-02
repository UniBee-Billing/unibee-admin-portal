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
import { Form } from 'antd'
import { Currency } from 'dinero.js'
import {
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useMemo
} from 'react'
import { formatQuantity } from '../helpers'

const { RangePicker } = DatePicker

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
  canActiveItemEdit
}: {
  code: DiscountCode
  isNew: boolean
  formEditable: boolean
  watchApplyType: number
  watchBillingType: number
  watchDiscountType: number
  watchCurrency: string
  planList: IPlan[]
  getPlanLabel: (planId: number) => string
  setIsOpenUpdateDiscountCodeQuantityModal: Dispatch<SetStateAction<boolean>>
  canActiveItemEdit: (status?: DiscountCodeStatus) => boolean
}) => {
  const appStore = useAppConfigStore()
  //   const getCurrency = () => appStore.currency[watchCurrency as Currency]!

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
        <Input />
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
      {!isNew && (
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
            disabled={
              watchDiscountType == DiscountType.PERCENTAGE || !formEditable
            }
            style={{ width: 180 }}
            options={appStore.supportCurrency.map((c) => ({
              label: c.Currency,
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
              watchCurrency == null || watchCurrency == '' ? (
                <span></span>
              ) : (
                appStore.currency[watchCurrency as Currency]?.Symbol
              )
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
                  if (isNaN(num) || num < 0 || num > 999) {
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
              min={1}
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
          </Space>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        hidden={watchApplyType == DiscountCodeApplyType.ALL}
        name="planIds"
        rules={[
          {
            // required: watchPlanIds != null && watchPlanIds.length > 0
            required: watchApplyType != DiscountCodeApplyType.ALL,
            message: 'Plan list should not be empty.'
          },
          () => ({
            validator(_, plans) {
              if (
                watchApplyType !== DiscountCodeApplyType.ALL &&
                (plans == null || plans.length == 0)
              ) {
                return Promise.reject(
                  `Please select the plans you ${watchApplyType == DiscountCodeApplyType.SELECTED ? 'want to apply' : "don't want to apply"}.`
                )
              }
              for (let i = 0; i < plans.length; i++) {
                if (planList.findIndex((p) => p.id == plans[i]) == -1) {
                  return Promise.reject(
                    `${getPlanLabel(plans[i])} doesn't exist in plan list, please remove it.`
                  )
                }
              }
              return Promise.resolve()
            }
          })
        ]}
        extra={
          watchApplyType == DiscountCodeApplyType.SELECTED
            ? 'The discount code will be applied to selected plans'
            : 'The discount code will be applied to all plans except selected plans'
        }
      >
        <Select
          mode="multiple"
          disabled={!canActiveItemEdit(code?.status)}
          allowClear
          style={{ width: '100%' }}
          options={planList.map((p) => ({
            label: getPlanLabel(p.id),
            value: p.id
          }))}
        />
      </Form.Item>
    </div>
  )
}

export default Index
