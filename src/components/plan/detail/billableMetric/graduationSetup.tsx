import { randomString } from '@/helpers'
import { CURRENCY, MetricGraduatedAmount } from '@/shared.types'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Col, InputNumber } from 'antd'

import { Row } from 'antd'

import { Button } from 'antd'

import { Modal } from 'antd'
import update from 'immutability-helper'
import { useContext, useState } from 'react'
import { MetricDataContext } from '../metricDataContext'

const colSpan = [6, 6, 5, 5, 2]
const Index = ({
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
  const { metricData, setMetricData } = useContext(MetricDataContext)
  // console.log('metricData from context: ', metricData)
  const [graduationData, setGraduationData] = useState<MetricGraduatedAmount[]>(
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
    <div className="p-4">
      {' '}
      <Row className="flex items-center">
        <Col span={colSpan[0]} className="text-sm text-gray-400">
          Per unit
        </Col>
        <Col span={colSpan[1]} className="text-sm text-gray-400">
          Start Value
        </Col>
        <Col span={colSpan[2]} className="text-sm text-gray-400">
          End Value
        </Col>
        <Col span={colSpan[3]} className="text-sm text-gray-400">
          Flat fee
        </Col>
        <Col span={colSpan[4]}>
          <Button
            icon={<PlusOutlined />}
            size="small"
            onClick={addGraduationData}
            style={{ border: 'none' }}
          />
        </Col>
      </Row>
      <div className="max-h-52 overflow-auto">
        {graduationData.map((m) => (
          <Row key={m.localId} className="my-3">
            <Col span={colSpan[0]}>
              <InputNumber
                style={{ width: '80%' }}
                placeholder="Amount"
                value={m.perAmount}
                prefix={getCurrency()?.Symbol}
                onChange={onGraduationDataChange(m.localId, 'perAmount')}
              />
            </Col>
            <Col span={colSpan[1]}>
              <InputNumber
                style={{ width: '80%' }}
                placeholder="Start value"
                value={m.startValue}
                onChange={onGraduationDataChange(m.localId, 'startValue')}
              />
            </Col>
            <Col span={colSpan[2]}>
              <InputNumber
                style={{ width: '80%' }}
                placeholder="End value"
                value={m.endValue}
                onChange={onGraduationDataChange(m.localId, 'endValue')}
              />
            </Col>
            <Col span={colSpan[3]}>
              <InputNumber
                style={{ width: '80%' }}
                placeholder="Flat fee"
                prefix={getCurrency()?.Symbol}
                value={m.flatAmount}
                onChange={onGraduationDataChange(m.localId, 'flatAmount')}
              />
            </Col>
            <Col span={colSpan[4]}>
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
      {/* <div className="flex justify-end gap-3">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onOK(graduationData)}>OK</Button>
      </div> */}
    </div>
  )
} //     <Modal title="Graduation setup" width={720} open={true} footer={false}>
{
  /* <div className="flex justify-end gap-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onOK(graduationData)}>OK</Button>
        </div> */
}

export default Index
