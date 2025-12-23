import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Table, Button, Tag, message } from 'antd'
import './list.css'
import {
  ArrowLeftOutlined,
  FilterOutlined,
  LoadingOutlined,
  CloseOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { ColumnsType, TableProps } from 'antd/es/table'
import Search from 'antd/es/input/Search'
import { UsageRecordsFilters } from './types'
import { UsageRecordsFilterModal } from './usageRecordsFilterModal'
import { getDiscountCodeUsageDetailReq, exportDataReq } from '../../requests'
import { DiscountCodeUsage } from '../../shared.types'
import { formatDate, showAmount } from '../../helpers'
import { useAppConfigStore } from '../../stores'

const PAGE_SIZE = 20

const getStatusTag = (status: number) => {
  const statusMap: Record<number, { text: string; bgColor: string; borderColor: string; textColor: string }> = {
    1: { text: 'Finished', bgColor: '#fafafa', borderColor: '#d9d9d9', textColor: '#8c8c8c' },
    2: { text: 'Rollback', bgColor: '#fff2f0', borderColor: '#ffccc7', textColor: '#ff4d4f' }
  }
  const config = statusMap[status] || statusMap[1]
  return (
    <Tag 
      style={{ 
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.textColor,
        borderRadius: 12,
        padding: '2px 12px'
      }}
    >
      {config.text}
    </Tag>
  )
}

export const CodeUsageRecords = () => {
  const navigate = useNavigate()
  const { ruleId } = useParams<{ ruleId: string }>()
  const appConfigStore = useAppConfigStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DiscountCodeUsage[]>([])
  const [searchEmail, setSearchEmail] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<UsageRecordsFilters>({})

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const fetchData = useCallback(async () => {
    if (!ruleId) return

    setLoading(true)
    const [result, err] = await getDiscountCodeUsageDetailReq({
      id: Number(ruleId),
      page,
      count: pageSize,
      ...(searchEmail ? { email: searchEmail } : {}),
      ...(filters.createTimeStart ? { createTimeStart: Math.floor(new Date(filters.createTimeStart).getTime() / 1000) } : {}),
      ...(filters.createTimeEnd ? { createTimeEnd: Math.floor(new Date(filters.createTimeEnd + ' 23:59:59').getTime() / 1000) } : {}),
      ...(filters.status && filters.status.length > 0 ? { status: filters.status } : {}),
      ...(filters.planIds && filters.planIds.length > 0 ? { planIds: filters.planIds } : {})
    })
    setLoading(false)

    if (err) {
      message.error(err.message || 'Failed to fetch data')
      return
    }

    if (result) {
      setData(result.userDiscounts || [])
      setTotal(result.total || 0)
    }
  }, [ruleId, page, pageSize, searchEmail, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGoBack = () => {
    navigate('/bulk-discount-code/list')
  }

  const handleSearch = (value: string) => {
    if (value && !isValidEmail(value)) {
      message.warning('Please enter a valid email address')
      return
    }
    setSearchEmail(value)
    setPage(0)
  }

  const handleExport = async () => {
    if (!ruleId) return
    
    message.loading({ content: 'Creating export task...', key: 'export' })
    const [, err] = await exportDataReq({
      task: 'UserDiscountExport',
      payload: { id: Number(ruleId) }
    })
    
    if (err) {
      message.error({ content: err.message || 'Export failed', key: 'export' })
      return
    }
    
    message.success({ 
      content: 'Usage records are being exported, please check task list for progress.', 
      key: 'export',
      duration: 3 
    })
    appConfigStore.setTaskListOpen(true)
  }

  const handleFilterSubmit = (newFilters: UsageRecordsFilters) => {
    setFilters(newFilters)
    setPage(0)
    setFilterModalOpen(false)
  }

  const getActiveFilters = () => {
    const activeFilters: { key: string; label: string }[] = []
    
    if (filters.createTimeStart || filters.createTimeEnd) {
      const dateLabel = filters.createTimeStart && filters.createTimeEnd
        ? `Used: ${filters.createTimeStart} ~ ${filters.createTimeEnd}`
        : filters.createTimeStart 
          ? `Used from ${filters.createTimeStart}`
          : `Used until ${filters.createTimeEnd}`
      activeFilters.push({ key: 'createTime', label: dateLabel })
    }

    if (filters.status && filters.status.length > 0) {
      const statusMap: Record<number, string> = { 1: 'Finished', 2: 'Rollback' }
      const statusLabels = filters.status.map(s => statusMap[s] || s).join(', ')
      activeFilters.push({ key: 'status', label: `Status: ${statusLabels}` })
    }

    if (filters.planIds && filters.planIds.length > 0) {
      activeFilters.push({ key: 'planIds', label: `Plans: ${filters.planIds.length} selected` })
    }
    
    return activeFilters
  }

  const removeFilter = (filterKey: string) => {
    const newFilters = { ...filters }
    if (filterKey === 'createTime') {
      delete newFilters.createTimeStart
      delete newFilters.createTimeEnd
    } else if (filterKey === 'status') {
      delete newFilters.status
    } else if (filterKey === 'planIds') {
      delete newFilters.planIds
    }
    
    setFilters(newFilters)
  }

  const clearAllFilters = () => {
    setFilters({})
  }

  const activeFilters = getActiveFilters()
  const filterCount = activeFilters.length

  const columns: ColumnsType<DiscountCodeUsage> = [
    {
      title: 'Sub-Code',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      fixed: 'left'
    },
    {
      title: 'Applied plan',
      dataIndex: 'plan',
      key: 'plan',
      width: 120,
      render: (plan) => plan ? (
        <span 
          className="text-blue-500 cursor-pointer hover:underline"
          onClick={() => navigate(`/plan/${plan.id}`)}
        >
          {plan.planName || '-'}
        </span>
      ) : '-'
    },
    {
      title: 'Applied Amt',
      key: 'applyAmount',
      width: 100,
      render: (_, record) => showAmount(record.applyAmount, record.currency)
    },
    {
      title: 'Used by',
      dataIndex: 'user',
      key: 'user',
      width: 140,
      render: (user) => user ? (
        <span 
          className="text-blue-500 cursor-pointer hover:underline truncate block max-w-[130px]"
          onClick={() => navigate(`/user/${user.id}`)}
          title={user.email}
        >
          {user.email || '-'}
        </span>
      ) : '-'
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 100,
      render: (createTime: number) => formatDate(createTime)
    },
    {
      title: 'Used at',
      dataIndex: 'createTime',
      key: 'usedAt',
      width: 140,
      render: (createTime: number) => formatDate(createTime, true)
    },
    {
      title: 'Recurring',
      dataIndex: 'recurring',
      key: 'recurring',
      width: 90,
      render: (recurring: number) => recurring ? 'Yes' : 'No'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => getStatusTag(status)
    },
    {
      title: 'Subscription ID',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      width: 130,
      render: (id: string) => id ? (
        <span 
          className="text-blue-500 cursor-pointer hover:underline truncate block max-w-[120px]"
          onClick={() => navigate(`/subscription/${id}`)}
          title={id}
        >
          {id}
        </span>
      ) : '-'
    },
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      width: 120,
      render: (id: string) => id ? (
        <span 
          className="text-blue-500 cursor-pointer hover:underline truncate block max-w-[110px]"
          onClick={() => navigate(`/invoice/${id}`)}
          title={id}
        >
          {id}
        </span>
      ) : '-'
    },
    {
      title: 'Transaction ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
      width: 130,
      render: (id: string) => id || '-'
    }
  ]

  const handleTableChange: TableProps<DiscountCodeUsage>['onChange'] = (pagination) => {
    const newPageSize = pagination.pageSize || PAGE_SIZE
    const newPage = pagination.current || 1
    
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      setPage(0)
    } else {
      setPage(newPage - 1)
    }
  }

  return (
    <div className="p-0">
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />}
        onClick={handleGoBack}
        className="p-0 mb-4"
        style={{ color: '#666' }}
      >
        Back to Bulk Discount Code
      </Button>

      <h1 className="text-xl font-semibold mb-6">Discount Code Records</h1>

      <div className="flex justify-between items-center mb-4">
        <Button 
          icon={<FilterOutlined />}
          onClick={() => setFilterModalOpen(true)}
        >
          <span style={{ marginRight: filterCount > 0 ? '8px' : 0 }}>Filter</span>
          {filterCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                height: '20px',
                padding: '0 6px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#000'
              }}
            >
              {filterCount}
            </span>
          )}
        </Button>
        <Search
          placeholder="Search by Email"
          allowClear
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {activeFilters.map(filter => (
            <Tag
              key={filter.key}
              closable
              closeIcon={<CloseOutlined style={{ fontSize: 10 }} />}
              onClose={() => removeFilter(filter.key)}
              style={{
                padding: '4px 12px',
                fontSize: '13px',
                borderRadius: '16px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {filter.label}
            </Tag>
          ))}
          <span
            onClick={clearAllFilters}
            style={{
              fontSize: '13px',
              color: '#666',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              marginLeft: '4px'
            }}
          >
            Clear all
          </span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">Records</h2>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleExport}
          >
            Export
          </Button>
        </div>

        <Table<DiscountCodeUsage>
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
          pagination={{
            current: page + 1,
            pageSize: pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            locale: { items_per_page: '' },
            disabled: loading,
            hideOnSinglePage: false,
            className: 'bulk-discount-pagination'
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </div>

      <UsageRecordsFilterModal
        open={filterModalOpen}
        filters={filters}
        onClose={() => setFilterModalOpen(false)}
        onSubmit={handleFilterSubmit}
      />
    </div>
  )
}

export default CodeUsageRecords
