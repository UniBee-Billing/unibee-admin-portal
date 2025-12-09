import { formatDate } from '@/helpers'
import { getMetricEventCurrentValueReq } from '@/requests'
import { LimitMetricUsage } from '@/shared.types'
import { LoadingOutlined, MinusOutlined } from '@ant-design/icons'
import { Modal, Table, Tooltip } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'

type AdjustRecord = {
  id: number
  quotaAmount: number
  quotaType: string
  reason: string
  previousPeriodLimit: number
  previousPeriodUsed: number
  merchantMemberId: number
  adjustmentTime: number
}

type Props = {
  userId: number
  productId: number
  metricLimit: LimitMetricUsage['metricLimit']
  onClose: () => void
}

const RecordActivityModal = ({
  userId,
  productId,
  metricLimit,
  onClose
}: Props) => {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<AdjustRecord[]>([])

  const fetchRecords = async () => {
    setLoading(true)
    const [res, err] = await getMetricEventCurrentValueReq({
      metricCode: metricLimit.code,
      userId,
      productId
    })
    setLoading(false)

    if (err != null) {
      return
    }

    setRecords(res?.metricLimit?.quotaAdjustments ?? [])
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const columns: ColumnsType<AdjustRecord> = [
    {
      title: 'Quantity',
      dataIndex: 'quotaAmount',
      key: 'quotaAmount'
    },
    {
      title: 'Type',
      dataIndex: 'quotaType',
      key: 'quotaType',
      ellipsis: true,
      width: 120,
      render: (type) => type || <MinusOutlined />
    },
    {
      title: 'Operation Time',
      dataIndex: 'adjustmentTime',
      key: 'adjustmentTime',
      render: (time) => (time ? formatDate(time, true) : <MinusOutlined />)
    },
    {
      title: 'Notes',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason) =>
        reason ? <Tooltip title={reason}>{reason}</Tooltip> : <MinusOutlined />
    }
  ]

  return (
    <Modal
      title="Record Activity"
      open={true}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 24 }} spin />
        }}
        size="small"
      />
    </Modal>
  )
}

export default RecordActivityModal
