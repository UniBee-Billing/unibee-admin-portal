import {
  currencyDecimalValidate,
  isValidMap,
  randomString,
  showAmount
} from '@/helpers'
import {
  CURRENCY,
  IBillableMetrics,
  IPlan,
  MetricType,
  PlanType
} from '@/shared.types'
import {
  DownOutlined,
  FormatPainterOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Collapse,
  CollapseProps,
  Dropdown,
  Form,
  FormInstance,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Tooltip
} from 'antd'
import update from 'immutability-helper'

import { Switch } from 'antd'
import { useState } from 'react'

type TMetricsItem = {
  localId: string
  metricId?: number
  metricLimit?: number | string
}

const TIME_UNITS = [
  // in seconds
  { label: 'hours', value: 60 * 60 },
  { label: 'days', value: 60 * 60 * 24 },
  { label: 'weeks', value: 60 * 60 * 24 * 7 },
  { label: 'months(30days)', value: 60 * 60 * 24 * 30 }
]
/*
const secondsToUnit = (sec: number) => {
  const units = [...TIME_UNITS].sort((a, b) => b.value - a.value)
  for (let i = 0; i < units.length; i++) {
    if (sec % units[i].value === 0) {
      return [sec / units[i].value, units[i].value] // if sec is 60 * 60 * 24 * 30 * 3, then return [3, 60 * 60 * 24 * 30 * 3]
    }
  }
  throw Error('Invalid time unit')
}

const unitToSeconds = (value: number, unit: number) => {
  return value * unit
}
  */

interface Props {
  enableTrialWatch: boolean
  formDisabled: boolean
  getCurrency: () => CURRENCY
  form: FormInstance
  watchPlanType: PlanType
  metricsList: IBillableMetrics[]
  selectAddons: IPlan[]
  selectOnetime: IPlan[]
}

const Index = ({
  enableTrialWatch,
  formDisabled,
  getCurrency,
  form,
  watchPlanType,
  metricsList,
  selectAddons,
  selectOnetime
}: Props) => {
  // const [metricsList, setMetricsList] = useState<IBillableMetrics[]>([]) // all the billable metrics, not used for edit, but used in <Select /> for user to choose.
  const [selectedMetrics, setSelectedMetrics] = useState<TMetricsItem[]>([
    // metrics are hard to let form handle change, I have to manually handle it
    { localId: randomString(8) }
  ])

  const [trialLengthUnit, setTrialLengthUnit] = useState(
    TIME_UNITS.find((u) => u.label == 'days')?.value
  ) // default unit is days
  const onTrialLengthUnitChange = (val: number) => setTrialLengthUnit(val)

  // it just adds an empty metrics item
  const addMetrics = () => {
    if (formDisabled) {
      return
    }
    const m: TMetricsItem = { localId: randomString(8) }
    setSelectedMetrics(update(selectedMetrics, { $push: [m] }))
  }

  const removeMetrics = (localId: string) => {
    if (formDisabled) {
      return
    }
    const idx = selectedMetrics.findIndex((m) => m.localId == localId)
    if (idx != -1) {
      setSelectedMetrics(update(selectedMetrics, { $splice: [[idx, 1]] }))
    }
  }

  const updateMetrics =
    (localId: string) => (evt: React.ChangeEvent<HTMLInputElement>) => {
      const idx = selectedMetrics.findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setSelectedMetrics(
          update(selectedMetrics, {
            [idx]: { metricLimit: { $set: evt.target.value } }
          })
        )
      }
    }

  const onMetricSelectChange = (localId: string) => (val: number) => {
    const idx = selectedMetrics.findIndex((m) => m.localId == localId)
    if (idx != -1) {
      const newMetrics = update(selectedMetrics, {
        [idx]: { metricId: { $set: val } }
      })
      setSelectedMetrics(newMetrics)
    }
  }

  const prettifyJSON = () => {
    const metadata = form.getFieldValue('metadata')
    if (metadata == '' || metadata == null) {
      return
    }
    try {
      const obj = JSON.parse(metadata)
      form.setFieldValue('metadata', JSON.stringify(obj, null, 4))
    } catch {
      message.error('Invalid custom data.')
      return
    }
  }

  const selectAfter = (
    <Select
      value={trialLengthUnit}
      style={{ width: 150 }}
      onChange={onTrialLengthUnitChange}
      disabled={!enableTrialWatch || formDisabled}
    >
      {TIME_UNITS.map((u) => (
        <Select.Option key={u.label} value={u.value}>
          {u.label}
        </Select.Option>
      ))}
    </Select>
  )

  const addonsItem: CollapseProps['items'] = [
    {
      key: 'addons',
      label: 'Addons',
      style: { backgroundColor: '#F5F5F5' },
      forceRender: true,
      children: (
        <>
          {
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
                      if (
                        selectAddons.findIndex((a) => a.id == addonId) == -1
                      ) {
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
                  watchPlanType == PlanType.ADD_ON ||
                  watchPlanType == PlanType.ONE_TIME_ADD_ON ||
                  formDisabled
                } // you cannot add addon to another addon (or another one time payment)
                style={{ width: '100%' }}
                options={selectAddons.map((a) => ({
                  label: (
                    <>
                      <span>{a.planName}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {`(${showAmount(a.amount, a.currency)}/${a.intervalCount == 1 ? '' : a.intervalCount}${a.intervalUnit})`}{' '}
                      </span>{' '}
                    </>
                  ),
                  value: a.id
                }))}
              />
            </Form.Item>
          }

          {
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
                      if (
                        selectOnetime.findIndex((a) => a.id == addonId) == -1
                      ) {
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
                  watchPlanType == PlanType.ADD_ON ||
                  watchPlanType == PlanType.ONE_TIME_ADD_ON ||
                  formDisabled
                } // you cannot add one-time payment addon to another addon (or another one time payment)
                style={{ width: '100%' }}
                options={selectOnetime.map((a) => ({
                  label: (
                    <>
                      <span>{a.planName}</span>
                      <span className="ml-2 text-xs text-gray-500">{`(${showAmount(a.amount, a.currency)})`}</span>{' '}
                    </>
                  ),
                  value: a.id
                }))}
              />
            </Form.Item>
          }
        </>
      )
    }
  ]

  const trialItem: CollapseProps['items'] = [
    {
      key: 'trial',
      collapsible: 'icon',
      style: { backgroundColor: '#F5F5F5' },
      forceRender: true,
      label: (
        <div className="flex justify-start gap-3">
          <span>Trial</span>
          <Form.Item label="Allow Trial" name="enableTrial" noStyle={true}>
            <Switch />
          </Form.Item>
        </div>
      ),
      children: (
        <>
          <Form.Item label="Trial Price">
            <Form.Item
              name="trialAmount"
              noStyle
              dependencies={['amount', 'currency']}
              rules={[
                {
                  required: enableTrialWatch,
                  message: 'Please input your trial price!'
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!enableTrialWatch) {
                      return Promise.resolve()
                    }
                    const num = Number(value)
                    const planPrice = Number(getFieldValue('amount'))
                    if (isNaN(planPrice)) {
                      return Promise.reject('Input a valid plan price first.')
                    }
                    if (isNaN(num) || num <= 0 || num >= planPrice) {
                      return Promise.reject(
                        `Please input a valid price (>= 0 and < plan price ${getFieldValue('amount')}).`
                      )
                    }
                    if (
                      !currencyDecimalValidate(num, getFieldValue('currency'))
                    ) {
                      return Promise.reject('Please input a valid price')
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            >
              <InputNumber
                disabled={!enableTrialWatch || formDisabled}
                style={{ width: 240 }}
                prefix={getCurrency()?.Symbol}
                min={0}
              />
            </Form.Item>
            <span className="ml-2 text-xs text-gray-400">
              For free trial, input 0.
            </span>
          </Form.Item>

          <Form.Item
            label="Trial length"
            name="trialDurationTime"
            rules={[
              {
                required: enableTrialWatch,
                message: 'Please input your trial length!'
              },
              () => ({
                validator(_, value) {
                  if (!enableTrialWatch) {
                    return Promise.resolve()
                  }
                  if (!Number.isInteger(value)) {
                    return Promise.reject('Invalid trial length (>=1)')
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <InputNumber
              min={1}
              style={{ width: 240 }}
              addonAfter={selectAfter}
              disabled={!enableTrialWatch || formDisabled}
            />
          </Form.Item>

          <div className="relative flex items-center">
            <Form.Item label="Trial requires bank card info" name="trialDemand">
              <Switch disabled={!enableTrialWatch || formDisabled} />
            </Form.Item>
            <div
              className="absolute mb-6 ml-60 text-xs text-gray-400"
              // style={{ top: '-45px', left: '240px', width: '600px' }}
            >
              When enabled, users can only use bank card payment (no Crypto or
              wire transfer) for their first purchase.
            </div>
          </div>

          <Form.Item label="Auto renew after trial end" name="cancelAtTrialEnd">
            <Switch disabled={!enableTrialWatch || formDisabled} />
          </Form.Item>
        </>
      )
    }
  ]
  const billableItem: CollapseProps['items'] = [
    {
      key: 'billable',
      label: 'Usage-based billing model',
      forceRender: true,
      style: { backgroundColor: '#F5F5F5' },
      children: (
        <div>
          <Form.Item noStyle={true}>
            <Row
              gutter={[8, 8]}
              style={{ marginTop: '0px' }}
              className="font-bold text-gray-500"
            >
              <Col span={5}>Name</Col>
              <Col span={3}>Code</Col>
              <Col span={6}>Description</Col>
              <Col span={5}>Aggregation Property</Col>
              <Col span={3}>Limit Value</Col>
              <Col span={2}>
                <div
                  onClick={addMetrics}
                  className={`w-16 font-bold ${watchPlanType == PlanType.ONE_TIME_ADD_ON || formDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <PlusOutlined />
                </div>
              </Col>
            </Row>
            {selectedMetrics.map((m) => (
              <Row key={m.localId} gutter={[8, 8]} className="my-4">
                <Col span={5}>
                  <Select
                    disabled={
                      watchPlanType == PlanType.ONE_TIME_ADD_ON || formDisabled
                    }
                    value={m.metricId}
                    onChange={onMetricSelectChange(m.localId)}
                    style={{ width: 180 }}
                    options={metricsList.map((m) => ({
                      label: m.metricName,
                      value: m.id
                    }))}
                  />
                </Col>
                <Col span={3}>
                  {metricsList.find((metric) => metric.id == m.metricId)?.code}
                </Col>
                <Col span={6}>
                  {
                    metricsList.find((metric) => metric.id == m.metricId)
                      ?.metricDescription
                  }
                </Col>
                <Col span={5}>
                  {
                    metricsList.find((metric) => metric.id == m.metricId)
                      ?.aggregationProperty
                  }
                </Col>
                <Col span={3}>
                  <Input
                    disabled={
                      watchPlanType == PlanType.ONE_TIME_ADD_ON || formDisabled
                    }
                    value={m.metricLimit}
                    onChange={updateMetrics(m.localId)}
                  />
                </Col>
                <Col span={2}>
                  <div
                    onClick={() => removeMetrics(m.localId)}
                    className={`w-16 font-bold ${watchPlanType == PlanType.ONE_TIME_ADD_ON || formDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <MinusOutlined />
                  </div>
                </Col>
              </Row>
            ))}
          </Form.Item>
          <Dropdown
            arrow={true}
            menu={{
              items: [
                {
                  label: 'Limit metered',
                  key: MetricType.LIMIT_METERED,
                  onClick: () => {
                    console.log('Limit metered')
                  }
                },
                {
                  label: 'Charge metered',
                  key: MetricType.CHARGE_METERED,
                  onClick: () => {
                    console.log('Charge metered')
                  }
                },
                {
                  label: 'Charge recurring',
                  key: MetricType.CHARGE_RECURRING,
                  onClick: () => {
                    console.log('Charge recurring')
                  }
                }
              ]
            }}
          >
            <Button icon={<PlusOutlined />} variant="outlined" color="default">
              <Space>
                Add billing model
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </div>
      )
    }
  ]

  return (
    <div className="pt-4">
      <div className="flex flex-col gap-6">
        <Collapse
          items={addonsItem}
          expandIconPosition="end"
          defaultActiveKey={['addons']}
        />
        <Collapse
          items={trialItem}
          expandIconPosition="end"
          defaultActiveKey={['trial']}
        />

        <Collapse
          items={billableItem}
          defaultActiveKey={['billable']}
          expandIconPosition="end"
        />

        <div className="mb-2">
          Custom data(JSON string){' '}
          <Tooltip title="Prettify">
            <Button
              size="small"
              onClick={prettifyJSON}
              icon={<FormatPainterOutlined />}
              style={{ border: 'none' }}
            />
          </Tooltip>
          <div className="h-2"></div>
          <Form.Item
            // noStyle={true}
            name="metadata"
            rules={[
              {
                required: false,
                message: 'Please input a valid object JSON string!'
              },
              () => ({
                validator(_, value) {
                  return isValidMap(value)
                    ? Promise.resolve()
                    : Promise.reject('Invalid JSON string')
                }
              })
            ]}
            extra={`JSON object must be a key-value paired object, like {"a": 1, "b": 2, "c": [1,2,3]}.`}
          >
            <Input.TextArea rows={6} />
          </Form.Item>
        </div>
      </div>
    </div>
  )
}

export default Index
