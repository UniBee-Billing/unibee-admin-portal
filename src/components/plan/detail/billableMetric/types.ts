import { MetricLimits, MetricMeteredCharge } from '@/shared.types'

export type MetricData = {
  metricLimits: MetricLimits[]
  metricMeteredCharge: MetricMeteredCharge[]
  metricRecurringCharge: MetricMeteredCharge[]
}
