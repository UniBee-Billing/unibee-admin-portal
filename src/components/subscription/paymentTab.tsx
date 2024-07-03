import {
  Button,
  Col,
  DatePicker,
  Form,
  FormInstance,
  Pagination,
  Row,
  Space,
  Table,
  message
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { ReactElement, useEffect, useState } from 'react'
// import { ISubscriptionType } from "../../shared.types";
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { PAYMENT_STATUS, PAYMENT_TYPE } from '../../constants'
import { formatDate, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import {
  downloadInvoice,
  exportDataReq,
  getPaymentTimelineReq
} from '../../requests'
import '../../shared.css'
import { IProfile, PaymentItem } from '../../shared.types.d'
import { useAppConfigStore } from '../../stores'
import RefundInfoModal from '../payment/refundModal'
import { PaymentStatus } from '../ui/statusTag'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL
const STATUS_FILTER = Object.entries(PAYMENT_STATUS).map((s) => {
  const [value, text] = s
  return { value: Number(value), text }
})
const PAYMENT_TYPE_FILTER = Object.entries(PAYMENT_TYPE).map((s) => {
  const [value, text] = s
  return { value: Number(value), text }
})

type TFilters = {
  status: number[] | null
  timelineTypes: number[] | null
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
    timelineTypes: null
  })
  const pageChange = embeddingMode ? onPageChangeNoParams : onPageChange
  const appConfigStore = useAppConfigStore()
  const [paymentList, setPaymentList] = useState<PaymentItem[]>([])
  const [paymentIdx, setPaymentIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const toggleRefundModal = () => setRefundModalOpen(!refundModalOpen)

  const columns: ColumnsType<PaymentItem> = [
    {
      title: 'Transaction Id',
      dataIndex: 'transactionId',
      key: 'transactionId'
    },
    {
      title: 'External Id',
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
      render: (status) => PaymentStatus(status), // PAYMENT_STATUS[status]
      filters: STATUS_FILTER
    },
    {
      title: 'Type',
      dataIndex: 'timelineType',
      key: 'timelineTypes',
      filters: PAYMENT_TYPE_FILTER,
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
      key: 'gatewayId',
      render: (gateway) =>
        appConfigStore.gateway.find((g) => g.gatewayId == gateway)?.displayName
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (subId) =>
        subId == '' || subId == null ? (
          ''
        ) : (
          <div
            onClick={(e) => navigate(`${APP_PATH}subscription/${subId}`)}
            className=" w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          >
            {subId}
          </div>
        )
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) =>
        ivId == '' || ivId == null ? (
          ''
        ) : (
          <Button
            onClick={() => navigate(`${APP_PATH}invoice/${ivId}`)}
            type="link"
            style={{ padding: 0 }}
          >
            {ivId}
          </Button>
        )
    },
    {
      title: 'User Id',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) =>
        userId == '' || userId == null ? (
          ''
        ) : (
          <div
            onClick={(e) => navigate(`${APP_PATH}user/${userId}`)}
            className=" w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          >
            {userId}
          </div>
        )
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, invoice) => formatDate(d, true)
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
      console.log('search term:  ', searchTerm)
      // return
    }
    if (user != null) {
      searchTerm.userId = user.id as number
    }
    return searchTerm
  }

  const fetchData = async () => {
    let searchTerm = normalizeSearchTerms()
    if (null == searchTerm) {
      return
    }
    searchTerm.page = page
    searchTerm.count = PAGE_SIZE
    searchTerm = { ...searchTerm, ...filters }
    console.log('searchTerm: ', searchTerm)
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

  const onTableChange: TableProps<PaymentItem>['onChange'] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    // onPageChange(1, PAGE_SIZE)
    console.log('table changed params', pagination, filters, sorter, extra)
    setFilters(filters as TFilters)
  }

  useEffect(() => {
    fetchData()
  }, [page, filters, user])

  return (
    <div>
      {refundModalOpen && (
        <RefundInfoModal
          closeModal={toggleRefundModal}
          detail={paymentList[paymentIdx].refund!}
          ignoreAmtFactor={false}
        />
      )}
      {enableSearch && (
        <Search
          form={form}
          goSearch={goSearch}
          searching={loading}
          onPageChange={pageChange}
          normalizeSearchTerms={normalizeSearchTerms}
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
        onRow={(record, rowIndex) => {
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

const Search = ({
  form,
  searching,
  goSearch,
  onPageChange,
  normalizeSearchTerms
}: {
  form: FormInstance<any>
  searching: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
  normalizeSearchTerms: () => any
}) => {
  const appConfig = useAppConfigStore()
  const [exporting, setExporting] = useState(false)
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    goSearch()
  }

  const exportData = async () => {
    const payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }

    console.log('export tx params: ', payload)
    // return
    setExporting(true)
    const [res, err] = await exportDataReq({
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
    appConfig.setTaskListOpen(true)
  }

  return (
    <div>
      <Form form={form} onFinish={goSearch} disabled={searching}>
        <Row className=" mb-3 flex items-center" gutter={[8, 8]}>
          <Col span={4} className=" font-bold text-gray-500">
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
                  validator(rule, value) {
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
      </Form>
    </div>
  )
}
