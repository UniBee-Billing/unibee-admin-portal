import {
  CURRENCY,
  IBillableMetrics,
  MetricGraduatedAmount,
  MetricLimits,
  MetricMeteredCharge,
  MetricType
} from '@/shared.types'
import { DownOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Dropdown,
  Empty,
  Form,
  FormInstance,
  Input,
  Modal,
  Space
} from 'antd'

import update from 'immutability-helper'
import { useContext, useEffect, useState } from 'react'
import {
  defaultMetricLimit,
  defaultMetricMeteredCharge,
  defaultMetricRecurringCharge
} from '../constants'
import { MetricDataContext } from '../metricDataContext'
import GraduationSetupModal from './graduationSetup'
import LimitMetricSetup from './limitMetricSetup'
import MeteredMetricSetup from './meteredMetricSetup'
import { MetricData } from './types'

type BillableMetricSetupProps = {
  metricsList: IBillableMetrics[] // all the billable metrics we have created in /billable-metrics, not used for edit, but used in <Select /> for user to choose.
  getCurrency: () => CURRENCY
  form: FormInstance
  saveMetricData: boolean
}

const Index = ({
  metricsList,
  getCurrency,
  form,
  saveMetricData
}: BillableMetricSetupProps) => {
  const { metricData, setMetricData } = useContext(MetricDataContext)
  const [graduationSetupModalOpen, setGraduationSetupModalOpen] = useState<{
    metricType: keyof MetricData
    localId: string
  } | null>(null)

  const addMetricData = <T extends keyof MetricData>(
    type: T, // T is MetricData key, MetricData value is an array of MetricLimits | MetricMeteredCharge
    defaultData: (typeof metricData)[T][number] // based on the key, defaultData type is this array's item type.
  ) =>
    setMetricData(
      update(metricData, {
        [type]: { $push: [defaultData] }
      })
    )

  const removeMetricData = (type: keyof MetricData, localId: string) => {
    const idx = metricData[type].findIndex((m) => m.localId == localId)
    if (idx != -1) {
      setMetricData(update(metricData, { [type]: { $splice: [[idx, 1]] } }))
    }
  }

  const onMetricFieldChange =
    <T extends keyof MetricData>(
      type: T,
      localId: string,
      field: T extends 'metricLimits'
        ? keyof MetricLimits
        : keyof MetricMeteredCharge
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

  const toggleGraduationSetup = (type: keyof MetricData, localId: string) => {
    const idx = metricData[type].findIndex((m) => m.localId == localId)
    if (idx != -1) {
      setMetricData(
        update(metricData, {
          [type]: {
            [idx]: { expanded: { $set: !metricData[type][idx].expanded } }
          }
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
        <Modal title="Graduation setup" width={720} open={true} footer={false}>
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
        </Modal>
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
          addLimitData={(type) => addMetricData(type, defaultMetricLimit())}
          removeLimitData={removeMetricData}
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
          addMetricData={(type) =>
            addMetricData(type, defaultMetricMeteredCharge())
          }
          removeMetricData={removeMetricData}
          onMetricFieldChange={onMetricFieldChange}
          onChargeTypeSelectChange={onChargeTypeSelectChange}
          onMetricIdSelectChange={onMetricIdSelectChange}
          setGraduationSetupModalOpen={setGraduationSetupModalOpen}
          toggleGraduationSetup={toggleGraduationSetup}
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
          addMetricData={(type) =>
            addMetricData(type, defaultMetricRecurringCharge())
          }
          removeMetricData={removeMetricData}
          onMetricFieldChange={onMetricFieldChange}
          onChargeTypeSelectChange={onChargeTypeSelectChange}
          onMetricIdSelectChange={onMetricIdSelectChange}
          setGraduationSetupModalOpen={setGraduationSetupModalOpen}
          toggleGraduationSetup={toggleGraduationSetup}
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
                addMetricData('metricLimits', defaultMetricLimit())
              }
            },
            {
              label: 'Charge metered',
              disabled: metricData.metricMeteredCharge.length > 0,
              key: MetricType.CHARGE_METERED,
              onClick: () => {
                addMetricData(
                  'metricMeteredCharge',
                  defaultMetricMeteredCharge()
                )
              }
            },
            {
              label: 'Charge recurring',
              disabled: metricData.metricRecurringCharge.length > 0,
              key: MetricType.CHARGE_RECURRING,
              onClick: () => {
                addMetricData(
                  'metricRecurringCharge',
                  defaultMetricRecurringCharge()
                )
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
    </div>
  )
}

export default Index
