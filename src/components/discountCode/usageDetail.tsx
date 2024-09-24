import { LoadingOutlined } from '@ant-design/icons'
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
import { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDate, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { exportDataReq, getDiscountCodeUsageDetailReq } from '../../requests'
import { DiscountCodeUsage } from '../../shared.types'
import { useAppConfigStore } from '../../stores'

const APP_PATH = import.meta.env.BASE_URL // if not specified in build command, default is /
const PAGE_SIZE = 10

const Index = () => {
  const params = useParams()
  const codeId = params.discountCodeId
  const [form] = Form.useForm()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [usageDetailList, setUsageDetailList] = useState<DiscountCodeUsage[]>(
    []
  )

  const goBack = () => navigate(`${APP_PATH}discount-code/list`)

  console.log('codeId: ', codeId)

  const columns: ColumnsType<DiscountCodeUsage> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code'
    },
    {
      title: 'Applied plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan) => (
        <div
          onClick={() => navigate(`${APP_PATH}plan/${plan.id}`)}
          className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
        >
          {plan.planName}
        </div>
      )
    },
    {
      title: 'Applied Amt',
      dataIndex: 'applyAmount',
      key: 'applyAmount',
      render: (amt, code_detail) => showAmount(amt, code_detail.currency)
    },
    {
      title: 'Used by',
      dataIndex: 'user',
      key: 'user',
      render: (user) =>
        user == null ? (
          ''
        ) : (
          <div
            onClick={() => navigate(`${APP_PATH}user/${user.id}`)}
            className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          >
            {`${user.firstName} ${user.lastName}`}
          </div>
        )
    },
    {
      title: 'Used at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (usedAt) => formatDate(usedAt, true)
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
            onClick={() => navigate(`${APP_PATH}subscription/${subId}`)}
            className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
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
      title: 'Transaction Id',
      dataIndex: 'paymentId',
      key: 'paymentId'
      // render: (plan, code_detail) => plan.planName
    }
  ]

  const normalizeSearchTerms = () => {
    let searchTerm: any = {}
    searchTerm = form.getFieldsValue()
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

  const fetchData = async () => {
    const id = Number(codeId)
    if (isNaN(id)) {
      message.error('Invalid code Id')
      return
    }
    const searchTerms = normalizeSearchTerms()
    setLoading(true)
    const [res, err] = await getDiscountCodeUsageDetailReq({
      id,
      page,
      count: PAGE_SIZE,
      searchTerms,
      refreshCb: fetchData
    })
    console.log('code usage detail list: ', res)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { userDiscounts, total } = res
    setUsageDetailList(userDiscounts ?? [])
    setTotal(total)
  }

  const goSearch = () => {
    if (page == 0) {
      fetchData()
    } else {
      onPageChange(1, PAGE_SIZE)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <div>
      <Search
        form={form}
        onPageChange={onPageChange}
        searching={loading}
        goSearch={goSearch}
        normalizeSearchTerms={normalizeSearchTerms}
      />
      <Table
        columns={columns}
        dataSource={usageDetailList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onRow={() => {
          return {
            onClick: () => {}
          }
        }}
      />
      <div className="mx-0 my-4 flex w-full items-center justify-end">
        <div className="flex w-2/4 justify-end">
          <div className="flex w-full justify-between">
            <Button onClick={goBack}>Go back</Button>
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
      </div>
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
  const params = useParams()
  const codeId = params.discountCodeId
  const [exporting, setExporting] = useState(false)
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    goSearch()
  }

  const exportData = async () => {
    const id = Number(codeId)
    if (isNaN(id)) {
      message.error('Invalid code Id')
      return
    }
    const payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }
    payload.id = id
    console.log('export tx params: ', payload)
    // return
    setExporting(true)
    const [res, err] = await exportDataReq({
      task: 'UserDiscountExport',
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

  return (
    <div>
      <Form form={form} onFinish={goSearch} disabled={searching || exporting}>
        <Row className="mb-5 flex items-center" gutter={[8, 8]}>
          <Col span={2} className="font-bold text-gray-500">
            Code used
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
                  validator(value) {
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
          <Col span={14} className="flex justify-end">
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
