import { Button, InputNumber, Select, Typography } from 'antd'

import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Row } from 'antd'

import { IBillableMetrics, MetricLimits, MetricType } from '@/shared.types'
import { Col } from 'antd'
import { MetricData } from './types'

const Index = ({
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
  addLimitData: (type: keyof MetricData) => void
  removeLimitData: (type: keyof MetricData, localId: string) => void
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
            onClick={() => addLimitData('metricLimits')}
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
              onClick={() => removeLimitData('metricLimits', m.localId)}
            />
          </Col>
        </Row>
      ))}
    </div>
  )
}
export default Index
