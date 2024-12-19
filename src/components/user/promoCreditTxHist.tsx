import { LoadingOutlined } from '@ant-design/icons'
import { Pagination } from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { formatDate, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { getCreditTxListReq } from '../../requests'
import { CreditType, IProfile, TCreditTx } from '../../shared.types'

const PAGE_SIZE = 10

const Index = ({
  userDetail,
  refreshTxHistory,
  setRefreshTxHist
}: {
  userDetail: IProfile | undefined
  refreshTxHistory: boolean
  setRefreshTxHist: (v: boolean) => void
}) => {
  const [creditTxList, setCreditTxList] = useState<TCreditTx[]>([])
  const [loading, setLoading] = useState(refreshTxHistory)
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)

  const columns: ColumnsType<TCreditTx> = [
    {
      title: 'id',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Amount changed',
      dataIndex: 'deltaAmount',
      key: 'deltaAmount',
      render: (amt, tx) =>
        `${amt} (${showAmount(tx.deltaCurrencyAmount, tx.currency)})`
    },
    {
      title: 'By',
      dataIndex: 'adminMember',
      key: 'adminMember',
      render: (by) => `${by?.firstName} ${by?.lastName}`
    },
    {
      title: 'At',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => formatDate(d, true)
    }
  ]

  const fetchCreditTxList = async () => {
    if (userDetail == undefined) {
      return
    }
    setLoading(true)
    const [res, err] = await getCreditTxListReq({
      accountType: CreditType.PROMO_CREDIT,
      userId: userDetail.id as number,
      page,
      count: PAGE_SIZE
    })
    setLoading(false)
    setRefreshTxHist(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { creditTransactions, total } = res
    setCreditTxList(creditTransactions ?? [])
    setTotal(total)
  }

  useEffect(() => {
    fetchCreditTxList()
  }, [page])

  useEffect(() => {
    if (refreshTxHistory) {
      fetchCreditTxList()
    }
  }, [refreshTxHistory])

  return (
    <>
      <div className="my-6 text-lg text-gray-600">
        Promo credit transaction history
      </div>
      <Table
        columns={columns}
        dataSource={creditTxList}
        // onChange={onTableChange}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        // onRow={(user) => {          }}
      />

      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          size="small"
          onChange={onPageChange}
          disabled={loading}
          showSizeChanger={false}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
        />
      </div>
    </>
  )
}

export default Index
