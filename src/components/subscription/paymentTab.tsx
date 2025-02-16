import {
  Button,
  Col,
  DatePicker,
  Form,
  FormInstance,
  Input,
  Pagination,
  Popover,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  message
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import React, { ReactElement, useEffect, useState } from 'react'
// import { ISubscriptionType } from "../../shared.types";
import {
  InfoCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { CURRENCY, PAYMENT_STATUS, PAYMENT_TYPE } from '../../constants'
import { formatDate, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { exportDataReq, getPaymentTimelineReq } from '../../requests'
import '../../shared.css'
import { IProfile, PaymentItem, PaymentStatus } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import RefundInfoModal from '../payment/refundModal'
import CopyToClipboard from '../ui/copyToClipboard'
import { PaymentStatusTag } from '../ui/statusTag'

const PAGE_SIZE = 10
const STATUS_FILTER = Object.entries(PAYMENT_STATUS).map((s) => {
  const [value, { label }] = s
  return { value: Number(value), text: label }
})
const PAYMENT_TYPE_FILTER = Object.entries(PAYMENT_TYPE).map((s) => {
  const [value, text] = s
  return { value: Number(value), text }
})

type TFilters = {
  status: number[] | null
  timelineTypes: number[] | null
  gatewayIds: number[] | null
}

const Index = ({
  user,
  extraButton,
  embeddingMode,
  enableSearch
}: {
  user?: IProfile | undefined
  extraButton?: ReactElement
  embeddingMode: boolean
  enableSearch?: boolean
}) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const { page, onPageChange, onPageChangeNoParams } = usePagination()
  const [filters, setFilters] = useState<TFilters>({
    status: null,
    timelineTypes: null,
    gatewayIds: null
  })
  const pageChange = embeddingMode ? onPageChangeNoParams : onPageChange
  const appConfigStore = useAppConfigStore()
  const [paymentList, setPaymentList] = useState<PaymentItem[]>([])
  const [paymentIdx, setPaymentIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [total, setTotal] = useState(0)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const toggleRefundModal = () => setRefundModalOpen(!refundModalOpen)

  const GATEWAY_FILTER = appConfigStore.gateway.map((g) => ({
    value: g.gatewayId as number,
    text: g.displayName
  }))

  const fetchData = async () => {
    let searchTerm = normalizeSearchTerms()
    if (null == searchTerm) {
      return
    }
    searchTerm.page = page
    searchTerm.count = PAGE_SIZE
    searchTerm = { ...searchTerm, ...filters }

    setLoading(true)
    const [res, err] = await getPaymentTimelineReq(searchTerm, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { paymentTimeLines, total } = res
    setPaymentList(paymentTimeLines ?? [])
    setTotal(total)
  }
  const goSearch = () => {
    if (page == 0) {
      fetchData()
    } else {
      pageChange(1, PAGE_SIZE)
    }
  }

  const columns: ColumnsType<PaymentItem> = [
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId'
    },
    {
      title: 'External ID',
      dataIndex: 'externalTransactionId',
      key: 'externalTransactionId'
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt, pay) => showAmount(amt, pay.currency)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, pay) => (
        <>
          {PaymentStatusTag(status)}
          {status == PaymentStatus.FAILED && (
            <Popover
              placement="right"
              content={
                <div className="min-w-48 max-w-60">
                  {pay.payment.authorizeReason != '' && (
                    <Row>
                      <Col span={8} className="text-xs text-gray-500">
                        Auth reason:
                      </Col>
                      <Col span={16} className="text-sm">
                        {pay.payment.authorizeReason}
                      </Col>
                    </Row>
                  )}
                  {pay.payment.failureReason != '' && (
                    <Row>
                      <Col span={8} className="text-xs text-gray-500">
                        Other:
                      </Col>
                      <Col span={16} className="text-sm">
                        {pay.payment.failureReason}
                      </Col>
                    </Row>
                  )}
                </div>
              }
            >
              <InfoCircleOutlined />
            </Popover>
          )}
        </>
      ),
      filters: STATUS_FILTER,
      filteredValue: filters.status
    },
    {
      title: 'Type',
      dataIndex: 'timelineType',
      key: 'timelineTypes',
      filters: PAYMENT_TYPE_FILTER,
      filteredValue: filters.timelineTypes,
      render: (s) => {
        const title = PAYMENT_TYPE[s as keyof typeof PAYMENT_TYPE]
        if (s == 1) {
          // refund
          return (
            <Button
              type="link"
              style={{ padding: 0 }}
              className="btn-refunded-payment"
            >
              {title}
            </Button>
          )
        } else if (s == 0) {
          // regular payment
          return title
        }
      }
    },
    {
      title: 'Gateway',
      dataIndex: 'gatewayId',
      key: 'gatewayIds',
      filters: GATEWAY_FILTER,
      filteredValue: filters.gatewayIds,
      render: (gateway) =>
        appConfigStore.gateway.find((g) => g.gatewayId == gateway)?.displayName
    },
    {
      title: 'Subscription ID',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (subId) =>
        subId == '' || subId == null ? (
          ''
        ) : (
          <div
            onClick={() => navigate(`/subscription/${subId}`)}
            className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          >
            {subId}
          </div>
        )
    },
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      width: 184,
      render: (ivId) =>
        ivId == '' || ivId == null ? (
          <MinusOutlined />
        ) : (
          <div className="flex items-center">
            <Button
              onClick={() => navigate(`/invoice/${ivId}`)}
              type="link"
              style={{ padding: 0, fontFamily: 'monospace' }}
            >
              {ivId}
            </Button>
            <CopyToClipboard content={ivId} />
          </div>
        )
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) =>
        userId == '' || userId == null ? (
          ''
        ) : (
          <div
            onClick={() => navigate(`/user/${userId}`)}
            className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          >
            {userId}
          </div>
        )
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => formatDate(d, true)
    },
    {
      title: (
        <Tooltip title="Refresh">
          <Button
            size="small"
            style={{ marginLeft: '8px' }}
            disabled={loading}
            onClick={fetchData}
            icon={<SyncOutlined />}
          />
        </Tooltip>
      ),
      width: 60,
      fixed: 'right',
      key: 'action'
    }
  ]

  const normalizeSearchTerms = () => {
    const searchTerm = JSON.parse(JSON.stringify(form.getFieldsValue()))
    Object.keys(searchTerm).forEach(
      (k) =>
        (searchTerm[k] == undefined ||
          (typeof searchTerm[k] == 'string' && searchTerm[k].trim() == '')) &&
        delete searchTerm[k]
    )

    if (enableSearch) {
      const start = form.getFieldValue('createTimeStart')
      const end = form.getFieldValue('createTimeEnd')
      if (start != null) {
        searchTerm.createTimeStart = start.hour(0).minute(0).second(0).unix()
      }
      if (end != null) {
        searchTerm.createTimeEnd = end.hour(23).minute(59).second(59).unix()
      }

      // return
      let amtFrom = searchTerm.amountStart,
        amtTo = searchTerm.amountEnd
      if (amtFrom != '' && amtFrom != null) {
        amtFrom = Number(amtFrom) * CURRENCY[searchTerm.currency].stripe_factor
        if (isNaN(amtFrom) || amtFrom < 0) {
          message.error('Invalid amount-from value.')
          return null
        }
      }
      if (amtTo != '' && amtTo != null) {
        amtTo = Number(amtTo) * CURRENCY[searchTerm.currency].stripe_factor
        if (isNaN(amtTo) || amtTo < 0) {
          message.error('Invalid amount-to value')
          return null
        }
      }

      if (
        typeof amtFrom == 'number' &&
        typeof amtTo == 'number' &&
        amtFrom > amtTo
      ) {
        message.error('Amount-from must be less than or equal to amount-to')
        return null
      }
      searchTerm.amountStart = amtFrom
      searchTerm.amountEnd = amtTo
    }
    if (user != null) {
      searchTerm.userId = user.id as number
    }
    return searchTerm
  }

  const clearFilters = () =>
    setFilters({ status: null, timelineTypes: null, gatewayIds: null })

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }
    payload = { ...payload, ...filters }

    // return
    setExporting(true)
    const [_, err] = await exportDataReq({
      task: 'TransactionExport',
      payload
    })
    setExporting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(
      'Transaction list is being exported, please check task list for progress.'
    )
    appConfigStore.setTaskListOpen(true)
  }

  const onTableChange: TableProps<PaymentItem>['onChange'] = (
    _pagination,
    filters,
    _sorter,
    _extra
  ) => {
    // onPageChange(1, PAGE_SIZE)

    setFilters(filters as TFilters)
  }

  useEffect(() => {
    fetchData()
  }, [page, filters, user])

  return (
    <div>
      {refundModalOpen && (
        <RefundInfoModal
          originalInvoiceId={paymentList[paymentIdx].payment.invoiceId}
          closeModal={toggleRefundModal}
          detail={paymentList[paymentIdx].refund!}
          ignoreAmtFactor={false}
        />
      )}
      {enableSearch && (
        <Search
          form={form}
          goSearch={goSearch}
          clearFilters={clearFilters}
          searching={loading}
          exporting={exporting}
          exportData={exportData}
          onPageChange={pageChange}
          // normalizeSearchTerms={normalizeSearchTerms}
        />
      )}
      <Table
        columns={
          embeddingMode ? columns.filter((c) => c.key != 'userId') : columns
        }
        dataSource={paymentList}
        onChange={onTableChange}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        scroll={{ x: 1400, y: 640 }}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onRow={(_, rowIndex) => {
          return {
            onClick: (event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('.btn-refunded-payment') != null
              ) {
                setPaymentIdx(rowIndex as number)
                toggleRefundModal()
                return
              }
            }
          }
        }}
      />
      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          size="small"
          onChange={pageChange}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
      <div className="flex items-center justify-center">{extraButton}</div>
    </div>
  )
}

export default Index

const DEFAULT_TERM = {
  currency: 'EUR'
  // status: [],
  // amountStart: '',
  // amountEnd: ''
  // refunded: false,
}
const Search = ({
  form,
  searching,
  exporting,
  exportData,
  goSearch,
  onPageChange,
  clearFilters
}: {
  form: FormInstance<unknown>
  searching: boolean
  exporting: boolean
  exportData: () => void
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
  clearFilters: () => void
}) => {
  const appStore = useAppConfigStore()
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    clearFilters()
  }

  const currencySymbol =
    CURRENCY[form.getFieldValue('currency') || DEFAULT_TERM.currency].symbol

  return (
    <div>
      <Form
        form={form}
        onFinish={goSearch}
        disabled={searching}
        initialValues={DEFAULT_TERM}
        className="my-4"
      >
        <Row className="mb-3 flex items-center" gutter={[8, 8]}>
          <Col span={4} className="font-bold text-gray-500">
            Transaction created
          </Col>
          <Col span={4}>
            <Form.Item name="createTimeStart" noStyle={true}>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="From"
                format="YYYY-MMM-DD"
                disabledDate={(d) => d.isAfter(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              name="createTimeEnd"
              noStyle={true}
              rules={[
                {
                  required: false,
                  message: 'Must be later than start date.'
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const start = getFieldValue('createTimeStart')
                    if (null == start || value == null) {
                      return Promise.resolve()
                    }
                    return value.isAfter(start)
                      ? Promise.resolve()
                      : Promise.reject('Must be later than start date')
                  }
                })
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="To"
                format="YYYY-MMM-DD"
                disabledDate={(d) => d.isAfter(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={12} className="flex justify-end">
            <Space>
              <Button onClick={clear} disabled={searching}>
                Clear
              </Button>
              <Button
                onClick={form.submit}
                type="primary"
                loading={searching}
                disabled={searching}
              >
                Search
              </Button>
              <Button
                onClick={exportData}
                loading={exporting}
                disabled={searching || exporting}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4} className="font-bold text-gray-500">
            <div className="flex items-center">
              <span className="mr-2">Amount</span>
              <Form.Item name="currency" noStyle={true}>
                <Select
                  style={{ width: 80 }}
                  options={appStore.supportCurrency.map((c) => ({
                    label: c.Currency,
                    value: c.Currency
                  }))}
                />
              </Form.Item>
            </div>
          </Col>
          <Col span={4}>
            <Form.Item name="amountStart" noStyle={true}>
              <Input
                prefix={`from ${currencySymbol}`}
                onPressEnter={form.submit}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="amountEnd" noStyle={true}>
              <Input
                prefix={`to ${currencySymbol}`}
                onPressEnter={form.submit}
              />
            </Form.Item>
          </Col>
          {/* <Col span={11} className=" ml-4 font-bold text-gray-500">
            <span className="mr-2">Status</span>
            <Form.Item name="status" noStyle={true}>
              <Select
                mode="multiple"
                options={statusOpt}
                style={{ maxWidth: 420, minWidth: 120, margin: '8px 0' }}
              />
            </Form.Item>
          </Col> */}
        </Row>
      </Form>
    </div>
  )
}
