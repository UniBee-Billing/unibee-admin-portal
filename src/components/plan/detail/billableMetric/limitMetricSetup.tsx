import { Button, InputNumber, Select, Typography } from 'antd'

import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Row } from 'antd'

import { METRICS_AGGREGATE_TYPE } from '@/constants'
import { IBillableMetrics, MetricLimits, MetricType } from '@/shared.types'
import { Col } from 'antd'
import { useContext } from 'react'
import { MetricDataContext } from '../metricDataContext'
import { MetricData } from './types'
const rowHeaderStyle = 'text-gray-400'
const colSpan = [5, 5, 4, 4, 4, 2]

const Index = ({
  metricData,
  metricsList,
  onMetricFieldChange,
  addLimitData,
  removeLimitData
}: {
  metricData: MetricLimits[]
  metricsList: IBillableMetrics[]
  onMetricFieldChange: (
    type: keyof MetricData,
    localId: string,
    field: keyof MetricLimits
  ) => (val: number | null) => void
  addLimitData: (type: keyof MetricData) => void
  removeLimitData: (type: keyof MetricData, localId: string) => void
}) => {
  const { metricError } = useContext(MetricDataContext)
  const header = [
    { label: 'Name' },
    { label: 'Code' },
    { label: 'Props' },
    { label: 'Aggregation type' },
    { label: 'Limit value' },
    {
      label: (
        <Button
          icon={<PlusOutlined />}
          size="small"
          style={{ border: 'none' }}
          variant="outlined"
          onClick={() => addLimitData('metricLimits')}
          color="default"
        />
      )
    }
  ]

  const getMetricInfo = (metricId: number | undefined) =>
    metricId != undefined
      ? metricsList.find((m) => m.id === metricId)!
      : undefined

  const metricSelected = (metricId: number) =>
    metricData.find((m) => m.metricId === metricId) != undefined

  return (
    <div className="my-4 rounded-md bg-gray-100 p-4">
      <Typography.Title level={5}>Limit Metered</Typography.Title>
      <Row>
        {header.map((h, i) => (
          <Col key={i} span={colSpan[i]} className={rowHeaderStyle}>
            {h.label}
          </Col>
        ))}
      </Row>

      {metricData.map((m) => (
        <Row key={m.localId} className="my-2">
          <Col span={colSpan[0]}>
            <Select
              status={
                metricError?.metricType == MetricType.LIMIT_METERED &&
                metricError.field == 'metricId' &&
                metricError.localId == m.localId
                  ? 'error'
                  : undefined
              }
              style={{ width: '80%' }}
              value={m.metricId}
              onChange={onMetricFieldChange(
                'metricLimits',
                m.localId,
                'metricId'
              )}
              options={metricsList
                .filter((m) => m.type == MetricType.LIMIT_METERED)
                .map((m) => ({
                  label: m.metricName,
                  value: m.id,
                  disabled: metricSelected(m.id)
                }))}
            />
          </Col>
          <Col span={colSpan[1]}>
            <span>
              {m.metricId != null && getMetricInfo(m.metricId!)?.code}
            </span>
          </Col>
          <Col span={colSpan[2]}>
            <span>
              {m.metricId != null &&
                getMetricInfo(m.metricId!)?.aggregationProperty}
            </span>
          </Col>
          <Col span={colSpan[3]}>
            <span>
              {m.metricId != null &&
                getMetricInfo(m.metricId)?.aggregationType != null &&
                METRICS_AGGREGATE_TYPE[
                  getMetricInfo(m.metricId)!.aggregationType
                ].label}
            </span>
          </Col>
          <Col span={colSpan[4]}>
            <InputNumber
              status={
                metricError?.metricType == MetricType.LIMIT_METERED &&
                metricError.field == 'metricLimit' &&
                metricError.localId == m.localId
                  ? 'error'
                  : undefined
              }
              style={{ width: '80%' }}
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
          <Col span={colSpan[5]}>
            <Button
              icon={<MinusOutlined />}
              size="small"
              style={{ border: 'none' }}
              onClick={() => removeLimitData('metricLimits', m.localId)}
            />
          </Col>
        </Row>
      ))}
    </div>
  )
}
export default Index
