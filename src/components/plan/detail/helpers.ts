import { randomString } from '@/helpers'
import { CURRENCY, MetricLimits, MetricMeteredCharge } from '@/shared.types'
import { MetricData } from './billableMetric/types'
import { TIME_UNITS } from './types'

export const secondsToUnit = (sec: number) => {
  const units = [...TIME_UNITS].sort((a, b) => b.value - a.value)
  for (let i = 0; i < units.length; i++) {
    if (sec % units[i].value === 0) {
      return [sec / units[i].value, units[i].value] // if sec is 60 * 60 * 24 * 30 * 3, then return [3, 60 * 60 * 24 * 30 * 3]
    }
  }
  throw Error('Invalid time unit')
}

export const unitToSeconds = (value: number, unit: number) => {
  return value * unit
}

export const transformTrialData = () => {}

// downward(BE -> FE) | upward(FE -> BE)
export const transformMetricData = (
  metricData: MetricData,
  currency: CURRENCY,
  direction: 'downward' | 'upward'
) => {
  const { metricLimits, metricMeteredCharge, metricRecurringCharge } =
    metricData
  let metricLimitsLocal: MetricLimits[] = []
  let metricMeteredChargeLocal: MetricMeteredCharge[] = []
  let metricRecurringChargeLocal: MetricMeteredCharge[] = []
  if (direction === 'downward') {
    metricLimitsLocal =
      metricLimits == null
        ? []
        : metricLimits.map((m) => ({
            ...m,
            localId: randomString(8)
          }))

    metricMeteredChargeLocal =
      metricMeteredCharge == null
        ? []
        : metricMeteredCharge.map((m) => ({
            ...m,
            localId: randomString(8)
          }))

    metricRecurringChargeLocal =
      metricRecurringCharge == null
        ? []
        : metricRecurringCharge.map((m) => ({
            ...m,
            localId: randomString(8)
          }))
  } else {
    metricLimitsLocal = metricLimits.map((m) => ({
      ...m
    }))

    metricMeteredChargeLocal = metricMeteredCharge.map((m) => ({
      ...m
    }))

    metricRecurringChargeLocal = metricRecurringCharge.map((m) => ({
      ...m
    }))
  }
  return {
    metricLimits: metricLimitsLocal,
    metricMeteredCharge: metricMeteredChargeLocal,
    metricRecurringCharge: metricRecurringChargeLocal
  }
}
