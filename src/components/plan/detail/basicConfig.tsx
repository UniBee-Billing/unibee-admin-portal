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
import { CheckCircleOutlined, MinusOutlined } from '@ant-design/icons'
import { Button, Input, InputNumber, message, Select, Tag } from 'antd'

import { togglePublishReq } from '@/requests'
import { useAppConfigStore } from '@/stores'
import { Form } from 'antd'
import { MutableRefObject, useState } from 'react'
import { TNewPlan } from './types'

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

  return (
    <div className="pt-4">
      {!isNew && (
        <Form.Item label="ID" name="id" hidden>
          <Input disabled />
        </Form.Item>
      )}

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
        label="Currency"
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
        />
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
