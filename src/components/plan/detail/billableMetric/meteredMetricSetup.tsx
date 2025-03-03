import {
  METRIC_CHARGE_TYPE,
  METRICS_AGGREGATE_TYPE,
  METRICS_TYPE
} from '@/constants'
import {
  CURRENCY,
  IBillableMetrics,
  MetricChargeType,
  MetricMeteredCharge
} from '@/shared.types'
import {
  EyeOutlined,
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
  Tooltip,
  Typography
} from 'antd'
import { PropsWithChildren } from 'react'
import GraduationSetup from './graduationSetup'
import GraduationIcon from './icons/graduation.svg?react'
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
  toggleGraduationSetup: (type: keyof MetricData, localId: string) => void
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
  onChargeTypeSelectChange,
  onMetricIdSelectChange,
  setGraduationSetupModalOpen,
  toggleGraduationSetup
}: ChargeSetupProps) => {
  const metricSelected = (metricId: number) =>
    metricData.find((m) => m.metricId === metricId) != undefined

  const getMetricInfo = (metricId: number) => {
    const metric = metricsList.find((m) => m.id === metricId)!
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
        Charge metered{isRecurring ? ' (recurring)' : ''}
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
                  onChange={onMetricIdSelectChange(metricDataType, m.localId)}
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
                  onChange={onChargeTypeSelectChange(metricDataType, m.localId)}
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
                      onClick={
                        () => toggleGraduationSetup(metricDataType, m.localId)
                        /*
                      setGraduationSetupModalOpen({
                        metricType: metricDataType,
                        localId: m.localId
                      })
                      */
                      }
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
            <Col span={colSpan[3]}>
              <InputNumber
                style={{ width: '80%' }}
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
              <Button
                icon={<MinusOutlined />}
                size="small"
                style={{ border: 'none' }}
                onClick={() => removeMetricData(metricDataType, m.localId)}
              />
            </Col>
            {/* m.chargeType == MetricChargeType.GRADUATED && (
              <Col span={2}>
                <Button
                  icon={<EyeOutlined />}
                  size="small"
                  style={{ border: 'none' }}
                  onClick={() =>
                    toggleGraduationSetup(metricDataType, m.localId)
                  }
                />
              </Col>
            )*/}
          </Row>

          {/* m.expanded && m.chargeType == MetricChargeType.GRADUATED && (
            <Row>
              <Col span={20}></Col>
              <Col span={2}>
                <div
                  style={{
                    position: 'relative',
                    top: 0,
                    width: 0,
                    height: 0,
                    borderLeft: '12px solid transparent',
                    borderRight: '12px solid transparent',
                    borderBottom: '12px solid white'
                  }}
                ></div>
              </Col>{' '}
            </Row>
          )*/}
          {/* <Row> */}
          {/* <Col span={22}> */}
          <div className={`flex w-full justify-end drop-shadow-lg`}>
            <div
              style={{ width: '85%', marginRight: '15%' }}
              className={`relative overflow-hidden rounded-md bg-white transition-all duration-300 ${m.expanded && m.chargeType == MetricChargeType.GRADUATED ? 'max-h-96' : 'max-h-0'}`}
            >
              <GraduationSetup
                data={m.graduatedAmounts}
                onCancel={() => {}}
                onOK={() => {}}
                getCurrency={getCurrency}
              />
            </div>
          </div>
          {/* </Col> */}
          {/* </Row> */}
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
