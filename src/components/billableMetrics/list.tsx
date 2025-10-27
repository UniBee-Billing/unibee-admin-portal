import { METRICS_AGGREGATE_TYPE, METRICS_TYPE } from '@/constants'
import { getMetricsListReq, deleteMetricReq } from '@/requests/index'
import {
  IBillableMetrics,
  MetricAggregationType,
  MetricType
} from '@/shared.types'
import { EditOutlined, DeleteOutlined, PlusOutlined, SyncOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Button, Input, Tag, Tooltip, message, Modal } from 'antd'

const { Search } = Input
import type { ColumnsType, TableProps } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { formatDate } from '@/helpers/index'
import '@/shared.css'
import ResponsiveTable from '../table/responsiveTable'
import './list.css'

const Index = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [metricsList, setMetricsList] = useState<IBillableMetrics[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  const fetchMetricsList = async (overrides?: {
    page?: number;
    pageSize?: number;
    searchKey?: string;
  }) => {
    setLoading(true)
    try {
      const currentPage = overrides?.page !== undefined ? overrides.page : pagination.current - 1
      const currentPageSize = overrides?.pageSize !== undefined ? overrides.pageSize : pagination.pageSize
      const currentSearchKey = overrides?.searchKey !== undefined ? overrides.searchKey : searchText

      const [res, err] = await getMetricsListReq({
        refreshCb: fetchMetricsList,
        page: currentPage,
        count: currentPageSize,
        searchKey: currentSearchKey
      })
      
      if (err != null) {
        message.error((err as Error).message)
        return
      }
      
      const { merchantMetrics, total } = res
      setMetricsList(merchantMetrics ?? [])
      setPagination(prev => ({ ...prev, total }))
    } catch (err) {
      message.error('An error occurred while fetching data')
      console.error('Exception in fetchMetricsList:', err)
    } finally {
      setLoading(false)
    }
  }

  const onNewMetrics = () => {
    navigate(`/billable-metric/new`)
  }

  const handleRefresh = () => {
    fetchMetricsList()
  }

  const handleTableChange: TableProps<IBillableMetrics>['onChange'] = (newPagination) => {
    const newPage = newPagination.current || 1
    const newPageSize = newPagination.pageSize || 20
    
    setPagination(prev => ({
      ...prev,
      current: newPage,
      pageSize: newPageSize,
    }))
    
    fetchMetricsList({
      page: newPage - 1,
      pageSize: newPageSize,
    })
  }

  const handleEdit = (record: IBillableMetrics, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/billable-metric/${record.id}`)
  }

  const handleDelete = (record: IBillableMetrics, e: React.MouseEvent) => {
    e.stopPropagation()
    
    Modal.confirm({
      title: 'Delete Billable Metric',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete this billable metric?</p>
          <p className="mt-2">
            <strong>Name:</strong> {record.metricName}
          </p>
          <p>
            <strong>Code:</strong> {record.code}
          </p>
          <p className="mt-2 text-red-500">This action cannot be undone.</p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const [, error] = await deleteMetricReq(record.id)
          
          if (error) {
            message.error('Failed to delete metric: ' + error.message)
            return
          }
          
          message.success('Metric deleted successfully')
          // Refresh the list
          fetchMetricsList()
        } catch (err) {
          message.error('An error occurred while deleting the metric')
          console.error('Exception in handleDelete:', err)
        }
      },
    })
  }

  const columns: ColumnsType<IBillableMetrics> = [
    {
      title: 'Name',
      dataIndex: 'metricName',
      key: 'metricName',
      width: 180,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => (
        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-mono">
          {code}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'metricDescription',
      key: 'metricDescription',
      ellipsis: true,
      render: (desc: string) => desc || '-',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (t: MetricType) => {
        const typeLabel = METRICS_TYPE[t]?.label || t
        return <Tag color="blue">{typeLabel}</Tag>
      }
    },
    {
      title: 'Aggregation',
      dataIndex: 'aggregationType',
      key: 'aggregationType',
      width: 150,
      render: (aggreType: MetricAggregationType) => {
        const aggreLabel = METRICS_AGGREGATE_TYPE[aggreType]?.label || aggreType
        return <span>{aggreLabel}</span>
      }
    },
    {
      title: 'Updated',
      dataIndex: 'gmtModify',
      key: 'gmtModify',
      width: 150,
      render: (d) => formatDate(d, true)
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: any, record: IBillableMetrics) => (
        <div className="flex items-center gap-3">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined className="text-blue-500" />}
              onClick={(e) => handleEdit(record, e)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined className="text-red-500" />}
              onClick={(e) => handleDelete(record, e)}
            />
          </Tooltip>
        </div>
      ),
    }
  ]

  useEffect(() => {
    fetchMetricsList()
  }, [])

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold mb-6">Billable Metric</h1>

        {/* Search and Action Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <Search
                placeholder="Search by code or name"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={(value) => {
                  const trimmedValue = value.trim()
                  setSearchText(trimmedValue)
                  setPagination(prev => ({ ...prev, current: 1 }))
                  fetchMetricsList({ page: 0, searchKey: trimmedValue })
                }}
                size="large"
                allowClear
                enterButton
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                size="large"
                icon={<SyncOutlined />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={onNewMetrics}
                style={{
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff',
                  color: '#fff',
                  fontWeight: 500,
                }}
                className="hover:opacity-90"
              >
                New Metric
              </Button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ResponsiveTable
            columns={columns}
            dataSource={metricsList}
            rowKey={'id'}
            rowClassName="clickable-tbl-row"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              locale: { items_per_page: '' },
              className: 'billable-metric-pagination',
            }}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            onRow={(record) => {
              return {
                onClick: () => {
                  navigate(`/billable-metric/${record.id}`)
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Index
