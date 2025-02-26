import { PlanStatusTag } from '@/components/ui/statusTag'
import { currencyDecimalValidate, showAmount } from '@/helpers'
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
import { TNewPlan } from '.'

interface Props {
  isNew: boolean
  productDetail: IProduct | null
  plan: IPlan | TNewPlan
  planTypeWatch: PlanType
  formDisabled: boolean
  disableAfterActive: MutableRefObject<boolean>
  getCurrency: () => CURRENCY
  selectAddons: IPlan[]
  selectOnetime: IPlan[]
  loading: boolean
  refresh: () => void
}
const Index = ({
  isNew,
  productDetail,
  plan,
  planTypeWatch,
  formDisabled,
  disableAfterActive,
  getCurrency,
  selectAddons,
  selectOnetime,
  loading,
  refresh
}: Props) => {
  const appConfig = useAppConfigStore()
  const [publishing, setPublishing] = useState(false) // when toggling publish/unpublish

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

      <Form.Item label="Product name">
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
          options={appConfig.supportCurrency.map((c) => ({
            value: c.Currency,
            label: c.Currency
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

              if (isNaN(num) || num <= 0) {
                return Promise.reject(`Please input a valid price (> 0).`)
              }
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
        />
      </Form.Item>

      <div>
        <Form.Item
          label="Interval Unit"
          name="intervalUnit"
          rules={[
            {
              required: planTypeWatch != PlanType.ONE_TIME_ADD_ON,
              message: 'Please select interval unit!'
            }
          ]}
        >
          <Select
            style={{ width: 180 }}
            disabled={
              planTypeWatch == PlanType.ONE_TIME_ADD_ON ||
              disableAfterActive.current ||
              formDisabled
            } // one-time payment has no interval unit/count
            options={[
              { value: 'day', label: 'day' },
              { value: 'week', label: 'week' },
              { value: 'month', label: 'month' },
              { value: 'year', label: 'year' }
            ]}
          />
        </Form.Item>
      </div>

      <Form.Item
        label="Interval Count"
        name="intervalCount"
        rules={[
          {
            required: true,
            message: 'Please input interval count!'
          }
        ]}
      >
        <Input
          disabled={
            planTypeWatch == PlanType.ONE_TIME_ADD_ON ||
            disableAfterActive.current ||
            formDisabled
          }
          style={{ width: 180 }}
        />
        {/* one-time payment has no interval unit/count */}
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

      {plan.type == PlanType.MAIN && (
        <Form.Item
          label="Add-ons"
          name="addonIds"
          dependencies={['currency', 'intervalCount', 'intervalUnit']}
          rules={[
            {
              required: false,
              message: ''
            },
            () => ({
              validator(_, value) {
                if (value == null || value.length == 0) {
                  return Promise.resolve()
                }
                for (const addonId of value) {
                  if (selectAddons.findIndex((a) => a.id == addonId) == -1) {
                    return Promise.reject('Addon not found!')
                  }
                }
                return Promise.resolve()
              }
            })
          ]}
        >
          <Select
            mode="multiple"
            allowClear
            disabled={
              planTypeWatch == PlanType.ADD_ON ||
              planTypeWatch == PlanType.ONE_TIME_ADD_ON ||
              formDisabled
            } // you cannot add addon to another addon (or another one time payment)
            style={{ width: '100%' }}
            options={selectAddons.map((a) => ({
              label: `${a.planName} (${showAmount(a.amount, a.currency)}/${a.intervalCount == 1 ? '' : a.intervalCount}${a.intervalUnit})`,
              value: a.id
            }))}
          />
        </Form.Item>
      )}

      {plan.type == PlanType.MAIN && (
        <Form.Item
          label="One-time-payment add-on"
          name="onetimeAddonIds"
          dependencies={['currency']}
          rules={[
            {
              required: false,
              message: ''
            },
            () => ({
              validator(_, value) {
                if (value == null || value.length == 0) {
                  return Promise.resolve()
                }
                for (const addonId of value) {
                  if (selectOnetime.findIndex((a) => a.id == addonId) == -1) {
                    return Promise.reject('Addon not found!')
                  }
                }
                return Promise.resolve()
              }
            })
          ]}
        >
          <Select
            mode="multiple"
            allowClear
            disabled={
              planTypeWatch == PlanType.ADD_ON ||
              planTypeWatch == PlanType.ONE_TIME_ADD_ON ||
              formDisabled
            } // you cannot add one-time payment addon to another addon (or another one time payment)
            style={{ width: '100%' }}
            options={selectOnetime.map((a) => ({
              label: `${a.planName} (${showAmount(a.amount, a.currency)})`,
              value: a.id
            }))}
          />
        </Form.Item>
      )}
    </div>
  )
}

export default Index
