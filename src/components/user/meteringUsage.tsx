import { normalizeSub } from '@/helpers'
import { getMetricUsageBySubIdReq, getSubDetailInProductReq } from '@/requests'
import { IProfile, MetricUsage } from '@/shared.types'
import { Button, message } from 'antd'
import { useEffect, useState } from 'react'

const Index = ({
  userId,
  userProfile,
  productId,
  refreshSub,
  refreshUserProfile
}: {
  userId: number
  userProfile: IProfile | undefined
  productId: number
  refreshSub: boolean
  refreshUserProfile: () => void
}) => {
  const [loading, setLoading] = useState(false)
  const [subId, setSubId] = useState('')
  const [metricUsage, setMetricUsage] = useState<MetricUsage[]>([])

  const getSubInProduct = async () => {
    if (loading) {
      return
    }
    setLoading(true)
    const [res, err] = await getSubDetailInProductReq({
      userId,
      productId,
      refreshCb: getSubInProduct
    })
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    // console.log('get sub in product', res)
    // setSubId(res.subscription.subscriptionId)
    const [res2, err2] = await getMetricUsageBySubIdReq(
      res.subscription.subscriptionId
    )
    if (err2 != null) {
      message.error(err.message)
      return
    }
    console.log('get metric usage by subId', res2)
  }

  useEffect(() => {
    getSubInProduct()
  }, [userId, productId])

  return (
    <div>
      <Button onClick={getSubInProduct}>Refresh</Button>
    </div>
  )
}

export default Index
