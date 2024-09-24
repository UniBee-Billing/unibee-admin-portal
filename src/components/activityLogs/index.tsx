import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  FormInstance,
  Input,
  Pagination,
  Row,
  Table,
  message
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActivityLogsReq } from '../../requests'
import { TActivityLogs } from '../../shared.types.d'

import { formatDate } from '../../helpers'
import { usePagination } from '../../hooks'
import '../../shared.css'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [total, setTotal] = useState(0)
  const { page, onPageChange } = usePagination()
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<TActivityLogs[]>([])

  const fetchLogs = async () => {
    const searchTerms = JSON.parse(JSON.stringify(form.getFieldsValue()))
    Object.keys(searchTerms).forEach(
      (k) =>
        (searchTerms[k] == undefined || searchTerms[k].trim() == '') &&
        delete searchTerms[k]
    )
    console.log('search term: ', searchTerms)
    // return
    const params = { page, count: PAGE_SIZE, ...searchTerms }
    setLoading(true)
    const [res, err] = await getActivityLogsReq(params, fetchLogs)
    setLoading(false)
    if (err != null) {
      message.error((err as Error).message)
      return
    }
    const { merchantOperationLogs, total } = res
    setLogs(merchantOperationLogs ?? [])
    setTotal(total)
  }

  const columns: ColumnsType<TActivityLogs> = [
    {
      title: 'By',
      dataIndex: 'optAccount',
      fixed: 'left',
      key: 'optAccount'
      // render: (m, _) => `${m.firstName} ${m.lastName} (${m.email})`
    },
    {
      title: 'Target',
      dataIndex: 'optTarget',
      key: 'optTarget'
      // render: (text) => <a>{text}</a>,
    },
    {
      title: 'Content',
      dataIndex: 'optContent',
      key: 'optContent'
    },
    {
      title: 'User Id',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) =>
        userId == 0 ? (
          '―'
        ) : (
          <Button
            type="link"
            onClick={() => navigate(`${APP_PATH}user/${userId}`)}
            className="log-key-info-id"
            style={{ padding: 0 }}
          >
            {userId}
          </Button>
        )
    },
    {
      title: 'Time',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => formatDate(d, true) // dayjs(d * 1000).format('YYYY-MMM-DD, HH:MM:ss')
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (invoiceId) =>
        invoiceId == '' ? (
          '―'
        ) : (
          <Button
            onClick={() => navigate(`${APP_PATH}invoice/${invoiceId}`)}
            type="link"
            className="log-key-info-id"
            style={{ padding: 0 }}
          >
            {invoiceId}
          </Button>
        )
    },
    {
      title: 'Plan Id',
      dataIndex: 'planId',
      key: 'planId',
      render: (planId) =>
        planId == '' ? (
          '―'
        ) : (
          <Button
            onClick={() => navigate(`${APP_PATH}plan/${planId}`)}
            type="link"
            className="log-key-info-id"
            style={{ padding: 0 }}
          >
            {planId}
          </Button>
        )
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      width: 200,
      render: (subId) =>
        subId == '' ? (
          '―'
        ) : (
          <Button
            onClick={() => navigate(`${APP_PATH}subscription/${subId}`)}
            type="link"
            className="log-key-info-id"
            style={{
              padding: 0,
              width: '160px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {subId}
          </Button>
        )
    }
  ]

  const onTableChange: TableProps<TActivityLogs>['onChange'] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    console.log('params', pagination, filters, sorter, extra)
    if (filters.status == null) {
      return
    }
    // setStatusFilter(filters.status as number[]);
  }

  useEffect(() => {
    fetchLogs()
  }, [page])

  const goSearch = () => {
    if (page == 0) {
      fetchLogs()
    } else {
      onPageChange(1, PAGE_SIZE)
    }
  }

  return (
    <>
      <Search
        form={form}
        searching={loading}
        onPageChange={onPageChange}
        goSearch={goSearch}
      />
      <div className="h-4"></div>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        scroll={{ x: 1680 }}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onChange={onTableChange}
        onRow={() => {
          return {
            onClick: (event) => {
              const tgt = event.target
              // navigate(`${APP_PATH}billable-metric/${record.id}`)
              if (
                tgt instanceof HTMLElement &&
                tgt.classList.contains('log-key-info-id')
              ) {
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
          size="small"
          onChange={onPageChange}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </>
  )
}

export default Index

const DEFAULT_TERM = {
  currency: 'EUR',
  status: [],
  amountStart: '',
  amountEnd: ''
  // refunded: false,
}
const Search = ({
  form,
  searching,
  goSearch,
  onPageChange
}: {
  form: FormInstance<any>
  searching: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
}) => {
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    goSearch()
  }

  return (
    <div>
      <Form form={form} initialValues={DEFAULT_TERM} disabled={searching}>
        <Row className="my-2 flex items-center" gutter={[8, 8]}>
          <Col span={2} className="font-bold text-gray-600">
            Billing admin
          </Col>
          <Col span={4}>
            <Form.Item name="memberFirstName" noStyle={true}>
              <Input
                onPressEnter={goSearch}
                style={{ width: '100%' }}
                placeholder="First name"
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="memberLastName" noStyle={true}>
              <Input
                onPressEnter={goSearch}
                style={{ width: '100%' }}
                placeholder="Last name"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="memberEmail" noStyle={true}>
              <Input
                onPressEnter={goSearch}
                style={{ width: '100%' }}
                placeholder="Email"
              />
            </Form.Item>
          </Col>

          <Col span={8} className="flex justify-end">
            <Button onClick={clear} disabled={searching}>
              Clear
            </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              onClick={goSearch}
              type="primary"
              loading={searching}
              disabled={searching}
            >
              Search
            </Button>
          </Col>
        </Row>

        <Row className="my-2 flex items-center" gutter={[8, 8]}>
          <Col span={2} className="font-bold text-gray-600">
            User
          </Col>
          <Col span={4}>
            <Form.Item name="firstName" noStyle={true}>
              <Input
                onPressEnter={goSearch}
                style={{ width: '100%' }}
                placeholder="First name"
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="lastName" noStyle={true}>
              <Input
                onPressEnter={goSearch}
                style={{ width: '100%' }}
                placeholder="Last name"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="email" noStyle={true}>
              <Input
                onPressEnter={goSearch}
                style={{ width: '100%' }}
                placeholder="Email"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row className="my-2 flex items-center" gutter={[8, 8]}>
          <Col span={2} className="font-bold text-gray-600">
            Subscription Id{' '}
          </Col>
          <Col span={4}>
            <Form.Item name="subscriptionId" noStyle={true}>
              <Input onPressEnter={goSearch} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={2} className="text-right font-bold text-gray-600">
            Invoice Id
          </Col>
          <Col span={4}>
            <Form.Item name="invoiceId" noStyle={true}>
              <Input onPressEnter={goSearch} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={2} className="text-right font-bold text-gray-600">
            Plan Id
          </Col>
          <Col span={4}>
            <Form.Item name="planId" noStyle={true}>
              <Input onPressEnter={goSearch} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={3} className="text-right font-bold text-gray-600">
            Discount code
          </Col>
          <Col span={3}>
            <Form.Item name="discountCode" noStyle={true}>
              <Input onPressEnter={goSearch} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
