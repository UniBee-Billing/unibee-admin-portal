import { currencyDecimalValidate, isValidMap, showAmount } from '@/helpers'
import { CURRENCY, IBillableMetrics, IPlan, PlanType } from '@/shared.types'
import { FormatPainterOutlined } from '@ant-design/icons'
import {
  Button,
  Collapse,
  CollapseProps,
  Form,
  FormInstance,
  Input,
  InputNumber,
  message,
  Select,
  Switch,
  Tooltip
} from 'antd'
import BillableMetricSetup from './billableMetric'
import { TIME_UNITS } from './types'

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
  const onTrialLengthUnitChange = (val: number) => setTrialLengthUnit(val)
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
                    if (isNaN(num) || num < 0 || num >= planPrice) {
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
            <div className="absolute mb-6 ml-60 text-xs text-gray-400">
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
