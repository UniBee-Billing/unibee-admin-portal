import {
  currencyDecimalValidate,
  randomString,
  roundTo2Decimals,
  showAmount
} from '@/helpers'
import { CURRENCY, MetricGraduatedAmount } from '@/shared.types'
import { MinusOutlined, PlusOutlined, /* ReloadOutlined */ } from '@ant-design/icons'
import { Button, Col, InputNumber, Row, /* Tooltip */ } from 'antd'

import update from 'immutability-helper'
import { useContext, useEffect, useState } from 'react'
import { MetricDataContext } from '../metricDataContext'
import { MetricData } from './types'

const colSpan = [4, 4, 4, 4, 7, 1]
const Index = ({
  data,
  metricDataType,
  metricLocalId,
  getCurrency,
  formDisabled
}: {
  metricDataType: keyof MetricData
  metricLocalId: string
  data: MetricGraduatedAmount[] | undefined
  getCurrency: () => CURRENCY
  formDisabled: boolean
}) => {
  const { metricData, setMetricData, /* resetMetricData */ } =
    useContext(MetricDataContext)
  const dataIdx = metricData[metricDataType].findIndex(
    (m) => m.localId == metricLocalId
  )

  const [graduationData, setGraduationData] = useState<MetricGraduatedAmount[]>(
    data == undefined
      ? []
      : data.map((d) => ({ ...d, localId: randomString(8) }))
  )

  useEffect(() => {
    if (dataIdx != -1) {
      setMetricData(
        update(metricData, {
          [metricDataType]: {
            [dataIdx]: { graduatedAmounts: { $set: graduationData } }
          }
        })
      )
    }
  }, [graduationData])

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
      const maxStartValue = graduationData[graduationData.length - 1].startValue // startValue is auto calculated, it's never null.
      const len = graduationData.length
      let newGraduationData = update(graduationData, {
        [len - 1]: { endValue: { $set: maxStartValue! + 1 } }
      })
      newGraduationData = update(newGraduationData, {
        $push: [
          {
            startValue: maxStartValue! + 2,
            endValue: -1,
            perAmount: null,
            flatAmount: null,
            localId: randomString(8)
          }
        ]
      })
      setGraduationData(newGraduationData)
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

  /*
     firstUnit  lastUnit                                  firstUnit  lastUnit
    ===================                                   ===================
     0          1                                          0         1
     2          3         <= after deleting 2nd line,  =>  2         5
     4          5                                          6         7
     6          7                                          8         ∞
     8          ∞
    ====================
    the goal is to keep the lastUnit of each line consecutive with the firstUnit of the next line without gap.
  */
  const removeGraduationData = (localId: string) => {
    const idx = graduationData.findIndex((m) => m.localId == localId)
    if (idx == -1) {
      return
    }
    const lastValData = update(graduationData, { $splice: [[idx, 1]] })
    let firstValData = lastValData
    if (idx != graduationData.length - 1) {
      firstValData = update(graduationData, { $splice: [[idx + 1, 1]] })
    }
    const newGraduationData = lastValData.map((m, i) => ({
      ...m,
      startValue: firstValData[i].startValue
    }))
    newGraduationData[newGraduationData.length - 1].endValue = -1
    setGraduationData(update(graduationData, { $set: newGraduationData }))
  }

  const onGraduationDataChange =
    (localId: string, field: keyof MetricGraduatedAmount) =>
    (val: number | null) => {
      const idx = graduationData.findIndex((m) => m.localId == localId)
      if (idx == -1) {
        return
      }

      if (field == 'perAmount' || field == 'flatAmount') {
        if (
          val != null &&
          !currencyDecimalValidate(val, getCurrency().Currency)
        ) {
          return
        }

        setGraduationData(
          update(graduationData, {
            [idx]: { [field]: { $set: val } }
          })
        )
        return
      }

      const cascadeUpdate =
        field == 'endValue' &&
        typeof val == 'number' && // when input field is clared, its value is null(typeof is object).
        Number.isInteger(val) &&
        val > graduationData[idx].startValue!

      if (!cascadeUpdate) {
        return
      }

      const newGraduationData = [...graduationData]
      // If we are editing the 8th line, startValue of 8th line should be unchanged, endValue should be changed to val(passed from parameter)
      // from 9th line onwards, startValue should be val + 1, endValue should be val + 2, then val++ = 2
      newGraduationData[idx] = {
        ...newGraduationData[idx],
        endValue: val
      }

      let newVal = val + 2
      for (let i = idx + 1; i < graduationData.length; i++) {
        newGraduationData[i] = {
          ...newGraduationData[i],
          startValue: newVal - 1,
          endValue: i == graduationData.length - 1 ? -1 : newVal
        }
        newVal += 2
      }
      setGraduationData(newGraduationData)
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
    const label = `${range} x ${currency?.Symbol}${perAmount} + ${currency?.Symbol}${flatAmount}`
    return returnNumber
      ? range * perAmount + flatAmount
      : `${label} = ${showAmount(
          range * perAmount + flatAmount,
          currency?.Currency,
          true
        )}`
  }
  const calculateTotalCost = () => {
    const result = graduationData.reduce((acc, curr) => {
      const cost = calculateCost(
        curr.startValue,
        curr.endValue,
        curr.perAmount,
        curr.flatAmount,
        true
      )
      return acc + (typeof cost === 'number' ? cost : 0)
    }, 0)
    return roundTo2Decimals(result)
  }

  return (
    <div className="p-4">
      <Row className="flex items-center pr-1">
        {header.map((h, i) => (
          <Col key={i} span={colSpan[i]} className="text-sm text-gray-400">
            {h.label}
          </Col>
        ))}
      </Row>
      <div className="my-2 max-h-52 overflow-y-auto overflow-x-hidden">
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
                disabled={idx == 0 || formDisabled}
                style={{ border: 'none' }}
                icon={<MinusOutlined />}
                size="small"
                onClick={() => removeGraduationData(m.localId)}
              />
            </Col>
          </Row>
        ))}
      </div>
      <Row>
        <Col span={16}></Col>
        {graduationData.length > 0 && (
          <Col span={7} className="flex items-center font-bold text-gray-600">
            {`${graduationData[graduationData.length - 1].startValue} units would cost ${showAmount(
              calculateTotalCost(),
              getCurrency()?.Currency,
              true
            )}`}
          </Col>
        )}
        {/* <Col span={1}>
          <Tooltip title="Reset">
            <Button
              disabled={formDisabled}
              size="small"
              style={{ border: 'none' }}
              icon={<ReloadOutlined />}
              // onClick={resetMetricData}
            />
          </Tooltip>
        </Col> */}
      </Row>
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
