import { randomString, showAmount } from '@/helpers'
import { CURRENCY, MetricGraduatedAmount } from '@/shared.types'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Col, InputNumber } from 'antd'

import { Row } from 'antd'

import { Button } from 'antd'

import { Modal } from 'antd'
import update from 'immutability-helper'
import { useContext, useEffect, useState } from 'react'
import { MetricDataContext } from '../metricDataContext'

const colSpan = [4, 4, 4, 4, 7, 1]
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

  // If array is initally empty, add 2 records.
  const addGraduationData = () => {
    if (graduationData.length == 0) {
      setGraduationData(
        update(graduationData, {
          $push: [
            {
              startValue: 0,
              endValue: 1,
              perAmount: null,
              flatAmount: null,
              localId: randomString(8)
            },
            {
              startValue: 2,
              endValue: -1,
              perAmount: null,
              flatAmount: null,
              localId: randomString(8)
            }
          ]
        })
      )
    } else {
      setGraduationData(
        update(graduationData, {
          $splice: [
            [
              graduationData.length - 1,
              0,
              {
                startValue: null,
                endValue: null,
                perAmount: null,
                flatAmount: null,
                localId: randomString(8)
              }
            ]
          ]
        })
      )
    }
  }

  const header = [
    { label: 'First unit' },
    { label: 'Last unit' },
    { label: 'Per unit' },
    { label: 'Flat fee' },
    { label: 'Costs' },
    {
      label: (
        <Button
          icon={<PlusOutlined />}
          size="small"
          onClick={addGraduationData}
          style={{ border: 'none' }}
        />
      )
    }
  ]

  // if the last one is removed, 2nd to last will become the new last(with infinity set)
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

  const calculateCost = (
    startValue: number | null,
    endValue: number | null,
    perAmount: number | null,
    flatAmount: number | null,
    returnNumber: boolean = false
  ) => {
    const currency = getCurrency()
    if (
      startValue == null ||
      endValue == null ||
      perAmount == null ||
      flatAmount == null
    )
      return returnNumber ? 0 : showAmount(0, currency.Currency, true)
    // for first record, its startValue is always 0, the range should not '-1'
    // for last record, its endValue is always infinity, the range should always be [1,1]
    let range = endValue - startValue + 1 //  + (startValue == 0 ? 0 : 1)
    if (startValue == 0) {
      range -= 1
    }
    if (endValue == -1) {
      range = 1
    }
    const label = `${range} x ${currency.Symbol}${perAmount} + ${currency.Symbol}${flatAmount}`
    return returnNumber
      ? range * perAmount + flatAmount
      : `${label} = ${showAmount(
          range * perAmount + flatAmount,
          currency.Currency,
          true
        )}`
  }
  const calculateTotalCost = () => {
    return graduationData.reduce((acc, curr) => {
      const cost = calculateCost(
        curr.startValue,
        curr.endValue,
        curr.perAmount,
        curr.flatAmount,
        true
      )
      return acc + (typeof cost === 'number' ? cost : 0)
    }, 0)
  }

  // don't update the last record's endvalue.
  const recalculaeStartEndValue = (autocalculate: boolean = false) => {
    if (graduationData.length == 0) return
    const val = graduationData.map((m) => ({
      startValue: m.startValue,
      endValue: m.endValue
    }))
    let currEnd =
      autocalculate && val[0].endValue == null
        ? val[0].startValue! + 1
        : val[0].endValue
    for (let i = 1; i < val.length; i++) {
      val[i].startValue = currEnd! + 1
      val[i].endValue = currEnd! + 2
      currEnd = val[i].endValue
    }
    const newGraduationData = graduationData.map((v, idx) => ({
      ...v,
      ...val[idx]
    }))
    setGraduationData(update(graduationData, { $set: newGraduationData }))
  }

  useEffect(() => {
    recalculaeStartEndValue(true)
  }, [graduationData.length])

  return (
    <div className="p-4">
      <Row className="flex items-center">
        {header.map((h, i) => (
          <Col key={i} span={colSpan[i]} className="text-sm text-gray-400">
            {h.label}
          </Col>
        ))}
      </Row>
      <div className="max-h-52 overflow-auto">
        {graduationData.map((m, idx) => (
          <Row key={m.localId} className="my-3">
            <Col span={colSpan[0]}>
              <InputNumber
                style={{ width: '80%' }}
                value={m.startValue}
                disabled
                onChange={onGraduationDataChange(m.localId, 'startValue')}
              />
            </Col>
            <Col span={colSpan[1]}>
              {idx == graduationData.length - 1 ? (
                <InputNumber
                  disabled={idx == graduationData.length - 1}
                  style={{ width: '80%' }}
                  value="∞"
                  // value={m.endValue}
                  // onChange={onGraduationDataChange(m.localId, 'endValue')}
                />
              ) : (
                <InputNumber
                  style={{ width: '80%' }}
                  value={m.endValue}
                  onChange={onGraduationDataChange(m.localId, 'endValue')}
                />
              )}
            </Col>
            <Col span={colSpan[2]}>
              <InputNumber
                style={{ width: '80%' }}
                value={m.perAmount}
                prefix={getCurrency()?.Symbol}
                min={0}
                onChange={onGraduationDataChange(m.localId, 'perAmount')}
              />
            </Col>
            <Col span={colSpan[3]}>
              <InputNumber
                style={{ width: '80%' }}
                prefix={getCurrency()?.Symbol}
                value={m.flatAmount}
                min={0}
                onChange={onGraduationDataChange(m.localId, 'flatAmount')}
              />
            </Col>
            <Col span={colSpan[4]} className="flex items-center text-gray-500">
              {calculateCost(
                m.startValue,
                m.endValue,
                m.perAmount,
                m.flatAmount
              )}
            </Col>
            <Col span={colSpan[5]}>
              <Button
                disabled={idx == 0}
                style={{ border: 'none' }}
                icon={<MinusOutlined />}
                size="small"
                onClick={() => removeGraduationData(m.localId)}
              />
            </Col>
          </Row>
        ))}
        <Row>
          <Col span={16}></Col>
          {graduationData.length > 0 && (
            <Col span={8} className="flex items-center font-bold text-gray-600">
              {`${graduationData[graduationData.length - 1].startValue} units would cost ${showAmount(
                calculateTotalCost(),
                getCurrency().Currency,
                true
              )}`}
            </Col>
          )}
        </Row>
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
