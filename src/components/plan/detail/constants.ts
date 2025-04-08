import { randomString } from '@/helpers'
import {
  MetricChargeType,
  MetricLimits,
  MetricMeteredCharge,
  PlanPublishStatus,
  PlanStatus,
  PlanType
} from '@/shared.types'
import { TNewPlan } from './types'

export const DEFAULT_NEW_PLAN: TNewPlan = {
  currency: 'EUR',
  planName: '',
  internalName: '',
  description: '',
  intervalUnit: 'month',
  intervalCount: 1,
  status: PlanStatus.EDITING,
  publishStatus: PlanPublishStatus.UNPUBLISHED,
  type: PlanType.MAIN,
  addonIds: [],
  metadata: '',
  enableTrial: false,
  trialAmount: undefined,
  trialDurationTime: undefined,
  trialDemand: false, // 'paymentMethod' | '' | boolean, backend requires this field to be a fixed string of 'paymentMethod' to represent true or empty string '' to represent false, but to ease the UI/UX, front-end use boolean for <Switch />
  cancelAtTrialEnd: true //  0 | 1 | boolean // backend requires this field to be a number of 1 | 0, but to ease the UI, front-end use <Switch />
} as const // mark every props readonly

export const defaultMetricLimit = (): MetricLimits => ({
  metricId: null,
  metricLimit: null,
  localId: randomString(8)
})
export const defaultMetricMeteredCharge = (): MetricMeteredCharge => ({
  metricId: null,
  chargeType: MetricChargeType.STANDARD,
  standardAmount: null,
  standardStartValue: null,
  graduatedAmounts: [],
  localId: randomString(8)
})
export const defaultMetricRecurringCharge = (): MetricMeteredCharge => ({
  metricId: null,
  chargeType: MetricChargeType.STANDARD,
  standardAmount: null,
  standardStartValue: null,
  graduatedAmounts: [],
  localId: randomString(8)
})

