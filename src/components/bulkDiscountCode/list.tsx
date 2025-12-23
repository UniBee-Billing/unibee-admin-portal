import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Button,
  Space,
  Dropdown,
  Progress,
  Tag,
  message,
  Tooltip,
  Modal
} from 'antd'
import dayjs from 'dayjs'
import './list.css'
import {
  PlusOutlined,
  EditOutlined,
  InboxOutlined,
  MoreOutlined,
  FilterOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UnorderedListOutlined,
  ShoppingCartOutlined,
  PercentageOutlined
} from '@ant-design/icons'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { MenuProps } from 'antd'
import Search from 'antd/es/input/Search'
import { CloseOutlined } from '@ant-design/icons'
import { 
  DiscountRule, 
  DiscountRuleStatus, 
  BulkDiscountStats, 
  TemplateStatus,
  getDisplayStatus,
  formatDiscount
} from './types'

const STATUS_OPTIONS = [
  { label: 'Editing', value: TemplateStatus.EDITING },
  { label: 'Active', value: TemplateStatus.ACTIVE },
  { label: 'Inactive', value: TemplateStatus.INACTIVE },
  { label: 'Archived', value: TemplateStatus.ARCHIVED }
]
import { StatsCard } from './statsCard'
import { BulkGenerateModal } from './bulkGenerateModal'
import { EditDiscountRuleModal } from './editDiscountRuleModal'
import { ListFilterModal } from './listFilterModal'
import {
  getBatchTemplateListReq,
  archiveBatchTemplateReq,
  activateBatchTemplateReq,
  deactivateBatchTemplateReq,
  BatchDiscountTemplate
} from '../../requests/batchDiscountService'

const PAGE_SIZE = 10

const getStatusTag = (status: DiscountRuleStatus) => {
  const statusConfig: Record<DiscountRuleStatus, { bgColor: string; borderColor: string; textColor: string; text: string }> = {
    [DiscountRuleStatus.ACTIVE]: { 
      bgColor: '#f6ffed', 
      borderColor: '#b7eb8f', 
      textColor: '#52c41a', 
      text: 'Active' 
    },
    [DiscountRuleStatus.INACTIVE]: { 
      bgColor: '#fafafa', 
      borderColor: '#d9d9d9', 
      textColor: '#8c8c8c', 
      text: 'Inactive' 
    },
    [DiscountRuleStatus.EXPIRED]: { 
      bgColor: '#fff2f0', 
      borderColor: '#ffccc7', 
      textColor: '#ff4d4f', 
      text: 'Expired' 
    },
    [DiscountRuleStatus.EDITING]: { 
      bgColor: '#e6f7ff', 
      borderColor: '#91d5ff', 
      textColor: '#1890ff', 
      text: 'Editing' 
    },
    [DiscountRuleStatus.ARCHIVED]: { 
      bgColor: '#fafafa', 
      borderColor: '#d9d9d9', 
      textColor: '#8c8c8c', 
      text: 'Archived' 
    }
  }
  const config = statusConfig[status] || statusConfig[DiscountRuleStatus.INACTIVE]
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

export const BulkDiscountCodeList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DiscountRule[]>([])
  const [stats, setStats] = useState<BulkDiscountStats>({
    activeRules: 0,
    totalCodes: 0,
    redemptions: 0,
    redemptionRate: 0
  })
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState<number[] | undefined>(undefined)
  
  const [bulkGenerateModalOpen, setBulkGenerateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<DiscountRule | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [result, err] = await getBatchTemplateListReq({
      page,
      count: pageSize,
      status: filterStatus && filterStatus.length > 0 ? filterStatus : undefined,
      searchKey: searchText || undefined
    })
    setLoading(false)

    if (err) {
      message.error(err.message || 'Failed to fetch data')
      return
    }

    if (result) {
      // Map API response to DiscountRule type
      const mappedData: DiscountRule[] = result.list.map((item: BatchDiscountTemplate) => ({
        id: item.id,
        name: item.name,
        code: item.codePrefix || item.code,
        status: item.status,
        quantity: item.quantity,
        childCodeCount: item.childCodeCount || 0,
        usedChildCodeCount: item.usedChildCodeCount || 0,
        billingType: item.billingType,
        discountType: item.discountType,
        discountAmount: item.discountAmount || 0,
        discountPercentage: item.discountPercentage || 0,
        currency: item.currency || '',
        cycleLimit: item.cycleLimit || 0,
        startTime: item.startTime,
        endTime: item.endTime,
        planApplyType: item.planApplyType || 0,
        planIds: item.planIds,
        userLimit: item.userLimit || 1,
        userScope: item.userScope || 0,
        createTime: item.createTime
      }))
      setData(mappedData)
      setTotal(result.total)

      // Use stats from API response
      setStats({
        activeRules: result.activeTemplateCount,
        totalCodes: result.totalChildCodeCount,
        redemptions: result.usedChildCodeCount,
        redemptionRate: result.usageRate
      })
    }
  }, [page, pageSize, searchText, filterStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (value: string) => {
    setSearchText(value)
    setPage(0)
  }

  const handleBulkGenerate = (rule: DiscountRule) => {
    setSelectedRule(rule)
    setBulkGenerateModalOpen(true)
  }

  const handleViewChildCodes = (rule: DiscountRule) => {
    navigate(`/bulk-discount-code/${rule.id}/child-codes`)
  }

  const handleViewRecords = (rule: DiscountRule) => {
    navigate(`/bulk-discount-code/${rule.id}/usage-records`)
  }

  const handleEdit = (rule: DiscountRule) => {
    setSelectedRule(rule)
    setEditModalOpen(true)
  }

  const handleArchive = (rule: DiscountRule) => {
    Modal.confirm({
      title: 'Archive Discount Rule',
      content: `Are you sure you want to archive "${rule.name}"? This action cannot be undone.`,
      okText: 'Archive',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        const [, err] = await archiveBatchTemplateReq(rule.id)
        if (err) {
          message.error(err.message || 'Failed to archive discount rule')
          return
        }
        message.success(`Discount rule "${rule.name}" archived successfully`)
        fetchData()
      }
    })
  }

  const handleCreateNew = () => {
    setSelectedRule(null)
    setEditModalOpen(true)
  }

  const handleBulkGenerateSuccess = () => {
    setBulkGenerateModalOpen(false)
    fetchData()
  }

  const handleEditSubmit = async (success: boolean) => {
    if (success) {
      setEditModalOpen(false)
      fetchData()
    }
  }

  const handleFilterSubmit = (filters: { status?: number[] }) => {
    setFilterStatus(filters.status && filters.status.length > 0 ? filters.status : undefined)
    setPage(0)
    setFilterModalOpen(false)
  }

  // Get active filters for display
  const getActiveFilters = () => {
    const activeFilters: { key: string; label: string; value?: number; type: string }[] = []
    
    if (filterStatus && filterStatus.length > 0) {
      filterStatus.forEach((status) => {
        const statusLabel = STATUS_OPTIONS.find(s => s.value === status)?.label
        if (statusLabel) {
          activeFilters.push({ key: `status-${status}`, label: statusLabel, value: status, type: 'status' })
        }
      })
    }
    
    return activeFilters
  }

  const removeFilter = (filterKey: string) => {
    if (filterKey.startsWith('status-')) {
      const status = Number(filterKey.replace('status-', ''))
      const newStatus = filterStatus?.filter((s) => s !== status)
      setFilterStatus(newStatus && newStatus.length > 0 ? newStatus : undefined)
    }
    // Trigger refetch
    if (page === 0) {
      fetchData()
    } else {
      setPage(0)
    }
  }

  const clearAllFilters = () => {
    setFilterStatus(undefined)
    if (page === 0) {
      fetchData()
    } else {
      setPage(0)
    }
  }

  const activeFilters = getActiveFilters()
  const filterCount = activeFilters.length

  const handleActivate = async (rule: DiscountRule) => {
    const [, err] = await activateBatchTemplateReq(rule.id)
    if (err) {
      message.error(err.message || 'Failed to activate template')
      return
    }
    message.success(`Template "${rule.name}" activated successfully`)
    fetchData()
  }

  const handleDeactivate = async (rule: DiscountRule) => {
    const [, err] = await deactivateBatchTemplateReq(rule.id)
    if (err) {
      message.error(err.message || 'Failed to deactivate template')
      return
    }
    message.success(`Template "${rule.name}" deactivated successfully`)
    fetchData()
  }

  const getActionMenuItems = (record: DiscountRule): MenuProps['items'] => {
    const items: MenuProps['items'] = []

    // Bulk Generate (only for active templates)
    if (record.status === TemplateStatus.ACTIVE) {
      items.push({
        key: 'bulk-generate',
        icon: <ThunderboltOutlined />,
        label: 'Generate Codes',
        onClick: (e) => {
          e.domEvent.stopPropagation()
          handleBulkGenerate(record)
        }
      })
    }

    // View Child Codes
    items.push({
      key: 'view-child-codes',
      icon: <EyeOutlined />,
      label: 'View Child Codes',
      onClick: (e) => {
        e.domEvent.stopPropagation()
        handleViewChildCodes(record)
      }
    })

    // View Records
    items.push({
      key: 'view-records',
      icon: <EyeOutlined />,
      label: 'View Records',
      onClick: (e) => {
        e.domEvent.stopPropagation()
        handleViewRecords(record)
      }
    })

    return items
  }

  const columns: ColumnsType<DiscountRule> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => (
        <Tag 
          style={{ 
            backgroundColor: '#e6f7ff',
            borderColor: '#91d5ff',
            color: '#1890ff',
            fontFamily: 'monospace',
            borderRadius: 4,
            padding: '2px 8px'
          }}
        >
          {code}
        </Tag>
      )
    },
    {
      title: 'Discount',
      key: 'discount',
      width: 120,
      render: (_, record) => formatDiscount(
        record.discountType,
        record.discountAmount,
        record.discountPercentage,
        record.currency
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => getStatusTag(getDisplayStatus(record.status, record.endTime))
    },
    {
      title: 'Used / Total',
      key: 'usage',
      width: 200,
      render: (_, record) => {
        const total = record.childCodeCount || 0
        const percent = total > 0 ? (record.usedChildCodeCount / total) * 100 : 0
        let strokeColor = '#52c41a'
        if (percent > 70) strokeColor = '#faad14'
        if (percent > 90) strokeColor = '#ff4d4f'
        
        return (
          <div className="flex items-center gap-3">
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor={strokeColor}
              trailColor="#f0f0f0"
              style={{ width: 100, margin: 0 }}
              size="small"
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {record.usedChildCodeCount}/{total}
            </span>
          </div>
        )
      }
    },
    {
      title: 'Valid Until',
      key: 'validUntil',
      width: 120,
      render: (_, record) => record.endTime 
        ? dayjs.unix(record.endTime).format('YYYY-MM-DD') 
        : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => {
        const isArchived = record.status === TemplateStatus.ARCHIVED
        const isActive = record.status === TemplateStatus.ACTIVE
        const canActivate = record.status === TemplateStatus.EDITING || record.status === TemplateStatus.INACTIVE

        return (
        <Space size={4}>
          {isActive ? (
            <Tooltip title="Deactivate">
              <Button
                type="text"
                icon={<StopOutlined style={{ color: '#8c8c8c' }} />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeactivate(record)
                }}
                style={{ padding: '4px 8px' }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Activate">
              <Button
                type="text"
                icon={<CheckCircleOutlined style={{ color: isArchived ? '#d9d9d9' : '#52c41a' }} />}
                onClick={(e) => {
                  e.stopPropagation()
                  if (canActivate) {
                    handleActivate(record)
                  }
                }}
                disabled={isArchived}
                style={{ padding: '4px 8px' }}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: isArchived ? '#d9d9d9' : '#8c8c8c' }} />}
              onClick={(e) => {
                e.stopPropagation()
                if (!isArchived) {
                  handleEdit(record)
                }
              }}
              disabled={isArchived}
              style={{ padding: '4px 8px' }}
            />
          </Tooltip>
          <Tooltip title="Archive">
            <Button
              type="text"
              icon={<InboxOutlined style={{ color: record.status === TemplateStatus.ARCHIVED ? '#d9d9d9' : '#8c8c8c' }} />}
              onClick={(e) => {
                e.stopPropagation()
                if (record.status !== TemplateStatus.ARCHIVED) {
                  handleArchive(record)
                }
              }}
              disabled={record.status === TemplateStatus.ARCHIVED}
              style={{ padding: '4px 8px' }}
            />
          </Tooltip>
          <Tooltip title="More">
            <Dropdown
              menu={{ items: getActionMenuItems(record) }}
              trigger={['click']}
            >
              <Button
                type="text"
                icon={<MoreOutlined style={{ color: '#8c8c8c' }} />}
                onClick={(e) => e.stopPropagation()}
                style={{ padding: '4px 8px' }}
              />
            </Dropdown>
          </Tooltip>
        </Space>
      )}
    }
  ]

  const handleTableChange: TableProps<DiscountRule>['onChange'] = (pagination) => {
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
      <h1 className="text-xl font-semibold mb-6">Bulk Discount Code</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon={<CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
          label="Active Rules"
          value={stats.activeRules}
          iconBgColor="#d9f7be"
        />
        <StatsCard
          icon={<UnorderedListOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
          label="Total Codes"
          value={stats.totalCodes.toLocaleString()}
          iconBgColor="#bae7ff"
        />
        <StatsCard
          icon={<ShoppingCartOutlined style={{ fontSize: 24, color: '#faad14' }} />}
          label="Redemptions"
          value={stats.redemptions.toLocaleString()}
          iconBgColor="#fff1b8"
        />
        <StatsCard
          icon={<PercentageOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
          label="Redemption Rate"
          value={`${(Number(stats.redemptionRate) * 100).toFixed(1)}%`}
          iconBgColor="#efdbff"
        />
      </div>

      {/* Filter and Search */}
      <div className="flex justify-between items-center mb-4">
        <Button icon={<FilterOutlined />} onClick={() => setFilterModalOpen(true)}>
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
        <div className="flex gap-3">
          <Search
            placeholder="Search by Code or Name"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateNew}
          >
            Create New Rule
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
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

      {/* Records Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Discount Rules List</h2>
        </div>

        {/* Table */}
        <Table<DiscountRule>
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
            className: 'bulk-discount-pagination'
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}

        />
      </div>

      {/* Bulk Generate Modal */}
      <BulkGenerateModal
        open={bulkGenerateModalOpen}
        rule={selectedRule}
        onCancel={() => setBulkGenerateModalOpen(false)}
        onSuccess={handleBulkGenerateSuccess}
      />

      {/* Edit Discount Rule Modal */}
      <EditDiscountRuleModal
        open={editModalOpen}
        rule={selectedRule}
        onCancel={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />

      {/* Filter Modal */}
      <ListFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onSubmit={handleFilterSubmit}
      />
    </div>
  )
}

export default BulkDiscountCodeList
