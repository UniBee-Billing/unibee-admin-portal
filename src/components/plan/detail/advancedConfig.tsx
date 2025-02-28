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
  MetricChargeType,
  MetricGraduatedAmount,
  MetricLimits,
  MetricMeteredCharge,
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
  Badge,
  Button,
  Col,
  Collapse,
  CollapseProps,
  Dropdown,
  Empty,
  Form,
  FormInstance,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Tooltip,
  Typography
} from 'antd'
import update from 'immutability-helper'

import { METRIC_CHARGE_TYPE } from '@/constants'
import { Switch } from 'antd'
import { PropsWithChildren, useState } from 'react'
import { TIME_UNITS } from '.'
import Graduation from './icons/graduation.svg?react'
type TMetricsItem = {
  localId: string
  metricId?: number
  metricLimit?: number | string
}

interface Props {
  enableTrialWatch: boolean
  formDisabled: boolean
  getCurrency: () => CURRENCY
  form: FormInstance
  watchPlanType: PlanType
  metricsList: IBillableMetrics[]
  selectAddons: IPlan[]
  selectOnetime: IPlan[]
  trialLengthUnit: number | undefined
  setTrialLengthUnit: (val: number) => void
}

const Index = ({
  enableTrialWatch,
  formDisabled,
  getCurrency,
  form,
  watchPlanType,
  metricsList,
  selectAddons,
  selectOnetime,
  trialLengthUnit,
  setTrialLengthUnit
}: Props) => {
  // const [metricsList, setMetricsList] = useState<IBillableMetrics[]>([]) // all the billable metrics, not used for edit, but used in <Select /> for user to choose.
  const [selectedMetrics, setSelectedMetrics] = useState<TMetricsItem[]>([
    // metrics are hard to let form handle change, I have to manually handle it
    { localId: randomString(8) }
  ])

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
              dependencies={['amount', 'currency', 'enableTrial']}
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
            dependencies={['enableTrial']}
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
          <BillableMetricSetup
            metricsList={metricsList}
            getCurrency={getCurrency}
            form={form}
          />
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

type BillableMetricSetupProps = {
  metricsList: IBillableMetrics[] // all the billable metrics we have created, not used for edit, but used in <Select /> for user to choose.
  getCurrency: () => CURRENCY
  form: FormInstance
}

const defaultMetricLimit = (): MetricLimits & { localId: string } => ({
  metricId: null,
  metricLimit: 0,
  localId: randomString(8)
  // graduatedAmounts: []
})
const defaultMetricMeteredCharge = (): MetricMeteredCharge & {
  localId: string
} => ({
  metricId: null,
  chargeType: MetricChargeType.STANDARD,
  standardAmount: 0,
  standardStartValue: 0,
  graduatedAmounts: [],
  localId: randomString(8)
})
const defaultMetricRecurringCharge = (): MetricMeteredCharge & {
  localId: string
} => ({
  metricId: null,
  chargeType: MetricChargeType.STANDARD,
  standardAmount: 0,
  standardStartValue: 0,
  graduatedAmounts: [],
  localId: randomString(8)
})
type MetricData = {
  metricLimits: (MetricLimits & { localId: string })[]
  metricMeteredCharge: (MetricMeteredCharge & { localId: string })[]
  metricRecurringCharge: (MetricMeteredCharge & { localId: string })[]
}
const BillableMetricSetup = ({
  metricsList,
  getCurrency,
  form
}: BillableMetricSetupProps) => {
  const [metricData, setMetricData] = useState<MetricData>({
    metricLimits: [],
    metricMeteredCharge: [],
    metricRecurringCharge: []
  })

  const [graduationSetupModalOpen, setGraduationSetupModalOpen] = useState<{
    metricType: keyof MetricData
    localId: string
  } | null>(null)

  const addLimitData = () => {
    setMetricData(
      update(metricData, { metricLimits: { $push: [defaultMetricLimit()] } })
    )
  }

  const removeLimitData = (localId: string) => {
    const idx = metricData.metricLimits.findIndex((m) => m.localId == localId)
    if (idx != -1) {
      setMetricData(
        update(metricData, { metricLimits: { $splice: [[idx, 1]] } })
      )
    }
  }

  const addMetricData = (type: keyof MetricData) => {
    switch (type) {
      case 'metricLimits':
        setMetricData(
          update(metricData, {
            [type]: { $push: [defaultMetricLimit()] }
          })
        )
        break
      case 'metricMeteredCharge':
        setMetricData(
          update(metricData, {
            [type]: { $push: [defaultMetricMeteredCharge()] }
          })
        )
        break
      case 'metricRecurringCharge':
        setMetricData(
          update(metricData, {
            [type]: { $push: [defaultMetricRecurringCharge()] }
          })
        )
        break
    }
  }

  const removeMetricData = (type: keyof MetricData, localId: string) => {
    const idx = metricData[type].findIndex((m) => m.localId == localId)
    if (idx != -1) {
      setMetricData(update(metricData, { [type]: { $splice: [[idx, 1]] } }))
    }
  }

  const onMetricFieldChange =
    (
      type: keyof MetricData,
      localId: string,
      field: keyof MetricLimits | keyof MetricMeteredCharge
    ) =>
    (val: number | null) => {
      const idx = metricData[type].findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setMetricData(
          update(metricData, { [type]: { [idx]: { [field]: { $set: val } } } })
        )
      }
    }

  const onSaveGraduationData =
    (type: keyof MetricData, localId: string) =>
    (graduationData: MetricGraduatedAmount[]) => {
      const idx = metricData[type].findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setMetricData(
          update(metricData, {
            [type]: { [idx]: { graduatedAmounts: { $set: graduationData } } }
          })
        )
      }
      setGraduationSetupModalOpen(null)
    }

  const onChargeTypeSelectChange =
    (type: keyof MetricData, localId: string) => (val: number | null) => {
      const idx = metricData[type].findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setMetricData(
          update(metricData, {
            [type]: { [idx]: { chargeType: { $set: val } } }
          })
        )
      }
    }

  const onMetricIdSelectChange =
    (type: keyof MetricData, localId: string) => (val: number | null) => {
      const idx = metricData[type].findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setMetricData(
          update(metricData, {
            [type]: { [idx]: { metricId: { $set: val } } }
          })
        )
      }
    }

  return (
    <div>
      <Form.Item label="Billable metrics" name="metricLimits" hidden={true}>
        <Input.TextArea rows={6} />
      </Form.Item>
      <Form.Item
        label="Billable metrics"
        name="metricMeteredCharge"
        hidden={true}
      >
        <Input.TextArea rows={6} />
      </Form.Item>
      <Form.Item
        label="Billable metrics"
        name="metricRecurringCharge"
        hidden={true}
      >
        <Input.TextArea rows={6} />
      </Form.Item>
      {metricData.metricLimits.length == 0 &&
        metricData.metricMeteredCharge.length == 0 &&
        metricData.metricRecurringCharge.length == 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No billable metrics"
          />
        )}
      {graduationSetupModalOpen != null && (
        <GraduationSetupModal
          data={
            metricData[graduationSetupModalOpen.metricType].find(
              (m) => m.localId == graduationSetupModalOpen.localId
            )?.graduatedAmounts
          }
          onCancel={() => setGraduationSetupModalOpen(null)}
          onOK={onSaveGraduationData(
            graduationSetupModalOpen.metricType,
            graduationSetupModalOpen.localId
          )}
          getCurrency={getCurrency}
        />
      )}
      {metricData.metricLimits.length > 0 && (
        <LimitSetup
          metricData={metricData.metricLimits}
          metricsList={metricsList.filter(
            (m) => m.type == MetricType.LIMIT_METERED
          )}
          onMetricFieldChange={onMetricFieldChange}
          onMetricIdSelectChange={onMetricIdSelectChange}
          // getCurrency={getCurrency}
          addLimitData={addLimitData}
          removeLimitData={removeLimitData}
        />
      )}
      {metricData.metricMeteredCharge.length > 0 && (
        <ChargeSetup
          metricData={metricData.metricMeteredCharge}
          isRecurring={false}
          metricDataType="metricMeteredCharge"
          metricsList={metricsList.filter(
            (m) => m.type == MetricType.CHARGE_METERED
          )}
          getCurrency={getCurrency}
          addMetricData={addMetricData}
          removeMetricData={removeMetricData}
          onMetricFieldChange={onMetricFieldChange}
          onChargeTypeSelectChange={onChargeTypeSelectChange}
          onMetricIdSelectChange={onMetricIdSelectChange}
          setGraduationSetupModalOpen={setGraduationSetupModalOpen}
        />
      )}
      {metricData.metricRecurringCharge.length > 0 && (
        <ChargeSetup
          metricData={metricData.metricRecurringCharge}
          isRecurring={true}
          metricDataType="metricRecurringCharge"
          metricsList={metricsList.filter(
            (m) => m.type == MetricType.CHARGE_RECURRING
          )}
          getCurrency={getCurrency}
          addMetricData={addMetricData}
          removeMetricData={removeMetricData}
          onMetricFieldChange={onMetricFieldChange}
          onChargeTypeSelectChange={onChargeTypeSelectChange}
          onMetricIdSelectChange={onMetricIdSelectChange}
          setGraduationSetupModalOpen={setGraduationSetupModalOpen}
        />
      )}
      <Dropdown
        arrow={true}
        menu={{
          items: [
            {
              label: 'Limit metered',
              disabled: metricData.metricLimits.length > 0,
              key: MetricType.LIMIT_METERED,
              onClick: () => {
                addMetricData('metricLimits')
              }
            },
            {
              label: 'Charge metered',
              disabled: metricData.metricMeteredCharge.length > 0,
              key: MetricType.CHARGE_METERED,
              onClick: () => {
                addMetricData('metricMeteredCharge')
              }
            },
            {
              label: 'Charge recurring',
              disabled: metricData.metricRecurringCharge.length > 0,
              key: MetricType.CHARGE_RECURRING,
              onClick: () => {
                addMetricData('metricRecurringCharge')
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
      &nbsp;&nbsp;&nbsp;&nbsp;
      <Button
        onClick={() => {
          form.setFieldsValue(metricData)
        }}
      >
        Save data
      </Button>
    </div>
  )
}

const LimitSetup = ({
  metricData,
  metricsList,
  onMetricFieldChange,
  onMetricIdSelectChange,
  //getCurrency,
  addLimitData,
  removeLimitData
}: {
  metricData: (MetricLimits & { localId: string })[]
  metricsList: IBillableMetrics[]
  onMetricFieldChange: (
    type: keyof MetricData,
    localId: string,
    field: keyof MetricLimits
  ) => (val: number | null) => void
  onMetricIdSelectChange: (
    type: keyof MetricData,
    localId: string
  ) => (val: number | null) => void
  // getCurrency: () => CURRENCY
  addLimitData: () => void
  removeLimitData: (localId: string) => void
}) => {
  // const getMetricData
  return (
    <div className="my-4 rounded-md bg-gray-100 p-4">
      <Typography.Title level={5}>Limit metered</Typography.Title>
      <Row className="mb-2">
        <Col span={6}>Name</Col>
        <Col span={6}>Code</Col>
        {/* <Col>Aggregation Type</Col>
        <Col>Aggregation Property</Col> */}
        <Col span={10}>Limit Value</Col>
        <Col span={2}>
          {' '}
          <Button
            icon={<PlusOutlined />}
            size="small"
            style={{ border: 'none' }}
            variant="outlined"
            onClick={addLimitData}
            color="default"
          />
        </Col>
      </Row>
      {metricData.map((m) => (
        <Row key={m.localId} className="my-2">
          <Col span={6}>
            <Select
              style={{ width: 180 }}
              value={m.metricId}
              onChange={onMetricIdSelectChange('metricLimits', m.localId)}
              options={metricsList
                .filter((m) => m.type == MetricType.LIMIT_METERED)
                .map((m) => ({ label: m.metricName, value: m.id }))}
            />
          </Col>
          <Col span={6}></Col>
          <Col span={10}>
            <InputNumber
              style={{ width: 120 }}
              placeholder="Limit value"
              min={0}
              value={m.metricLimit}
              onChange={onMetricFieldChange(
                'metricLimits',
                m.localId,
                'metricLimit'
              )}
            />
          </Col>
          <Col span={2}>
            <Button
              icon={<MinusOutlined />}
              size="small"
              style={{ border: 'none' }}
              onClick={() => removeLimitData(m.localId)}
            />
          </Col>
        </Row>
      ))}
    </div>
  )
}

type ChargeSetupProps = {
  metricData: (MetricMeteredCharge & { localId: string })[]
  metricDataType: keyof MetricData
  metricsList: IBillableMetrics[]
  isRecurring: boolean
  getCurrency: () => CURRENCY
  addMetricData: (type: keyof MetricData) => void
  removeMetricData: (type: keyof MetricData, localId: string) => void
  onMetricFieldChange: (
    type: keyof MetricData,
    localId: string,
    field: keyof MetricMeteredCharge
  ) => (val: number | null) => void
  onChargeTypeSelectChange: (
    type: keyof MetricData,
    localId: string
  ) => (val: number | null) => void
  onMetricIdSelectChange: (
    type: keyof MetricData,
    localId: string
  ) => (val: number | null) => void
  setGraduationSetupModalOpen: (
    modalOpen: { metricType: keyof MetricData; localId: string } | null
  ) => void
}
const rowHeaderStyle = 'text-gray-400'
const ChargeSetup = ({
  metricData,
  metricDataType,
  metricsList,
  isRecurring,
  getCurrency,
  addMetricData,
  removeMetricData,
  onMetricFieldChange,
  onChargeTypeSelectChange,
  onMetricIdSelectChange,
  setGraduationSetupModalOpen
}: ChargeSetupProps) => {
  return (
    <div className="my-4 rounded-md bg-gray-100 p-4">
      <Typography.Title level={5}>
        Charge metered{isRecurring ? ' (recurring)' : ''}
      </Typography.Title>
      <Row>
        <Col span={5} className={rowHeaderStyle}>
          Name
        </Col>
        <Col span={5} className={rowHeaderStyle}>
          {' '}
        </Col>
        {/* <Col>Aggregation Type</Col>
        <Col>Aggregation Property</Col> */}
        <Col span={6} className={rowHeaderStyle}>
          Price
        </Col>
        <Col span={6} className={rowHeaderStyle}>
          Start value
        </Col>
        <Col span={2}>
          {' '}
          <Button
            icon={<PlusOutlined />}
            size="small"
            style={{ border: 'none' }}
            variant="outlined"
            onClick={() => addMetricData(metricDataType)}
            color="default"
          />
        </Col>
      </Row>
      {metricData.map((m: MetricMeteredCharge & { localId: string }) => (
        <Row key={m.localId} className="my-2">
          <Col span={5}>
            <Select
              style={{ width: 160 }}
              value={m.metricId}
              onChange={onMetricIdSelectChange(metricDataType, m.localId)}
              options={metricsList.map((m) => ({
                label: m.metricName,
                value: m.id
              }))}
            />
          </Col>
          <Col span={5}>
            <Select
              style={{ width: 160 }}
              value={m.chargeType}
              onChange={onChargeTypeSelectChange(metricDataType, m.localId)}
              options={[
                {
                  label: METRIC_CHARGE_TYPE[MetricChargeType.STANDARD].label,
                  value: MetricChargeType.STANDARD
                },
                {
                  label: METRIC_CHARGE_TYPE[MetricChargeType.GRADUATED].label,
                  value: MetricChargeType.GRADUATED
                }
              ]}
            />
          </Col>
          <Col span={6}>
            <InputNumber
              style={{ width: 120 }}
              placeholder="Price"
              prefix={getCurrency()?.Symbol}
              min={0}
              value={m.standardAmount}
              onChange={onMetricFieldChange(
                metricDataType,
                m.localId,
                'standardAmount'
              )}
              disabled={m.chargeType == MetricChargeType.GRADUATED}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              style={{ width: 120 }}
              placeholder="Start value"
              min={0}
              value={m.standardStartValue}
              onChange={onMetricFieldChange(
                metricDataType,
                m.localId,
                'standardStartValue'
              )}
              disabled={m.chargeType == MetricChargeType.GRADUATED}
            />
          </Col>
          <Col span={2}>
            <BadgedButton
              showBadge={m.graduatedAmounts.length > 0}
              count={m.graduatedAmounts.length}
            >
              <Tooltip title="Graduation setup">
                <Button
                  onClick={() =>
                    setGraduationSetupModalOpen({
                      metricType: metricDataType,
                      localId: m.localId
                    })
                  }
                  size="small"
                  style={{ border: 'none' }}
                  disabled={m.chargeType == MetricChargeType.STANDARD}
                  icon={<Graduation />}
                />
              </Tooltip>
            </BadgedButton>
          </Col>
          <Col span={2}>
            <Button
              icon={<MinusOutlined />}
              size="small"
              style={{ border: 'none' }}
              onClick={() => removeMetricData(metricDataType, m.localId)}
            />
          </Col>
        </Row>
      ))}
    </div>
  )
}

const GraduationSetupModal = ({
  data,
  onCancel,
  onOK,
  getCurrency
}: {
  data: MetricGraduatedAmount[] | undefined
  onCancel: () => void
  onOK: (graduationData: MetricGraduatedAmount[]) => void
  getCurrency: () => CURRENCY
}) => {
  const [graduationData, setGraduationData] = useState<
    (MetricGraduatedAmount & { localId: string })[]
  >(
    data == undefined
      ? []
      : data.map((d) => ({ ...d, localId: randomString(8) }))
  )

  const addGraduationData = () => {
    setGraduationData(
      update(graduationData, {
        $push: [
          {
            perAmount: null,
            startValue: null,
            endValue: null,
            flatAmount: null,
            localId: randomString(8)
          }
        ]
      })
    )
  }

  const removeGraduationData = (localId: string) => {
    const idx = graduationData.findIndex((m) => m.localId == localId)
    if (idx != -1) {
      setGraduationData(update(graduationData, { $splice: [[idx, 1]] }))
    }
  }

  const onGraduationDataChange =
    (localId: string, field: keyof MetricGraduatedAmount) =>
    (val: number | null) => {
      const idx = graduationData.findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setGraduationData(
          update(graduationData, { [idx]: { [field]: { $set: val } } })
        )
      }
    }

  return (
    <Modal title="Graduation setup" width={720} open={true} footer={false}>
      <div>
        <Row>
          <Col span={6}>Amount</Col>
          <Col span={6}>Start Value</Col>
          <Col span={5}>End Value</Col>
          <Col span={5}>Flat amount</Col>
          <Col span={2}>
            <Button
              icon={<PlusOutlined />}
              onClick={addGraduationData}
              style={{ border: 'none' }}
            />
          </Col>
        </Row>
        {graduationData.map((m) => (
          <Row key={m.localId} className="my-4">
            <Col span={6}>
              <InputNumber
                style={{ width: 120 }}
                placeholder="Amount"
                value={m.perAmount}
                prefix={getCurrency()?.Symbol}
                onChange={onGraduationDataChange(m.localId, 'perAmount')}
              />
            </Col>
            <Col span={6}>
              <InputNumber
                style={{ width: 120 }}
                placeholder="Start value"
                value={m.startValue}
                onChange={onGraduationDataChange(m.localId, 'startValue')}
              />
            </Col>
            <Col span={5}>
              <InputNumber
                style={{ width: 120 }}
                placeholder="End value"
                value={m.endValue}
                onChange={onGraduationDataChange(m.localId, 'endValue')}
              />
            </Col>
            <Col span={5}>
              <InputNumber
                style={{ width: 120 }}
                placeholder="Flat amount"
                prefix={getCurrency()?.Symbol}
                value={m.flatAmount}
                onChange={onGraduationDataChange(m.localId, 'flatAmount')}
              />
            </Col>
            <Col span={2}>
              <Button
                style={{ border: 'none' }}
                icon={<MinusOutlined />}
                size="small"
                onClick={() => removeGraduationData(m.localId)}
              />
            </Col>
          </Row>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onOK(graduationData)}>OK</Button>
      </div>
    </Modal>
  )
}

interface BadgedButtonProps extends PropsWithChildren<object> {
  showBadge: boolean
  count: number
}

const BadgedButton: React.FC<BadgedButtonProps> = ({
  showBadge,
  count,
  children
}) =>
  showBadge ? (
    <Badge count={count} color="gray">
      {children}
    </Badge>
  ) : (
    children
  )
