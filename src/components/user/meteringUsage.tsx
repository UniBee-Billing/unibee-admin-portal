import { normalizeSub } from '@/helpers'
import { getMetricUsageBySubIdReq, getSubDetailInProductReq } from '@/requests'
import { MetricUsage } from '@/shared.types'
import { message } from 'antd'
import { useState } from 'react'

const Index = () => {
  const [loading, setLoading] = useState(false)
  const [metricUsage, setMetricUsage] = useState<MetricUsage[]>([])

  const getSubInProduct = async () => {
    if (loading) {
      return
    }
    setLoading(true)
    const [res, err] = await getSubDetailInProductReq({
      userId,
      productId
    })
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    //const sub = normalizeSub(res)
    // setSubInfo(sub)
  }

  const fetchMetricUsage = async () => {
    // const [res, err] = await getMetricUsageBySubIdReq(subId)
  }
  return (
    <div>
      <h1>Metering Usage</h1>
    </div>
  )
}

export default Index
