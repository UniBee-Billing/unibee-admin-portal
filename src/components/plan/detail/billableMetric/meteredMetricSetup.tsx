import { METRIC_CHARGE_TYPE } from '@/constants'
import {
  CURRENCY,
  IBillableMetrics,
  MetricChargeType,
  MetricMeteredCharge
} from '@/shared.types'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Badge,
  Button,
  Col,
  InputNumber,
  Row,
  Select,
  Tooltip,
  Typography
} from 'antd'
import { PropsWithChildren } from 'react'
import GraduationIcon from './icons/graduation.svg?react'
import { MetricData } from './types'

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
        <div key={m.localId}>
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
                    icon={<GraduationIcon />}
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
          {/* <Row>
              <Col span={21}>
                <div className="min-h-10 w-full rounded-md bg-white p-2">
                  graduation setup
                </div>
              </Col>
            </Row> */}
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
