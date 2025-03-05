import {
  CURRENCY,
  IBillableMetrics,
  MetricLimits,
  MetricMeteredCharge,
  MetricType
} from '@/shared.types'
import { DownOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Dropdown, Empty, Space } from 'antd'

import { currencyDecimalValidate } from '@/helpers'
import update from 'immutability-helper'
import { useContext } from 'react'
import {
  defaultMetricLimit,
  defaultMetricMeteredCharge,
  defaultMetricRecurringCharge
} from '../constants'
import { MetricDataContext } from '../metricDataContext'
import LimitMetricSetup from './limitMetricSetup'
import MeteredMetricSetup from './meteredMetricSetup'
import { MetricData } from './types'

type BillableMetricSetupProps = {
  metricsList: IBillableMetrics[] // all the billable metrics we have created in /billable-metrics, not used for edit, but used in <Select /> for user to choose.
  getCurrency: () => CURRENCY
  formDisabled: boolean
}

const Index = ({
  metricsList,
  getCurrency,
  formDisabled
}: BillableMetricSetupProps) => {
  const { metricData, setMetricData } = useContext(MetricDataContext)
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
      if (
        val != null &&
        field == 'standardAmount' &&
        !currencyDecimalValidate(val, getCurrency().Currency)
      ) {
        return
      }

      const idx = metricData[type].findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setMetricData(
          update(metricData, { [type]: { [idx]: { [field]: { $set: val } } } })
        )
      }
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

  return (
    <div>
      {metricData.metricLimits.length == 0 &&
        metricData.metricMeteredCharge.length == 0 &&
        metricData.metricRecurringCharge.length == 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No billable metrics"
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
          toggleGraduationSetup={toggleGraduationSetup}
          formDisabled={formDisabled}
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
          toggleGraduationSetup={toggleGraduationSetup}
          formDisabled={formDisabled}
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
