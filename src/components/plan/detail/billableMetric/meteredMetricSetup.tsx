import GraduationIcon from '@/assets/graduation.svg?react'
import { METRIC_CHARGE_TYPE, METRICS_AGGREGATE_TYPE } from '@/constants'
import {
  CURRENCY,
  IBillableMetrics,
  MetricChargeType,
  MetricMeteredCharge
} from '@/shared.types'
import {
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons'
import {
  Badge,
  Button,
  Col,
  InputNumber,
  Popover,
  Row,
  Select,
  Typography
} from 'antd'
import { MouseEventHandler, PropsWithChildren } from 'react'
import GraduationSetup from './graduationSetup'
import { MetricData } from './types'

type ChargeSetupProps = {
  metricData: MetricMeteredCharge[]
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
  ) => (val: number | null | MouseEventHandler<HTMLElement>) => void
  formDisabled: boolean
}
const rowHeaderStyle = 'text-gray-400'
const colSpan = [6, 7, 4, 5, 2]

const Index = ({
  metricData,
  metricDataType,
  metricsList,
  isRecurring,
  getCurrency,
  addMetricData,
  removeMetricData,
  onMetricFieldChange,
  formDisabled
}: ChargeSetupProps) => {
  const metricSelected = (metricId: number) =>
    metricData.find((m) => m.metricId === metricId) != undefined

  const getMetricInfo = (metricId: number) => {
    const metric = metricsList.find((m) => m.id === metricId)
    if (metric == undefined) {
      return null
    }
    const content = [
      {
        label: 'Code',
        value: metric?.code
      },
      {
        label: 'Props',
        value: metric?.aggregationProperty
      },
      {
        label: 'AggreType',
        value: METRICS_AGGREGATE_TYPE[metric.aggregationType].label
      }
    ]
    return (
      <>
        {content.map((c) => (
          <Row key={c.label} gutter={[16, 16]}>
            <Col span={8} className="font-sm text-gray-500">
              {c.label}
            </Col>
            <Col span={16} className="font-sm text-gray-800">
              {c.value}
            </Col>
          </Row>
        ))}
      </>
    )
  }
  const header = [
    { label: 'Name' },
    { label: 'Pricing type' },
    { label: 'Price' },
    { label: 'Start value' },
    {
      label: (
        <Button
          icon={<PlusOutlined />}
          size="small"
          style={{ border: 'none' }}
          variant="outlined"
          onClick={() => addMetricData(metricDataType)}
        />
      )
    }
  ]
  return (
    <div className="my-4 rounded-md bg-gray-100 p-4">
      <Typography.Title level={5}>
        Charge Metered{isRecurring ? ' (recurring)' : ''}
        <Popover
          content={
            <div className="max-w-96">
              {`${isRecurring ? 'Calculated value is cumulative, NOT reset to 0 at each sub-period start.' : 'Calculated value is reset to 0 at each sub-period start.'}`}
            </div>
          }
        >
          <InfoCircleOutlined className="ml-2 text-gray-400" />
        </Popover>
      </Typography.Title>
      <Row>
        {header.map((h, i) => (
          <Col key={i} span={colSpan[i]} className={rowHeaderStyle}>
            {h.label}
          </Col>
        ))}
      </Row>
      {metricData.map((m: MetricMeteredCharge) => (
        <div key={m.localId}>
          <Row key={m.localId} className="my-2">
            <Col span={colSpan[0]}>
              <div>
                <Select
                  style={{ width: '80%' }}
                  value={m.metricId}
                  onChange={onMetricFieldChange(
                    metricDataType,
                    m.localId,
                    'metricId'
                  )}
                  options={metricsList.map((m) => ({
                    label: m.metricName,
                    value: m.id,
                    disabled: metricSelected(m.id)
                  }))}
                />
                &nbsp;&nbsp;
                {m.metricId && (
                  <Popover
                    content={getMetricInfo(m.metricId)}
                    overlayStyle={{ maxWidth: '360px', minWidth: '280px' }}
                  >
                    <InfoCircleOutlined />
                  </Popover>
                )}
              </div>
            </Col>
            <Col span={colSpan[1]}>
              <div className="flex items-center">
                <Select
                  style={{ width: '80%' }}
                  value={m.chargeType}
                  onChange={onMetricFieldChange(
                    metricDataType,
                    m.localId,
                    'chargeType'
                  )}
                  options={[
                    {
                      label:
                        METRIC_CHARGE_TYPE[MetricChargeType.STANDARD].label,
                      value: MetricChargeType.STANDARD
                    },
                    {
                      label:
                        METRIC_CHARGE_TYPE[MetricChargeType.GRADUATED].label,
                      value: MetricChargeType.GRADUATED
                    }
                  ]}
                />
                &nbsp;&nbsp;
                {m.chargeType == MetricChargeType.GRADUATED && (
                  <BadgedButton
                    showBadge={m.graduatedAmounts.length > 0}
                    count={m.graduatedAmounts.length}
                  >
                    <Button
                      onClick={(evt) =>
                        onMetricFieldChange(
                          metricDataType,
                          m.localId,
                          'expanded'
                        )(evt as unknown as MouseEventHandler<HTMLElement>)
                      }
                      disabled={false} // this button is to toggle the show/hide of graduated amounts, no need to be disabled after plan activated
                      size="small"
                      style={{ border: 'none' }}
                      icon={
                        <GraduationIcon
                          style={{ color: m.expanded ? 'blue' : 'gray' }}
                        />
                      }
                    />
                  </BadgedButton>
                )}
              </div>
            </Col>
            <Col span={colSpan[2]}>
              <InputNumber
                style={{ width: '80%' }}
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
            <Col span={colSpan[3]}>
              <InputNumber
                style={{ width: '80%' }}
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
              <Button
                icon={<MinusOutlined />}
                size="small"
                style={{ border: 'none' }}
                onClick={() => removeMetricData(metricDataType, m.localId)}
              />
            </Col>
          </Row>

          <div className={`flex w-full justify-end drop-shadow-lg`}>
            <div
              style={{
                width: '85%',
                marginRight: '8%',
                scrollbarGutter: 'stable both-edges'
              }}
              className={`relative overflow-hidden rounded-md bg-white transition-all duration-200 ${m.expanded && m.chargeType == MetricChargeType.GRADUATED ? 'max-h-96' : 'max-h-0'}`}
            >
              <GraduationSetup
                data={m.graduatedAmounts}
                metricDataType={metricDataType}
                metricLocalId={m.localId}
                getCurrency={getCurrency}
                formDisabled={formDisabled}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
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

export default Index
