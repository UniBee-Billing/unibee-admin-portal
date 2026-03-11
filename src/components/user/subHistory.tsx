import { formatDate, showAmount } from '@/helpers'
import { usePagination } from '@/hooks'
import { useAppConfigStore } from '@/stores'
import {
  getMrrAdjustmentReq,
  getProductListReq,
  getSubscriptionHistoryReq,
  TMrrAdjustmentItem,
  updateMrrAdjustmentReq
} from '@/requests'
import { IProduct, ISubAddon, ISubHistoryItem } from '@/shared.types'
import { EditOutlined, LoadingOutlined, CloseOutlined } from '@ant-design/icons'
import {
  Col,
  Divider,
  InputNumber,
  message,
  Modal,
  Pagination,
  Popover,
  Row,
  Spin,
  Table,
  Tooltip
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LongTextPopover from '../ui/longTextPopover'
import { SubHistoryStatus } from '../ui/statusTag'

const PAGE_SIZE = 10

const Index = ({ userId }: { userId: number }) => {
  const navigate = useNavigate()
  const [historyLoading, setHistoryLoading] = useState(false)
  const { page, onPageChangeNoParams } = usePagination()
  const [total, setTotal] = useState(0)
  const [subHistory, setSubHistory] = useState<ISubHistoryItem[]>([])
  const [productList, setProductList] = useState<IProduct[]>([])
  const [loadignProducts, setLoadingProducts] = useState(false)

  // MRR Adjustment state
  const [mrrAdjMap, setMrrAdjMap] = useState<
    Map<string, TMrrAdjustmentItem>
  >(new Map())
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<number | null>(null)
  const [savingMrr, setSavingMrr] = useState(false)
  const originalValueRef = useRef<number | null>(null)
  const inputBlurIsFromCloseBtn = useRef(false)
  const enterKeyPressed = useRef(false)

  const getSubHistory = async () => {
    setHistoryLoading(true)
    const [res, err] = await getSubscriptionHistoryReq({
      page,
      count: PAGE_SIZE,
      userId,
      refreshCb: getSubHistory
    })
    setHistoryLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    const { subscriptionTimeLines, total } = res
    setSubHistory(subscriptionTimeLines ?? [])
    setTotal(total)

    // Fetch MRR adjustments for the loaded invoices
    const invoiceIds = (subscriptionTimeLines ?? [])
      .map((item: ISubHistoryItem) => item.invoiceId)
      .filter((id: string) => id != null && id !== '')
    if (invoiceIds.length > 0) {
      fetchMrrAdjustments(invoiceIds)
    }
  }

  const fetchMrrAdjustments = async (invoiceList: string[]) => {
    const [res, err] = await getMrrAdjustmentReq({ userId, invoiceList })
    if (err != null) {
      // Silently fail — MRR adjustment is not critical
      return
    }
    const list: TMrrAdjustmentItem[] = res?.subscriptionList ?? []
    const map = new Map<string, TMrrAdjustmentItem>()
    for (const item of list) {
      map.set(item.invoiceId, item)
    }
    setMrrAdjMap(map)
  }

  const getProductList = async () => {
    setLoadingProducts(true)
    const [res, err] = await getProductListReq({ refreshCb: getProductList })
    setLoadingProducts(false)
    if (null != err) {
      return
    }

    setProductList(res.products ?? [])
  }

  const getCurrencyScale = (currency: string | undefined) => {
    if (!currency) return 100
    const CURRENCIES = useAppConfigStore.getState().supportCurrency
    const c = CURRENCIES.find((c) => c.Currency === currency)
    return c?.Scale ?? 100
  }

  const startEditing = (invoiceId: string) => {
    const adj = mrrAdjMap.get(invoiceId)
    const currency = adj?.currency ?? subHistory.find((h) => h.invoiceId === invoiceId)?.plan?.currency ?? subHistory.find((h) => h.invoiceId === invoiceId)?.currency
    const scale = getCurrencyScale(currency)
    const currentValue =
      adj?.mrrAdjustmentAmount != null ? adj.mrrAdjustmentAmount / scale : null
    originalValueRef.current = currentValue
    setEditingInvoiceId(invoiceId)
    setEditingValue(currentValue)
  }

  const cancelEditing = () => {
    setEditingInvoiceId(null)
    setEditingValue(null)
    originalValueRef.current = null
  }

  const saveMrrAdjustment = async (invoiceId: string, value: number | null) => {
    const adj = mrrAdjMap.get(invoiceId)
    const record = subHistory.find((h) => h.invoiceId === invoiceId)
    const currency = adj?.currency ?? record?.plan?.currency ?? record?.currency
    const scale = getCurrencyScale(currency)
    const scaledValue = value != null ? Math.round(value * scale) : null
    setSavingMrr(true)
    const [, err] = await updateMrrAdjustmentReq({
      userId,
      invoiceId,
      periodStart: record?.periodStart,
      originalMrrAmount: adj?.originalMrrAmount ?? 0,
      mrrAdjustmentAmount: scaledValue
    })
    setSavingMrr(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success('MRR Adjustment saved')
    cancelEditing()
    // Refresh MRR adjustments
    const invoiceIds = subHistory
      .map((item) => item.invoiceId)
      .filter((id) => id != null && id !== '')
    if (invoiceIds.length > 0) {
      fetchMrrAdjustments(invoiceIds)
    }
  }

  const handleSaveOrDiscard = (invoiceId: string) => {
    const hasChanged = editingValue !== originalValueRef.current
    if (!hasChanged) {
      cancelEditing()
      return
    }
    const adj = mrrAdjMap.get(invoiceId)
    if (adj?.isDeleted) {
      // Only show confirm modal for deleted data
      Modal.confirm({
        className: 'mrr-confirm-modal',
        title: 'Save changes to this field?',
        content: (
          <span style={{ fontSize: 12, color: '#888' }}>
            Notes: MRR adjustment won't work on canceled subscriptions.
          </span>
        ),
        okText: 'Save',
        cancelText: 'Cancel',
        onOk: () => saveMrrAdjustment(invoiceId, editingValue),
        onCancel: () => {
          cancelEditing()
        }
      })
    } else {
      // Save directly without confirmation
      saveMrrAdjustment(invoiceId, editingValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, invoiceId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      enterKeyPressed.current = true
      handleSaveOrDiscard(invoiceId)
    }
  }

  useEffect(() => {
    getSubHistory()
  }, [page, userId])

  useEffect(() => {
    getProductList()
  }, [])

  const getCurrencySymbol = (currency: string | undefined) => {
    if (!currency) return ''
    return showAmount(0, currency).replace('0', '').trim()
  }

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
          <LongTextPopover
            text={record.plan.planName}
            placement="topLeft"
            width="120px"
            clickHandler={() => navigate(`/plan/${record.plan.id}`)}
          />
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
                  <Row key={addon.addonPlan.id}>
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
            onClick={() => navigate(`/subscription/${subId}`)}
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
            onClick={() => navigate(`/invoice/${invoiceId}`)}
          >
            {invoiceId}
          </div>
        )
    },
    { title: 'Payment Id', dataIndex: 'paymentId', key: 'paymentId' },
    {
      title: 'MRR Adjustment',
      dataIndex: 'invoiceId',
      key: 'mrrAdjustment',
      width: 180,
      render: (invoiceId: string, record) => {
        if (!invoiceId) return '―'

        const adj = mrrAdjMap.get(invoiceId)
        // If GET returned no data for this invoice, disable the cell
        if (!adj) return '―'
        const currency = adj?.currency ?? record.plan?.currency ?? record.currency
        const currencySymbol = getCurrencySymbol(currency)
        const isEditing = editingInvoiceId === invoiceId

        if (isEditing) {
          return (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <InputNumber
                autoFocus
                size="small"
                style={{ width: 120 }}
                prefix={currencySymbol}
                value={editingValue}
                onChange={(val) => setEditingValue(val)}
                onKeyDown={(e) => handleKeyDown(e, invoiceId)}
                onBlur={() => {
                  setTimeout(() => {
                    if (inputBlurIsFromCloseBtn.current) {
                      inputBlurIsFromCloseBtn.current = false
                      return
                    }
                    if (enterKeyPressed.current) {
                      enterKeyPressed.current = false
                      return
                    }
                    handleSaveOrDiscard(invoiceId)
                  }, 150)
                }}
                disabled={savingMrr}
                placeholder="Type in"
              />
              <Tooltip title="Cancel">
                <CloseOutlined
                  style={{
                    fontSize: 12,
                    color: '#999',
                    cursor: 'pointer'
                  }}
                  onMouseDown={() => {
                    inputBlurIsFromCloseBtn.current = true
                  }}
                  onClick={() => cancelEditing()}
                />
              </Tooltip>
            </div>
          )
        }

        const hasValue =
          adj?.mrrAdjustmentAmount != null && adj.mrrAdjustmentAmount !== undefined

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              cursor: 'pointer'
            }}
            onClick={() => startEditing(invoiceId)}
          >
            {hasValue ? (
              <span>
                {showAmount(adj!.mrrAdjustmentAmount!, currency)}
              </span>
            ) : (
              <span
                style={{
                  color: '#bbb',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  padding: '1px 8px',
                  fontSize: 13
                }}
              >
                Type in
              </span>
            )}
            <EditOutlined
              style={{ color: '#1890ff', fontSize: 14 }}
            />
          </div>
        )
      }
    }
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
          scroll={{ x: 1480 }}
          onRow={() => {
            return {
              onClick: () => { }
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
