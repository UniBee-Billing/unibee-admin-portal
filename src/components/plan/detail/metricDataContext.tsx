import { MetricType } from '@/shared.types'
import React, { createContext, useState } from 'react'
import { MetricData } from './billableMetric/types'
import { MetricValidationError } from './helpers'

type MetricDataContextType = {
  metricData: MetricData
  metricError: MetricValidationError | null
  setMetricData: React.Dispatch<React.SetStateAction<MetricData>>
  setMetricError: React.Dispatch<
    React.SetStateAction<MetricValidationError | null>
  >
  resetMetricData: (_metricType: MetricType, _localId: string) => void
}

const MetricDataContext = createContext<MetricDataContextType>({
  metricData: {
    metricLimits: [],
    metricMeteredCharge: [],
    metricRecurringCharge: []
  },
  metricError: null,
  setMetricData: () => {},
  setMetricError: () => {},
  resetMetricData: () => {}
})

const MetricDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [metricData, setMetricData] = useState<MetricData>({
    metricLimits: [],
    metricMeteredCharge: [],
    metricRecurringCharge: []
  })
  const [metricError, setMetricError] = useState<MetricValidationError | null>(
    null
  )
  const resetMetricData = (_metricType: MetricType, _localId: string) => {}
  return (
    <MetricDataContext.Provider
      value={{
        metricData,
        setMetricData,
        metricError,
        setMetricError,
        resetMetricData
      }}
    >
      {children}
    </MetricDataContext.Provider>
  )
}

export { MetricDataContext, MetricDataProvider }
