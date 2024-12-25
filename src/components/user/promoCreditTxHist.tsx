import { LoadingOutlined, MinusOutlined } from '@ant-design/icons'
import { Button, message, Pagination } from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CREDIT_TX_TYPE } from '../../constants'
import { formatDate, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { getCreditTxListReq } from '../../requests'
import {
  CreditTxType,
  CreditType,
  IProfile,
  TCreditTx
} from '../../shared.types'
import CopyToClipboard from '../ui/copyToClipboard'

const PAGE_SIZE = 10

const Index = ({
  userDetail,
  refreshTxHistory, // when used in user detail -> promoCredit tab, after admin updated credit amt, this component need to re-render to get the latest list
  // when this props passed as true, run fetchCreditTxList
  setRefreshTxHist,
  embeddingMode
}: {
  userDetail?: IProfile
  refreshTxHistory: boolean
  setRefreshTxHist?: (v: boolean) => void
  embeddingMode?: boolean
}) => {
  const navigate = useNavigate()
  const [creditTxList, setCreditTxList] = useState<TCreditTx[]>([])
  const [loading, setLoading] = useState(refreshTxHistory)
  const { page, onPageChange, onPageChangeNoParams } = usePagination()
  const [total, setTotal] = useState(0)

  const columns: ColumnsType<TCreditTx> = [
    {
      title: 'Amount changed',
      dataIndex: 'deltaAmount',
      key: 'deltaAmount',
      render: (amt, tx) =>
        `${amt} (${showAmount(tx.deltaCurrencyAmount, tx.currency)})`
    },
    {
      title: 'User Email',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <Button
          type="link"
          onClick={() => navigate(`/user/${user.id}`)}
          style={{ padding: 0 }}
        >
          {user.email}
        </Button>
      ),
      hidden: embeddingMode
    },
    {
      title: 'Transaction Type',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (type: CreditTxType) => CREDIT_TX_TYPE[type]
    },
    {
      title: 'By',
      dataIndex: 'adminMember',
      key: 'adminMember',
      render: (by) =>
        by != undefined ? `${by.firstName} ${by.lastName}` : <MinusOutlined />
    },
    {
      title: 'At',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => formatDate(d, true)
    },
    {
      title: 'Invoice Applied',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) =>
        ivId == null || ivId == '' ? (
          <MinusOutlined />
        ) : (
          <div className="flex items-center">
            <Button
              type="link"
              onClick={() => navigate(`/invoice/${ivId}`)}
              style={{ padding: 0, fontFamily: 'monospace' }}
            >
              {ivId}
            </Button>
            <CopyToClipboard content={ivId} />
          </div>
        )
    }
  ]

  const fetchCreditTxList = async () => {
    setLoading(true)
    const [res, err] = await getCreditTxListReq({
      accountType: CreditType.PROMO_CREDIT,
      userId: userDetail == undefined ? undefined : (userDetail.id as number),
      page,
      count: PAGE_SIZE
    })
    setLoading(false)
    if (setRefreshTxHist != undefined) {
      setRefreshTxHist(false)
    }
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
      {!embeddingMode && <div>search area</div>}
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
      />

      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          size="small"
          onChange={embeddingMode ? onPageChangeNoParams : onPageChange}
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
