import { randomString } from '@/helpers'
import {
  CURRENCY,
  MetricLimits,
  MetricMeteredCharge,
  MetricType
} from '@/shared.types'
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

export type MetricValidationError = {
  metricType: MetricType
  rowIdx: number
  localId: string
  field: string
  errMsg: string
}
const validateMetricLimits = (
  metricLimits: MetricLimits[] | null
): MetricValidationError | null => {
  if (metricLimits == null) {
    return null
  }
  for (let i = 0; i < metricLimits.length; i++) {
    const metricLimit = metricLimits[i]
    if (metricLimit.metricId == null) {
      return {
        metricType: MetricType.LIMIT_METERED,
        rowIdx: i,
        localId: metricLimit.localId,
        field: 'metricId',
        errMsg: 'Metric name is required'
      }
    }
    const limitValue = metricLimit.metricLimit
    if (
      limitValue == null ||
      limitValue === 0 ||
      !Number.isInteger(limitValue)
    ) {
      return {
        metricType: MetricType.LIMIT_METERED,
        rowIdx: i,
        localId: metricLimit.localId,
        field: 'metricLimit',
        errMsg: 'Metric limit must be a positive integer'
      }
    }
  }
  return null
}

const validateMetricCharge = (
  metricType: MetricType,
  metricMeteredCharge: MetricMeteredCharge[] | null
): MetricValidationError | null => {
  if (metricMeteredCharge == null) {
    return null
  }
  for (let i = 0; i < metricMeteredCharge.length; i++) {
    const metricCharge = metricMeteredCharge[i]
    if (metricCharge.metricId == null) {
      return {
        metricType: metricType,
        rowIdx: i,
        localId: metricCharge.localId,
        field: 'metricId',
        errMsg: 'Metric name is required'
      }
    }
  }
  return null
}

export const validateMetricData = (
  metricData: MetricData
): MetricValidationError | null => {
  const { metricLimits, metricMeteredCharge, metricRecurringCharge } =
    metricData
  const metricLimitsErr = validateMetricLimits(metricLimits)
  const metricMeteredChargeErr = validateMetricCharge(
    MetricType.CHARGE_METERED,
    metricMeteredCharge
  )
  const metricRecurringChargeErr = validateMetricCharge(
    MetricType.CHARGE_RECURRING,
    metricRecurringCharge
  )
  const errs =
    metricLimitsErr || metricMeteredChargeErr || metricRecurringChargeErr
  if (errs != null) {
    return errs
  }
  return null
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
