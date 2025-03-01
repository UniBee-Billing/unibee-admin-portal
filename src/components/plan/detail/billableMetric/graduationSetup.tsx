import { randomString } from '@/helpers'
import { CURRENCY, MetricGraduatedAmount } from '@/shared.types'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Col, InputNumber } from 'antd'

import { Row } from 'antd'

import { Button } from 'antd'

import { Modal } from 'antd'
import update from 'immutability-helper'
import { useState } from 'react'

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
      {' '}
      <Row>
        <Col span={6}>Per unit</Col>
        <Col span={6}>Start Value</Col>
        <Col span={5}>End Value</Col>
        <Col span={5}>Flat fee</Col>
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
      <div className="flex justify-end gap-3">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onOK(graduationData)}>OK</Button>
      </div>
    </Modal>
  )
} //     <Modal title="Graduation setup" width={720} open={true} footer={false}>
{
  /* <div className="flex justify-end gap-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onOK(graduationData)}>OK</Button>
        </div> */
}

export default Index
