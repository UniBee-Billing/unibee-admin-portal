import { formatDate, showAmount } from '@/helpers'
import { SplitPayment } from '@/shared.types'
import { LoadingOutlined } from '@ant-design/icons'
import { Button, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import CopyToClipboard from '../ui/copyToClipboard'

// Split payment status codes (different from PaymentStatus)
export const enum SplitPaymentStatus {
  PENDING = 10,
  SUCCESS = 20,
  FAILURE = 30,
  CANCEL = 40
}

const SPLIT_PAYMENT_STATUS: Record<number, { label: string; color: string }> = {
  [SplitPaymentStatus.PENDING]: { label: 'Pending', color: 'blue' },
  [SplitPaymentStatus.SUCCESS]: { label: 'Succeeded', color: '#87d068' },
  [SplitPaymentStatus.FAILURE]: { label: 'Failed', color: 'red' },
  [SplitPaymentStatus.CANCEL]: { label: 'Cancelled', color: 'purple' }
}

const SplitPaymentStatusTag = (status: number) => {
  const statusInfo = SPLIT_PAYMENT_STATUS[status] || { label: 'Unknown', color: 'default' }
  return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
}

interface TransactionHistoryProps {
  payments: SplitPayment[]
  currency: string
  loading: boolean
  invoiceId: string
  onRefund?: (payment: SplitPayment) => void
}

const TransactionHistory = ({
  payments,
  currency,
  loading,
  invoiceId,
  onRefund
}: TransactionHistoryProps) => {
  const columns: ColumnsType<SplitPayment> = [
    {
      title: 'Payment (#)',
      key: 'paymentSeq',
      width: 100,
      render: (_, __, index) => (
        <span className="font-medium">#{index + 1}</span>
      )
    },
    {
      title: 'Transaction ID',
      dataIndex: 'paymentId',
      key: 'transactionId',
      width: 180,
      render: (paymentId: string) => (
        <div className="flex items-center gap-1">
          <span className="font-mono">{paymentId}</span>
          <CopyToClipboard content={paymentId} />
        </div>
      )
    },
    {
      title: 'Gateway',
      dataIndex: 'gatewayName',
      key: 'gateway',
      width: 120
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      width: 120,
      render: (amount: number, record) => showAmount(amount, record.currency)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => SplitPaymentStatusTag(status)
    },
    {
      title: 'Created By',
      dataIndex: 'createTime',
      key: 'createdBy',
      width: 160,
      render: (createTime: number) =>
        createTime && createTime > 0 ? (
          <span className="font-mono">{formatDate(createTime, true)}</span>
        ) : (
          '-'
        )
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => {
        // Only show refund for paid transactions (status 20 = success)
        if (record.status === SplitPaymentStatus.SUCCESS) {
          return (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => onRefund?.(record)}
            >
              Refund
            </Button>
          )
        }
        return null
      }
    }
  ]

  // Don't render anything if there are no payments
  if (!payments || payments.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Split Transaction History</h3>
      <Table
        columns={columns}
        dataSource={payments}
        rowKey="paymentId"
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 24 }} spin />
        }}
        pagination={false}
        scroll={{ x: 800 }}
      />
    </div>
  )
}

export default TransactionHistory
