import { useEffect } from 'react'

import PromoCreditTxHistory from '../user/promoCreditTxHist'

const Index = () => {
  useEffect(() => {}, [])

  return (
    <>
      <PromoCreditTxHistory refreshTxHistory={false} />
    </>
  )
}

export default Index

/*

  const fetchData = async () => {
    setLoading(true)
    const [res, err] = await getCreditTxListReq({
      accountType: CreditType.PROMO_CREDIT
    })
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    console.log('creditTransactions: ', res)
    const { creditTransactions, total } = res
    setCreditTxlist(creditTransactions ?? [])
    setTotal(total)
  }

  const columns: ColumnsType<TCreditTx> = [
    {
      title: 'Time',
      dataIndex: 'createTime',
      key: 'createTime'
    },
    {
      title: 'User Email',
      dataIndex: 'user',
      key: 'user',
      render: (u) => <a>{u.email}</a>
    },
    {
      title: 'Amount',
      dataIndex: 'deltaAmount',
      key: 'deltaAmount'
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId'
    }
  ]

 <Table
        columns={columns}
        dataSource={creditTxList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        // onChange={onTableChange}
        
        onRow={(record) => {
          return {
            onClick: (event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('.plan-action-btn-wrapper') != null
              ) {
                return
              }
              navigate(`/plan/${record.id}?productId=${productId}`)
            }
          }
        }}
        
        />
        <div className="mx-0 my-4 flex items-center justify-end">
          <Pagination
            current={page + 1} // back-end starts with 0, front-end starts with 1
            pageSize={PAGE_SIZE}
            total={total}
            size="small"
            onChange={onPageChange}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
            disabled={loading}
            showSizeChanger={false}
          />
        </div>
*/
