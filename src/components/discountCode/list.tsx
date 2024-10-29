import {
  EditOutlined,
  ExportOutlined,
  LoadingOutlined,
  PlusOutlined,
  ProfileOutlined,
  SyncOutlined
} from '@ant-design/icons'
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
  Tooltip,
  message
} from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DISCOUNT_CODE_BILLING_TYPE,
  DISCOUNT_CODE_STATUS,
  DISCOUNT_CODE_TYPE
} from '../../constants'
import { formatDate, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { exportDataReq, getDiscountCodeListReq } from '../../requests'
import '../../shared.css'
import { DiscountCode } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import { DiscountCodeStatus } from '../ui/statusTag'

const PAGE_SIZE = 10

const CODE_STATUS_FILTER = Object.entries(DISCOUNT_CODE_STATUS).map((s) => {
  const [value, text] = s
  return { value: Number(value), text }
})
const BILLING_TYPE_FILTER = Object.entries(DISCOUNT_CODE_BILLING_TYPE).map(
  (s) => {
    const [value, text] = s
    return { value: Number(value), text }
  }
)
const DISCOUNT_TYPE_FILTER = Object.entries(DISCOUNT_CODE_TYPE).map((s) => {
  const [value, text] = s
  return { value: Number(value), text }
})

type TFilters = {
  status: number[] | null
  billingType: number[] | null
  discountType: number[] | null
}

const Index = () => {
  const appConfig = useAppConfigStore()
  const [form] = Form.useForm()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<TFilters>({
    status: null,
    billingType: null,
    discountType: null
  })
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [codeList, setCodeList] = useState<DiscountCode[]>([])

  const onNewCode = () => {
    onPageChange(1, 100)
    navigate(`/discount-code/new`)
  }
  const fetchData = async () => {
    const searchTerm = normalizeSearchTerms()
    setLoading(true)
    const [res, err] = await getDiscountCodeListReq(
      { page, count: PAGE_SIZE, ...searchTerm, ...filters },
      fetchData
    )

    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { discounts, total } = res
    setCodeList(discounts ?? [])
    setTotal(total)
  }

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }
    payload = { ...payload, ...filters }

    // return
    setExporting(true)
    const [_, err] = await exportDataReq({
      task: 'DiscountExport',
      payload
    })
    setExporting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(
      'Discount code list is being exported, please check task list for progress.'
    )
    appConfig.setTaskListOpen(true)
  }

  const columns: ColumnsType<DiscountCode> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code'
      // render: (text) => <a>{text}</a>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => DiscountCodeStatus(s), // STATUS[s]
      filters: CODE_STATUS_FILTER,
      filteredValue: filters.status
    },
    {
      title: 'Billing Type',
      dataIndex: 'billingType',
      key: 'billingType',
      render: (s) => DISCOUNT_CODE_BILLING_TYPE[s],
      filters: BILLING_TYPE_FILTER,
      filteredValue: filters.billingType
    },
    {
      title: 'Discount Type',
      dataIndex: 'discountType',
      key: 'discountType',
      render: (s) => DISCOUNT_CODE_TYPE[s],
      filters: DISCOUNT_TYPE_FILTER,
      filteredValue: filters.discountType
    },
    {
      title: 'Amount',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (amt, code) =>
        code.discountType == 1 ? '' : showAmount(amt, code.currency)
    },
    {
      title: 'Percentage',
      dataIndex: 'discountPercentage',
      key: 'discountPercentage',
      render: (percent, code) =>
        code.discountType == 1 ? `${percent / 100} %` : ''
    },
    {
      title: 'Cycle Limit',
      dataIndex: 'cycleLimit',
      key: 'cycleLimit',
      render: (lim, code) => {
        if (code.billingType == 1) {
          // one-time use
          return '1'
        } else if (code.billingType == 2) {
          // recurring
          return lim === 0 ? 'Unlimited' : lim
        } else {
          return lim
        }
      }
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (createTime) => formatDate(createTime)
    },
    {
      title: 'Validity Range',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (start, code) =>
        dayjs(start * 1000).format('YYYY-MMM-DD') +
        ' ~ ' +
        dayjs(code.endTime * 1000).format('YYYY-MMM-DD')
    },
    {
      title: (
        <>
          <span></span>
          <Tooltip title="New discount code">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              onClick={onNewCode}
              icon={<PlusOutlined />}
            />
          </Tooltip>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchData}
              icon={<SyncOutlined />}
            />
          </Tooltip>
          <Tooltip title="Export">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading || exporting}
              onClick={exportData}
              loading={exporting}
              icon={<ExportOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      width: 128,
      key: 'action',
      render: (_) => (
        <Space size="middle" className="code-action-btn-wrapper">
          <Tooltip title="Edit">
            <Button
              // disabled={copyingPlan}
              style={{ border: 'unset' }}
              // onClick={() => goToDetail(record.id)}
              icon={<EditOutlined />}
            />
          </Tooltip>
          <Tooltip title="View usage detail">
            <Button
              className="btn-code-usage-detail"
              style={{ border: 'unset' }}
              icon={<ProfileOutlined />}
            />
          </Tooltip>
        </Space>
      )
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
    const start = form.getFieldValue('createTimeStart')
    const end = form.getFieldValue('createTimeEnd')
    if (start != null) {
      searchTerm.createTimeStart = start.hour(0).minute(0).second(0).unix()
    }
    if (end != null) {
      searchTerm.createTimeEnd = end.hour(23).minute(59).second(59).unix()
    }
    return searchTerm
  }

  const clearFilters = () =>
    setFilters({ status: null, billingType: null, discountType: null })

  const goSearch = () => {
    if (page == 0) {
      fetchData()
    } else {
      onPageChange(1, PAGE_SIZE)
    }
  }

  const onTableChange: TableProps<DiscountCode>['onChange'] = (
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
  }, [filters, page])

  return (
    <div>
      <Search
        form={form}
        goSearch={goSearch}
        searching={loading}
        exporting={exporting}
        onPageChange={onPageChange}
        clearFilters={clearFilters}
      />
      <div className="mb-4"></div>
      <Table
        columns={columns}
        dataSource={codeList}
        onChange={onTableChange}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onRow={(code, rowIndex) => {
          return {
            onClick: (evt) => {
              const tgt = evt.target
              if (
                tgt instanceof Element &&
                tgt.closest('.btn-code-usage-detail')
              ) {
                navigate(`/discount-code/${code.id}/usage-detail`)
                return
              }
              navigate(`/discount-code/${code.id}`, {
                state: codeList[rowIndex as number]
              })
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
          disabled={loading}
          showSizeChanger={false}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
        />
      </div>
    </div>
  )
}

export default Index

const Search = ({
  form,
  searching,
  exporting,
  goSearch,
  onPageChange,
  clearFilters
}: {
  form: FormInstance<unknown>
  searching: boolean
  exporting: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
  clearFilters: () => void
}) => {
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    clearFilters()
  }

  return (
    <div>
      <Form form={form} onFinish={goSearch} disabled={searching || exporting}>
        <Row className="mb-3 flex items-center" gutter={[8, 8]}>
          <Col span={3} className="font-bold text-gray-500">
            Code created
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
              <Button onClick={clear} disabled={searching || exporting}>
                Clear
              </Button>
              <Button
                onClick={form.submit}
                type="primary"
                loading={searching}
                disabled={searching || exporting}
              >
                Search
              </Button>
              {/* <Button
                onClick={exportData}
                loading={exporting}
                disabled={searching || exporting}
              >
                Export
              </Button> */}
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
