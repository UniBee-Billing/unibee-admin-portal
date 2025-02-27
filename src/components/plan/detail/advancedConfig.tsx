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
  MetricLimit,
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
  Form,
  FormInstance,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Tooltip
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
          />
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

type BillableMetricSetupProps = {
  metricsList: IBillableMetrics[] // all the billable metrics we have created, not used for edit, but used in <Select /> for user to choose.
  getCurrency: () => CURRENCY
}

const defaultMetricLimit = (): MetricLimit & { localId: string } => ({
  metricId: 0,
  metricLimit: 0,
  localId: randomString(8),
  graduatedAmounts: []
})
const defaultMetricMeteredCharge = (): MetricMeteredCharge & {
  localId: string
} => ({
  metricId: 0,
  chargeType: MetricChargeType.STANDARD,
  standardAmount: 0,
  standardStartValue: 0,
  graduatedAmounts: [],
  localId: randomString(8)
})
const defaultMetricRecurringCharge = (): MetricMeteredCharge & {
  localId: string
} => ({
  metricId: 0,
  chargeType: MetricChargeType.STANDARD,
  standardAmount: 0,
  standardStartValue: 0,
  graduatedAmounts: [],
  localId: randomString(8)
})
type MetricData = {
  metricLimits: (MetricLimit & { localId: string })[]
  metricMeteredCharges: (MetricMeteredCharge & { localId: string })[]
  metricRecurringCharges: (MetricMeteredCharge & { localId: string })[]
}
const BillableMetricSetup = ({
  metricsList,
  getCurrency
}: BillableMetricSetupProps) => {
  const [metricData, setMetricData] = useState<MetricData>({
    metricLimits: [],
    metricMeteredCharges: [],
    metricRecurringCharges: []
  })

  const [graduationSetupModalOpen, setGraduationSetupModalOpen] = useState<{
    metricType: keyof MetricData
    localId: string
  } | null>(null)

  const addMetricData = (type: keyof MetricData) => {
    switch (type) {
      case 'metricLimits':
        setMetricData(
          update(metricData, {
            [type]: { $push: [defaultMetricLimit()] }
          })
        )
        break
      case 'metricMeteredCharges':
        setMetricData(
          update(metricData, {
            [type]: { $push: [defaultMetricMeteredCharge()] }
          })
        )
        break
      case 'metricRecurringCharges':
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
    (type: keyof MetricData, localId: string) => (val: number) => {
      const idx = metricData[type].findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setMetricData(
          update(metricData, {
            [type]: { [idx]: { chargeType: { $set: val } } }
          })
        )
      }
    }

  return (
    <div>
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
      <div className="my-4 rounded-md bg-gray-100 p-4">
        <div>Limit metered(metricLimits)</div>
        <Row>
          <Col>Name</Col>
          <Col>Code</Col>
          <Col>Aggregation Type</Col>
          <Col>Aggregation Property</Col>
          <Col>Limit Value</Col>
        </Row>
        <Row>
          <Col>
            <Select
              style={{ width: 180 }}
              options={metricsList
                .filter((m) => m.type == MetricType.LIMIT_METERED)
                .map((m) => ({ label: m.metricName, value: m.id }))}
            />
          </Col>
        </Row>
      </div>
      {/*            ************************ */}
      {/*            ************************ */}
      {/*            ************************ */}
      {/*            ************************ */}
      {/*            ************************ */}

      <div className="my-4 rounded-md bg-gray-100 p-4">
        <div>Charge metered(metricMeteredCharge)</div>
        <Row>
          <Col>Name</Col>
          <Col>Code</Col>
          <Col>Aggregation Type</Col>
          <Col>Aggregation Property</Col>
          <Col>Limit Value</Col>
          <Col>
            {' '}
            <Button
              icon={<PlusOutlined />}
              variant="outlined"
              onClick={() => addMetricData('metricMeteredCharges')}
              color="default"
            />
          </Col>
        </Row>
        {metricData.metricMeteredCharges.map((m) => (
          <Row key={m.localId} className="my-4">
            <Col span={6}>
              <Select
                style={{ width: 160 }}
                options={metricsList
                  .filter((m) => m.type == MetricType.CHARGE_METERED)
                  .map((m) => ({ label: m.metricName, value: m.id }))}
              />
            </Col>
            <Col span={6}>
              <Select
                style={{ width: 160 }}
                value={m.chargeType}
                onChange={onChargeTypeSelectChange(
                  'metricMeteredCharges',
                  m.localId
                )}
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
            <Col span={4}>
              <InputNumber
                style={{ width: 120 }}
                placeholder="Price"
                prefix={getCurrency()?.Symbol}
                min={0}
                disabled={m.chargeType == MetricChargeType.GRADUATED}
              />
            </Col>
            <Col span={4}>
              <InputNumber
                style={{ width: 120 }}
                placeholder="Start value"
                min={0}
                disabled={m.chargeType == MetricChargeType.GRADUATED}
              />
            </Col>
            <Col span={2}>
              <BadgedButton
                showBadge={m.graduatedAmounts.length > 0}
                count={m.graduatedAmounts.length}
              >
                <Button
                  onClick={() =>
                    setGraduationSetupModalOpen({
                      metricType: 'metricMeteredCharges',
                      localId: m.localId
                    })
                  }
                  disabled={m.chargeType == MetricChargeType.STANDARD}
                  icon={<Graduation />}
                />
              </BadgedButton>
            </Col>
            <Col span={2}>
              <Button
                icon={<MinusOutlined />}
                style={{ border: 'none' }}
                onClick={() =>
                  removeMetricData('metricMeteredCharges', m.localId)
                }
              />
            </Col>
          </Row>
        ))}
      </div>

      {/*            ************************ */}
      {/*            ************************ */}
      {/*            ************************ */}
      {/*            ************************ */}
      {/*            ************************ */}

      <div className="my-4 rounded-md bg-gray-100 p-4">
        <div>Charge recurring(metricRecurringCharge)</div>
        <Row>
          <Col>Name</Col>
          <Col>Code</Col>
          <Col>Aggregation Type</Col>
          <Col>Aggregation Property</Col>
          <Col>Limit Value</Col>
        </Row>
        <Row>
          <Col>
            <Select
              style={{ width: 160 }}
              options={metricsList
                .filter((m) => m.type == MetricType.CHARGE_RECURRING)
                .map((m) => ({ label: m.metricName, value: m.id }))}
            />
          </Col>
          <Col>
            <Select
              style={{ width: 160 }}
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
        </Row>
      </div>
    </div>
  )
}
//   const onSaveGraduationData = (type: keyof MetricData, localId: string, graduationData: MetricGraduatedAmount[]) => {

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
                onClick={() => removeGraduationData(m.localId)}
              />
            </Col>
          </Row>
        ))}
      </div>
      <div className="flex justify-end">
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
}) => (showBadge ? <Badge count={count}>{children}</Badge> : children)
