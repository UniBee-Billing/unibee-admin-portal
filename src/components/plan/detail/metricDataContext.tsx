import React, { createContext, useState } from 'react'
import { MetricData } from './billableMetric/types'

type MetricDataContextType = {
  metricData: MetricData
  setMetricData: React.Dispatch<React.SetStateAction<MetricData>>
}

const MetricDataContext = createContext<MetricDataContextType>({
  metricData: {
    metricLimits: [],
    metricMeteredCharge: [],
    metricRecurringCharge: []
  },
  setMetricData: () => {}
})

const MetricDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [metricData, setMetricData] = useState<MetricData>({
    metricLimits: [],
    metricMeteredCharge: [],
    metricRecurringCharge: []
  })
  return (
    <MetricDataContext.Provider value={{ metricData, setMetricData }}>
      {children}
    </MetricDataContext.Provider>
  )
}

export { MetricDataContext, MetricDataProvider }
