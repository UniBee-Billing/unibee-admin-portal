import { formatDate } from '@/helpers'
import { usePagination } from '@/hooks'
import { getOneTimePaymentHistoryReq } from '@/requests'
import { IOneTimeHistoryItem } from '@/shared.types'
import { LoadingOutlined } from '@ant-design/icons'
import { Divider, message, Pagination } from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PaymentStatusTag } from '../ui/statusTag'

const PAGE_SIZE = 10

const Index = ({ userId }: { userId: number }) => {
  const [loading, setLoading] = useState(false)
  const { page, onPageChangeNoParams } = usePagination()
  const [total, setTotal] = useState(0)
  const [onetimeHistory, setOneTimeHistory] = useState<IOneTimeHistoryItem[]>(
    []
  )
  const navigate = useNavigate()

  const getOneTimeHistory = async () => {
    setLoading(true)
    const [res, err] = await getOneTimePaymentHistoryReq({
      page,
      count: PAGE_SIZE,
      userId,
      refreshCb: getOneTimeHistory
    })
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    const { paymentItems, total } = res
    setOneTimeHistory(paymentItems ?? [])
    setTotal(total)
  }

  const columns: ColumnsType<IOneTimeHistoryItem> = [
    {
      title: 'Item name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => (d == 0 || d == null ? '―' : formatDate(d, true))
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => PaymentStatusTag(status)
    },

    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      width: 140,
      render: (subId) =>
        subId == '' || subId == null ? (
          ''
        ) : (
          <div
            className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`/subscription/${subId}`)}
          >
            {subId}
          </div>
        )
    },
    {
      title: 'Payment Id',
      dataIndex: 'paymentId',
      key: 'paymentId'
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) =>
        ivId == '' || ivId == null ? (
          ''
        ) : (
          <div
            className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`/invoice/${ivId}`)}
          >
            {ivId}
          </div>
        )
    }
  ]

  useEffect(() => {
    getOneTimeHistory()
  }, [page])

  return (
    <>
      <Divider orientation="left" style={{ margin: '16px 0' }}>
        One-time Purchase History
      </Divider>
      <Table
        columns={columns}
        dataSource={onetimeHistory}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        // scroll={{ x: true, y: 640 }}
        onRow={() => {
          return {
            onClick: () => {}
          }
        }}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
      />
      <div className="mt-6 flex justify-end">
        <Pagination
          style={{ marginTop: '16px' }}
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          size="small"
          onChange={onPageChangeNoParams}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </>
  )
}

export default Index
