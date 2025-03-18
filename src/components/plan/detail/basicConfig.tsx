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
        label={<span><span style={{ color: '#ff4d4f' }}>*</span>Billing Period</span>}
        style={{ marginBottom: '24px' }}
      >
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          border: '1px solid #e8e8e8',
          borderRadius: '8px',
          background: 'white',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'flex',
            padding: '0 20px',
            alignItems: 'center',
            height: '15px',
            background: '#fafafa',
            borderRight: '1px solid #f0f0f0'
          }}>
            <span style={{ 
              fontSize: '15px', 
              color: '#595959',
              textTransform: 'capitalize'
            }}>
              {watchPlanType === PlanType.ONE_TIME_ADD_ON ? 'For' : 'Every'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
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
                style={{ 
                  width: '120px',
                  height: '35px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  marginRight: '16px',
                  textAlign: 'center'
                }}
                controls={{
                  upIcon: <span style={{ fontSize: '10px', color: '#8c8c8c' }}>▲</span>,
                  downIcon: <span style={{ fontSize: '10px', color: '#8c8c8c' }}>▼</span>
                }}
                min={1}
                className="text-center"
              />
            </Form.Item>
            
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
                style={{ 
                  width: '196px',
                  height: '35px',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                options={[
                  { value: 'day', label: 'day' },
                  { value: 'week', label: 'week' },
                  { value: 'month', label: 'month' },
                  { value: 'year', label: 'year' }
                ]}
                placeholder="month"
                suffixIcon={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>▾</span>}
                dropdownStyle={{ borderRadius: '6px', boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)' }}
              />
            </Form.Item>
          </div>
        </div>
      </Form.Item>
    </div>
  )
}

export default Index
