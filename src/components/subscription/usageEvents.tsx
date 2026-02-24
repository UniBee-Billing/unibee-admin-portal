import { exportDataReq, getMetricEventListReq } from '@/requests'
import { useAppConfigStore } from '@/stores'
import { DownloadOutlined, LeftOutlined } from '@ant-design/icons'
import { Button, message, Pagination, Select, Spin, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Charge status enum
enum ChargeStatus {
  CHARGED = 1,
  PENDING = 2,
  FAILED = 3
}

const CHARGE_STATUS_CONFIG: Record<number, { label: string; color: string }> = {
  [ChargeStatus.CHARGED]: { label: 'Charged', color: 'success' },
  [ChargeStatus.PENDING]: { label: 'Pending', color: 'warning' },
  [ChargeStatus.FAILED]: { label: 'Failed', color: 'error' }
}

interface UsageEvent {
  key: string
  externalEventId: string
  aggregationPropertyInt: number
  aggregationPropertyData: string
  createTime: number
  periodStart: number
  periodEnd: number
  metricLimit: number
  used: number
  chargeInvoiceId: string
  chargeStatus: number
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const UsageEvents = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const appConfigStore = useAppConfigStore()

  // Get params from URL
  const subscriptionId = searchParams.get('subscriptionId') || ''
  const metricId = searchParams.get('metricId') || ''
  const metricName = searchParams.get('metricName') || ''
  const metricCode = searchParams.get('metricCode') || ''
  const invoiceId = searchParams.get('invoiceId') || ''

  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [events, setEvents] = useState<UsageEvent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Fetch usage events
  const fetchEvents = async () => {
    if (!subscriptionId || !metricId) return

    setLoading(true)
    const [res, err] = await getMetricEventListReq({
      metricIds: [Number(metricId)],
      subscriptionIds: [subscriptionId],
      invoiceId: invoiceId || undefined,
      page: page - 1,
      count: pageSize
    })
    setLoading(false)

    if (err) {
      message.error(err.message)
      return
    }

    if (res?.events) {
      const mappedEvents: UsageEvent[] = res.events.map((evt: any) => ({
        key: evt.id || evt.externalEventId,
        externalEventId: evt.externalEventId || '',
        aggregationPropertyInt: evt.aggregationPropertyInt || 0,
        aggregationPropertyData: evt.aggregationPropertyData || '',
        createTime: evt.createTime || 0,
        periodStart: evt.subscriptionPeriodStart || 0,
        periodEnd: evt.subscriptionPeriodEnd || 0,
        metricLimit: evt.metricLimit || 0,
        used: evt.used || 0,
        chargeInvoiceId: evt.chargeInvoiceId || '',
        chargeStatus: evt.chargeStatus || 0
      }))
      setEvents(mappedEvents)
      setTotal(res.total || 0)
    } else {
      setEvents([])
      setTotal(0)
    }
  }

  // Export records using backend API
  const onExport = async () => {
    if (!subscriptionId || !metricId) {
      message.error('Missing subscription or metric information')
      return
    }

    setExporting(true)
    const [_, err] = await exportDataReq({
      task: 'MetricEventExport',
      payload: {
        subscriptionIds: [subscriptionId],
        metricIds: [Number(metricId)],
        invoiceId: invoiceId || undefined
      },
      format: 'csv'
    })
    setExporting(false)

    if (err) {
      message.error(err.message)
      return
    }

    message.success('Export task created, please check task list for progress.')
    appConfigStore.setTaskListOpen(true)
  }

  // Page change handler
  const onPageChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage)
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize)
    }
  }

  // Go back to subscription detail
  const goBack = () => {
    navigate(`/subscription/${subscriptionId}`)
  }

  useEffect(() => {
    if (subscriptionId && metricId) {
      fetchEvents()
    }
  }, [subscriptionId, metricId, page, pageSize])

  // Table columns
  const columns: ColumnsType<UsageEvent> = [
    {
      title: 'External Event ID',
      dataIndex: 'externalEventId',
      key: 'externalEventId',
      ellipsis: { showTitle: false },
      render: (id: string) => (
        <Tooltip title={id}>
          <a className="text-blue-600 hover:text-blue-800">{id}</a>
        </Tooltip>
      )
    },
    {
      title: <Tooltip title="Aggregation Property Int">Aggregation Int</Tooltip>,
      dataIndex: 'aggregationPropertyInt',
      key: 'aggregationPropertyInt',
      width: 110,
      render: (val: number) => val.toLocaleString()
    },
    {
      title: <Tooltip title="Aggregation Property Data">Aggregation Data</Tooltip>,
      dataIndex: 'aggregationPropertyData',
      key: 'aggregationPropertyData',
      ellipsis: { showTitle: false },
      render: (data: string) => (
        <Tooltip title={data}>
          <span className="text-gray-600">{data}</span>
        </Tooltip>
      )
    },
    {
      title: 'Create Time',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 110,
      render: (time: number) => (
        <span>{dayjs(time * 1000).format('YYYY-MMM-DD')}</span>
      )
    },
    {
      title: 'Period Start',
      dataIndex: 'periodStart',
      key: 'periodStart',
      width: 110,
      render: (time: number) => time ? dayjs(time * 1000).format('YYYY-MMM-DD') : '-'
    },
    {
      title: 'Period End',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      width: 110,
      render: (time: number) => time ? dayjs(time * 1000).format('YYYY-MMM-DD') : '-'
    },
    {
      title: <Tooltip title="Metric Limit">Metric Limit</Tooltip>,
      dataIndex: 'metricLimit',
      key: 'metricLimit',
      width: 100,
      render: (val: number) => val ? val.toLocaleString() : '-'
    },
    {
      title: 'Used',
      dataIndex: 'used',
      key: 'used',
      width: 70,
      render: (val: number) => val ? val.toLocaleString() : '-'
    },
    {
      title: <Tooltip title="Charge Invoice ID">Charge Invoice ID</Tooltip>,
      dataIndex: 'chargeInvoiceId',
      key: 'chargeInvoiceId',
      ellipsis: { showTitle: false },
      render: (id: string) => id ? (
        <Tooltip title={id}>
          <a className="text-blue-600 hover:text-blue-800">{id}</a>
        </Tooltip>
      ) : '-'
    },
    {
      title: <Tooltip title="Charge Status">Charge Status</Tooltip>,
      dataIndex: 'chargeStatus',
      key: 'chargeStatus',
      width: 120,
      render: (status: number) => {
        const config = CHARGE_STATUS_CONFIG[status]
        return config ? (
          <Tag color={config.color}>{config.label}</Tag>
        ) : '-'
      }
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Row: Back Link + Title + Buttons */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          {/* Back Link */}
          <div
            className="mb-2 flex cursor-pointer items-center text-gray-500 hover:text-gray-700"
            onClick={goBack}
          >
            <LeftOutlined className="mr-1" />
            <span>Back to Usage Metrics</span>
          </div>
          {/* Page Title */}
          <h1 className="text-xl font-semibold">Usage Events</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button onClick={goBack}>Back</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={onExport}
            loading={exporting}
          >
            Export Records
          </Button>
        </div>
      </div>

      {/* Content Card */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        {/* Records Header */}
        <div className="mb-4">
          <h3 className="mb-3 font-semibold">Records</h3>
          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-gray-500">Metric ID: </span>
              <span>{metricId}</span>
            </div>
            <div>
              <span className="text-gray-500">Metric Name: </span>
              <span>{metricName}</span>
            </div>
            <div>
              <span className="text-gray-500">Metric Code: </span>
              <span>{metricCode}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Records: </span>
              <span>{total}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={events}
            pagination={false}
            size="middle"
            bordered
          />
        </Spin>

        {/* Pagination Row */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <Select
              value={pageSize}
              onChange={(val) => onPageChange(1, val)}
              options={PAGE_SIZE_OPTIONS.map((size) => ({
                value: size,
                label: `${size}`
              }))}
              style={{ width: 70 }}
            />
            <span className="text-gray-500">rows per page</span>
          </div>

          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={onPageChange}
            showSizeChanger={false}
            showTotal={(t, range) => `${range[0]}-${range[1]} of ${t}`}
            simple={false}
          />
        </div>
      </div>
    </div>
  )
}

export default UsageEvents
