import { randomString } from '@/helpers'
import {
  CURRENCY,
  IBillableMetrics,
  IPlan,
  MetricChargeType,
  MetricGraduatedAmount,
  MetricLimits,
  MetricMeteredCharge,
  MetricType
} from '@/shared.types'
import { DownOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Dropdown, Empty, Form, FormInstance, Input, Space } from 'antd'

import update from 'immutability-helper'
import { useEffect, useState } from 'react'
import { TNewPlan } from '..'
import GraduationSetupModal from './graduationSetup'
import LimitMetricSetup from './limitMetricSetup'
import MeteredMetricSetup from './meteredMetricSetup'
import { MetricData } from './types'

type BillableMetricSetupProps = {
  metricsList: IBillableMetrics[] // all the billable metrics we have created in /billable-metrics, not used for edit, but used in <Select /> for user to choose.
  getCurrency: () => CURRENCY
  form: FormInstance
  saveMetricData: boolean
  plan: IPlan | TNewPlan
}

const defaultMetricLimit = (): MetricLimits & { localId: string } => ({
  metricId: null,
  metricLimit: null,
  localId: randomString(8)
})
const defaultMetricMeteredCharge = (): MetricMeteredCharge & {
  localId: string
} => ({
  metricId: null,
  chargeType: MetricChargeType.STANDARD,
  standardAmount: null,
  standardStartValue: null,
  graduatedAmounts: [],
  localId: randomString(8)
})
const defaultMetricRecurringCharge = (): MetricMeteredCharge & {
  localId: string
} => ({
  metricId: null,
  chargeType: MetricChargeType.STANDARD,
  standardAmount: null,
  standardStartValue: null,
  graduatedAmounts: [],
  localId: randomString(8)
})

const Index = ({
  metricsList,
  getCurrency,
  form,
  saveMetricData,
  plan
}: BillableMetricSetupProps) => {
  const { metricLimits, metricMeteredCharge, metricRecurringCharge } = plan

  const metricLimitsLocal =
    metricLimits == null
      ? []
      : metricLimits.map((m) => ({
          ...m,
          localId: randomString(8)
        }))

  const metricMeteredChargeLocal =
    metricMeteredCharge == null
      ? []
      : metricMeteredCharge.map((m) => ({
          ...m,
          localId: randomString(8)
        }))

  const metricRecurringChargeLocal =
    metricRecurringCharge == null
      ? []
      : metricRecurringCharge.map((m) => ({
          ...m,
          localId: randomString(8)
        }))

  const [metricData, setMetricData] = useState<MetricData>({
    metricLimits: metricLimitsLocal,
    metricMeteredCharge: metricMeteredChargeLocal,
    metricRecurringCharge: metricRecurringChargeLocal
  })

  const [graduationSetupModalOpen, setGraduationSetupModalOpen] = useState<{
    metricType: keyof MetricData
    localId: string
  } | null>(null)

  const addLimitData = () => {
    setMetricData(
      update(metricData, { metricLimits: { $push: [defaultMetricLimit()] } })
    )
  }

  const removeLimitData = (localId: string) => {
    const idx = metricData.metricLimits.findIndex((m) => m.localId == localId)
    if (idx != -1) {
      setMetricData(
        update(metricData, { metricLimits: { $splice: [[idx, 1]] } })
      )
    }
  }

  const addMetricData = (type: keyof MetricData) => {
    switch (type) {
      case 'metricLimits':
        setMetricData(
          update(metricData, {
            [type]: { $push: [defaultMetricLimit()] }
          })
        )
        break
      case 'metricMeteredCharge':
        setMetricData(
          update(metricData, {
            [type]: { $push: [defaultMetricMeteredCharge()] }
          })
        )
        break
      case 'metricRecurringCharge':
        setMetricData(
          update(metricData, {
            [type]: { $push: [defaultMetricRecurringCharge()] }
          })
        )
        break
    }
  }

  const removeMetricData = (type: keyof MetricData, localId: string) => {
    const idx = metricData[type].findIndex((m) => m.localId == localId)
    if (idx != -1) {
      setMetricData(update(metricData, { [type]: { $splice: [[idx, 1]] } }))
    }
  }

  const onMetricFieldChange =
    (
      type: keyof MetricData,
      localId: string,
      field: keyof MetricLimits | keyof MetricMeteredCharge
    ) =>
    (val: number | null) => {
      const idx = metricData[type].findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setMetricData(
          update(metricData, { [type]: { [idx]: { [field]: { $set: val } } } })
        )
      }
    }

  const onSaveGraduationData =
    (type: keyof MetricData, localId: string) =>
    (graduationData: MetricGraduatedAmount[]) => {
      const idx = metricData[type].findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setMetricData(
          update(metricData, {
            [type]: { [idx]: { graduatedAmounts: { $set: graduationData } } }
          })
        )
      }
      setGraduationSetupModalOpen(null)
    }

  const onChargeTypeSelectChange =
    (type: keyof MetricData, localId: string) => (val: number | null) => {
      const idx = metricData[type].findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setMetricData(
          update(metricData, {
            [type]: { [idx]: { chargeType: { $set: val } } }
          })
        )
      }
    }

  const onMetricIdSelectChange =
    (type: keyof MetricData, localId: string) => (val: number | null) => {
      const idx = metricData[type].findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setMetricData(
          update(metricData, {
            [type]: { [idx]: { metricId: { $set: val } } }
          })
        )
      }
    }

  useEffect(() => {
    if (saveMetricData) {
      form.setFieldsValue(metricData)
    }
  }, [saveMetricData])

  return (
    <div>
      <Form.Item label="Billable metrics" name="metricLimits" hidden={true}>
        <Input.TextArea rows={6} />
      </Form.Item>
      <Form.Item
        label="Billable metrics"
        name="metricMeteredCharge"
        hidden={true}
      >
        <Input.TextArea rows={6} />
      </Form.Item>
      <Form.Item
        label="Billable metrics"
        name="metricRecurringCharge"
        hidden={true}
      >
        <Input.TextArea rows={6} />
      </Form.Item>
      {metricData.metricLimits.length == 0 &&
        metricData.metricMeteredCharge.length == 0 &&
        metricData.metricRecurringCharge.length == 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No billable metrics"
          />
        )}
      {graduationSetupModalOpen != null && (
        <GraduationSetupModal
          data={
            metricData[graduationSetupModalOpen.metricType].find(
              (m) => m.localId == graduationSetupModalOpen.localId
            )?.graduatedAmounts
          }
          onCancel={() => setGraduationSetupModalOpen(null)}
          onOK={onSaveGraduationData(
            graduationSetupModalOpen.metricType,
            graduationSetupModalOpen.localId
          )}
          getCurrency={getCurrency}
        />
      )}
      {metricData.metricLimits.length > 0 && (
        <LimitMetricSetup
          metricData={metricData.metricLimits}
          metricsList={metricsList.filter(
            (m) => m.type == MetricType.LIMIT_METERED
          )}
          onMetricFieldChange={onMetricFieldChange}
          onMetricIdSelectChange={onMetricIdSelectChange}
          // getCurrency={getCurrency}
          addLimitData={addLimitData}
          removeLimitData={removeLimitData}
        />
      )}
      {metricData.metricMeteredCharge.length > 0 && (
        <MeteredMetricSetup
          metricData={metricData.metricMeteredCharge}
          isRecurring={false}
          metricDataType="metricMeteredCharge"
          metricsList={metricsList.filter(
            (m) => m.type == MetricType.CHARGE_METERED
          )}
          getCurrency={getCurrency}
          addMetricData={addMetricData}
          removeMetricData={removeMetricData}
          onMetricFieldChange={onMetricFieldChange}
          onChargeTypeSelectChange={onChargeTypeSelectChange}
          onMetricIdSelectChange={onMetricIdSelectChange}
          setGraduationSetupModalOpen={setGraduationSetupModalOpen}
        />
      )}
      {metricData.metricRecurringCharge.length > 0 && (
        <MeteredMetricSetup
          metricData={metricData.metricRecurringCharge}
          isRecurring={true}
          metricDataType="metricRecurringCharge"
          metricsList={metricsList.filter(
            (m) => m.type == MetricType.CHARGE_RECURRING
          )}
          getCurrency={getCurrency}
          addMetricData={addMetricData}
          removeMetricData={removeMetricData}
          onMetricFieldChange={onMetricFieldChange}
          onChargeTypeSelectChange={onChargeTypeSelectChange}
          onMetricIdSelectChange={onMetricIdSelectChange}
          setGraduationSetupModalOpen={setGraduationSetupModalOpen}
        />
      )}
      <Dropdown
        arrow={true}
        menu={{
          items: [
            {
              label: 'Limit metered',
              disabled: metricData.metricLimits.length > 0,
              key: MetricType.LIMIT_METERED,
              onClick: () => {
                addMetricData('metricLimits')
              }
            },
            {
              label: 'Charge metered',
              disabled: metricData.metricMeteredCharge.length > 0,
              key: MetricType.CHARGE_METERED,
              onClick: () => {
                addMetricData('metricMeteredCharge')
              }
            },
            {
              label: 'Charge recurring',
              disabled: metricData.metricRecurringCharge.length > 0,
              key: MetricType.CHARGE_RECURRING,
              onClick: () => {
                addMetricData('metricRecurringCharge')
              }
            }
          ]
        }}
      >
        <Button icon={<PlusOutlined />} variant="outlined" color="default">
          <Space>
            Add billing model
            <DownOutlined />
          </Space>
        </Button>
      </Dropdown>
      {/* &nbsp;&nbsp;&nbsp;&nbsp;
        <Button
          onClick={() => {
            form.setFieldsValue(metricData)
          }}
        >
          Save data
        </Button> */}
    </div>
  )
}

export default Index
