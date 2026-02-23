import { getMetricEventCurrentValueReq } from '@/requests'
import { LimitMetricUsage, QuotaType } from '@/shared.types'
import { LoadingOutlined } from '@ant-design/icons'
import { Modal, Spin, Tag } from 'antd'
import { useEffect, useState } from 'react'

type MetricLimitResponse = {
  TotalLimit: number
  PlanLimits?: { metricLimit: number; planId: number; quantity?: number }[]
  quotaAdjustments?: {
    quotaAmount: number
    quotaType: string
  }[]
}

type Props = {
  userId: number
  productId: number
  metricLimit: LimitMetricUsage['metricLimit']
  onClose: () => void
}

const ViewTotalLimitModal = ({ userId, productId, metricLimit, onClose }: Props) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MetricLimitResponse | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [res, err] = await getMetricEventCurrentValueReq({
      metricCode: metricLimit.code,
      userId,
      productId
    })
    setLoading(false)

    if (err == null && res?.metricLimit) {
      setData(res.metricLimit)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const standardValue =
    data?.PlanLimits?.reduce((sum, p) => {
      const qty = (p.quantity ?? 1) < 1 ? 1 : (p.quantity ?? 1)
      return sum + (p.metricLimit ?? 0) * qty
    }, 0) ??
    metricLimit.planLimit ??
    metricLimit.TotalLimit ??
    0

  const rolloverValue =
    data?.quotaAdjustments
      ?.filter((q) => q.quotaType === QuotaType.CARRYOVER)
      .reduce((sum, q) => sum + (q.quotaAmount ?? 0), 0) ??
    metricLimit.rolloverLimit ??
    0

  const manualValue =
    data?.quotaAdjustments
      ?.filter((q) => q.quotaType === QuotaType.MANUAL)
      .reduce((sum, q) => sum + (q.quotaAmount ?? 0), 0) ?? 0

  const refundValue =
    data?.quotaAdjustments
      ?.filter((q) => q.quotaType.toLowerCase().includes('refund'))
      .reduce((sum, q) => sum + (q.quotaAmount ?? 0), 0) ?? 0

  const otherValue =
    data?.quotaAdjustments
      ?.filter((q) => {
        const type = q.quotaType.toLowerCase()
        return (
          type !== QuotaType.CARRYOVER &&
          type !== QuotaType.MANUAL &&
          !type.includes('refund')
        )
      })
      .reduce((sum, q) => sum + (q.quotaAmount ?? 0), 0) ?? 0

  return (
    <Modal
      title="View Total Limit"
      open={true}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <Spin
        spinning={loading}
        indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
      >
        <div className="flex flex-col gap-4 py-4">
          <div>
            <div className="mb-2 text-gray-500">Standard value</div>
            <Tag color="default" style={{ fontSize: 14, padding: '4px 12px' }}>
              {standardValue}
            </Tag>
          </div>
          <div>
            <div className="mb-2 text-gray-500">Total rollover value</div>
            <Tag
              color={rolloverValue > 0 ? 'green' : 'default'}
              style={{ fontSize: 14, padding: '4px 12px' }}
            >
              {rolloverValue > 0 ? `+${rolloverValue}` : rolloverValue}
            </Tag>
          </div>
          <div>
            <div className="mb-2 text-gray-500">Total manual value</div>
            <Tag
              color={manualValue > 0 ? 'green' : manualValue < 0 ? 'red' : 'default'}
              style={{ fontSize: 14, padding: '4px 12px' }}
            >
              {manualValue > 0 ? `+${manualValue}` : manualValue}
            </Tag>
          </div>
          <div>
            <div className="mb-2 text-gray-500">Total refund value</div>
            <Tag
              color={refundValue < 0 ? 'red' : 'default'}
              style={{ fontSize: 14, padding: '4px 12px' }}
            >
              {refundValue}
            </Tag>
          </div>
          <div>
            <div className="mb-2 text-gray-500">Total other value</div>
            <Tag
              color={otherValue > 0 ? 'green' : otherValue < 0 ? 'red' : 'default'}
              style={{ fontSize: 14, padding: '4px 12px' }}
            >
              {otherValue > 0 ? `+${otherValue}` : otherValue}
            </Tag>
          </div>
        </div>
      </Spin>
    </Modal>
  )
}

export default ViewTotalLimitModal
