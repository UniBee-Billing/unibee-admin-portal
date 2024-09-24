import { LoadingOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Pagination, Space, Table, Tooltip, message } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IBillableMetrics } from '../../@types/shared.types'
import { METRICS_AGGREGATE_TYPE, METRICS_TYPE } from '../../constants'
import { getMetricsListReq } from '../../requests'

import { formatDate } from '../../helpers'
import { usePagination } from '../../hooks'
import '../../shared.css'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const navigate = useNavigate()
  const [total, setTotal] = useState(0)
  const { page, onPageChange } = usePagination()
  const [loading, setLoading] = useState(false)
  const [metricsList, setMetricsList] = useState<IBillableMetrics[]>([])

  const fetchMetricsList = async () => {
    setLoading(true)
    const [res, err] = await getMetricsListReq(fetchMetricsList)
    setLoading(false)
    if (err != null) {
      message.error((err as Error).message)
      return
    }
    const { merchantMetrics, total } = res
    setMetricsList(merchantMetrics ?? [])
    setTotal(total)
  }

  const onNewMetrics = () => {
    onPageChange(1, 100)
    // setPage(0) // if user are on page 3, after creating new plan, they'll be redirected back to page 1,so the newly created plan will be shown on the top
    navigate(`${APP_PATH}billable-metric/new`)
  }

  const columns: ColumnsType<IBillableMetrics> = [
    {
      title: 'Name',
      dataIndex: 'metricName',
      key: 'metricName'
      // render: (text) => <a>{text}</a>,
    },

    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code'
    },
    {
      title: 'Description',
      dataIndex: 'metricDescription',
      key: 'metricDescription'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t) => {
        return <span>{METRICS_TYPE[t]}</span>
      }
    },
    {
      title: 'Aggregation Type',
      dataIndex: 'aggregationType',
      key: 'aggregationType',
      render: (aggreType) => {
        return <span>{METRICS_AGGREGATE_TYPE[aggreType]}</span>
      }
    },
    {
      title: 'Aggregation Property',
      dataIndex: 'aggregationProperty',
      key: 'aggregationProperty',
      render: (prop) => <span>{prop}</span>
      // filters: PLAN_STATUS_FILTER,
      // onFilter: (value, record) => record.status == value,
    },
    {
      title: 'Updated at',
      dataIndex: 'gmtModify',
      key: 'gmtModify',
      render: (d) => formatDate(d, true) // dayjs(d * 1000).format('YYYY-MMM-DD, HH:MM:ss')
    },
    {
      title: (
        <>
          <span>Actions</span>
          <Tooltip title="New billable metric">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              onClick={onNewMetrics}
              icon={<PlusOutlined />}
            ></Button>
          </Tooltip>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchMetricsList}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      key: 'action',
      width: 150,
      render: (_) => (
        <Space size="middle">
          <a>Edit</a>
        </Space>
      )
    }
  ]

  const onTableChange: TableProps<IBillableMetrics>['onChange'] = (
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
    fetchMetricsList()
  }, [page])

  return (
    <>
      {/* <div
        style={{ padding: '16px 0', display: 'flex', justifyContent: 'end' }}
      >
        <Button type="primary" onClick={onNewMetrics}>
          New Billable Metric
        </Button>
  </div> */}
      <Table
        columns={columns}
        dataSource={metricsList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onChange={onTableChange}
        onRow={(record, rowIndex) => {
          return {
            onClick: () => {
              console.log('row click: ', record, '///', rowIndex)
              navigate(`${APP_PATH}billable-metric/${record.id}`)
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
