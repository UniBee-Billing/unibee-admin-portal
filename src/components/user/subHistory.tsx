import { LoadingOutlined } from '@ant-design/icons'
import {
  Col,
  Divider,
  message,
  Pagination,
  Popover,
  Row,
  Spin,
  Table
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IProduct, ISubAddon, ISubHistoryItem } from '../../@types/shared.types'
import { formatDate, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { getProductListReq, getSubscriptionHistoryReq } from '../../requests'
import { SubHistoryStatus } from '../ui/statusTag'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = ({ userId }: { userId: number }) => {
  const navigate = useNavigate()
  const [historyLoading, setHistoryLoading] = useState(false)
  const { page, onPageChangeNoParams } = usePagination()
  const [total, setTotal] = useState(0)
  const [subHistory, setSubHistory] = useState<ISubHistoryItem[]>([])
  const [productList, setProductList] = useState<IProduct[]>([])
  const [loadignProducts, setLoadingProducts] = useState(false)

  const getSubHistory = async () => {
    setHistoryLoading(true)
    const [res, err] = await getSubscriptionHistoryReq({
      page,
      count: PAGE_SIZE,
      userId
    })
    setHistoryLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    console.log('sub his res: ', res)
    const { subscriptionTimeLines, total } = res
    setSubHistory(subscriptionTimeLines ?? [])
    setTotal(total)
  }

  const getProductList = async () => {
    setLoadingProducts(true)
    const [res, err] = await getProductListReq()
    setLoadingProducts(false)
    if (null != err) {
      return
    }
    console.log('product list: ', res)
    setProductList(res.products ?? [])
  }

  useEffect(() => {
    getSubHistory()
  }, [page])

  useEffect(() => {
    getProductList()
  }, [])

  const getColumns = (): ColumnsType<ISubHistoryItem> => [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      render: (_, record) => {
        const product = productList.find((p) => p.id == record.plan.productId)
        return product != null ? product.productName : ''
      }
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (_, record) =>
        record.plan == null ? (
          '―'
        ) : (
          <div
            className="w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`${APP_PATH}plan/${record.plan.id}`)}
          >
            {record.plan.planName}
          </div>
        )
    },
    {
      title: 'Start Time',
      dataIndex: 'periodStart',
      key: 'periodStart',
      render: (d) => (d == 0 || d == null ? '―' : formatDate(d))
    },
    {
      title: 'End Time',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      render: (d) => (d == 0 || d == null ? '―' : formatDate(d))
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => SubHistoryStatus(s)
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => (d === 0 ? 'N/A' : formatDate(d, true))
    },
    {
      title: 'Addons',
      dataIndex: 'addons',
      key: 'addons',
      render: (addons: ISubAddon[]) =>
        addons == null ? (
          '―'
        ) : (
          <Popover
            placement="top"
            title="Addon breakdown"
            content={
              <div style={{ width: '280px' }}>
                {addons.map((addon) => (
                  <Row key={addon.id}>
                    <Col span={10} className="font-bold text-gray-500">
                      {addon.addonPlan.planName}
                    </Col>
                    <Col span={14}>
                      {showAmount(
                        addon.addonPlan.amount,
                        addon.addonPlan.currency
                      )}{' '}
                      × {addon.quantity} ={' '}
                      {showAmount(
                        addon.addonPlan.amount * addon.quantity,
                        addon.addonPlan.currency
                      )}
                    </Col>
                  </Row>
                ))}
              </div>
            }
          >
            <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
              {addons.length}
            </span>
          </Popover>
        )
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
            onClick={() => navigate(`${APP_PATH}subscription/${subId}`)}
          >
            {subId}
          </div>
        )
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      width: 140,
      render: (invoiceId) =>
        invoiceId == '' || invoiceId == null ? (
          ''
        ) : (
          <div
            className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`${APP_PATH}invoice/${invoiceId}`)}
          >
            {invoiceId}
          </div>
        )
    },
    { title: 'Payment Id', dataIndex: 'paymentId', key: 'paymentId' }
  ]

  return (
    <>
      <Divider orientation="left" style={{ margin: '16px 0' }}>
        Subscription and Add-on History
      </Divider>

      {loadignProducts ? (
        <Spin
          indicator={<LoadingOutlined spin />}
          size="large"
          style={{
            width: '100%',
            height: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      ) : (
        <Table
          columns={getColumns()}
          dataSource={subHistory}
          rowKey={'uniqueId'}
          rowClassName="clickable-tbl-row"
          pagination={false}
          scroll={{ x: 1280 }}
          onRow={() => {
            return {
              onClick: () => {}
            }
          }}
          loading={{
            spinning: historyLoading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
        />
      )}
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
          disabled={historyLoading}
          showSizeChanger={false}
        />
      </div>
    </>
  )
}

export default Index
