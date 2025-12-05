import { formatDate } from '@/helpers'
import { getMetricLimitAdjustListReq } from '@/requests'
import { LimitMetricUsage } from '@/shared.types'
import { LoadingOutlined, MinusOutlined } from '@ant-design/icons'
import { Modal, Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'

type AdjustRecord = {
  id: number
  adjustAmount: number
  operator: string
  createTime: number
  reason: string
}

type Props = {
  userId: number
  subscriptionId: string
  metricLimit: LimitMetricUsage['metricLimit']
  onClose: () => void
}

const RecordActivityModal = ({
  userId,
  subscriptionId,
  metricLimit,
  onClose
}: Props) => {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<AdjustRecord[]>([])

  const fetchRecords = async () => {
    setLoading(true)
    const [res, err] = await getMetricLimitAdjustListReq({
      userId,
      subscriptionId,
      metricId: metricLimit.metricId,
      page: 0,
      count: 100
    })
    setLoading(false)

    if (err != null) {
      return
    }

    setRecords(res?.adjustList ?? [])
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const columns: ColumnsType<AdjustRecord> = [
    {
      title: 'Quantity',
      dataIndex: 'adjustAmount',
      key: 'adjustAmount'
    },
    {
      title: 'Operator',
      dataIndex: 'operator',
      key: 'operator',
      ellipsis: true,
      width: 120
    },
    {
      title: 'Operation Time',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time) => (time ? formatDate(time, true) : <MinusOutlined />)
    },
    {
      title: 'Notes',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason) => reason || <MinusOutlined />
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
