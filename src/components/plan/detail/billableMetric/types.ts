import { MetricLimits, MetricMeteredCharge } from '@/shared.types'

export type MetricData = {
  metricLimits: (MetricLimits & { localId: string })[]
  metricMeteredCharge: (MetricMeteredCharge & { localId: string })[]
  metricRecurringCharge: (MetricMeteredCharge & { localId: string })[]
}
