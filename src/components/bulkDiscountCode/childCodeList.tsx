import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Table,
  Button,
  Tag,
  message,
  Tooltip
} from 'antd'
import './list.css'
import {
  ArrowLeftOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined,
  LoadingOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CopyOutlined
} from '@ant-design/icons'
import type { ColumnsType, TableProps } from 'antd/es/table'
import Search from 'antd/es/input/Search'
import { ChildCode, ChildCodeFilters } from './types'
import { StatsCard } from './statsCard'
import { ChildCodeFilterModal } from './childCodeFilterModal'
import { 
  getBatchChildrenListReq, 
  getBatchTemplateDetailReq,
  exportBatchChildrenReq,
  BatchDiscountChild 
} from '../../requests/batchDiscountService'
import { useAppConfigStore } from '../../stores'
import ImportModal from '../shared/dataImportModal'

const PAGE_SIZE = 20

// const getChildCodeStatusTag = (isRedeemed: boolean) => {
//   const config = isRedeemed 
//     ? { bgColor: '#fafafa', borderColor: '#d9d9d9', textColor: '#8c8c8c', text: 'Redeemed' }
//     : { bgColor: '#f6ffed', borderColor: '#b7eb8f', textColor: '#52c41a', text: 'Available' }
//   return (
//     <Tag 
//       style={{ 
//         backgroundColor: config.bgColor,
//         borderColor: config.borderColor,
//         color: config.textColor,
//         borderRadius: 12,
//         padding: '2px 12px'
//       }}
//     >
//       {config.text}
//     </Tag>
//   )
// }

export const ChildCodeList = () => {
  const navigate = useNavigate()
  const { ruleId } = useParams<{ ruleId: string }>()
  const appConfigStore = useAppConfigStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ChildCode[]>([])
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<ChildCodeFilters>({})
  const [importModalOpen, setImportModalOpen] = useState(false)

  const [masterCode, setMasterCode] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  // const [redeemedCount, setRedeemedCount] = useState(0)

  // Fetch template detail to get masterCode
  useEffect(() => {
    if (ruleId) {
      getBatchTemplateDetailReq(Number(ruleId)).then(([detail, err]) => {
        if (!err && detail) {
          setMasterCode(detail.codePrefix || detail.code)
          setTotalCount(detail.childCodeCount || 0)
          // setRedeemedCount(detail.usedChildCodeCount || 0)
        }
      })
    }
  }, [ruleId])

  const fetchData = useCallback(async () => {
    if (!ruleId) return

    setLoading(true)
    const [result, err] = await getBatchChildrenListReq({
      templateId: Number(ruleId),
      page,
      count: pageSize,
      code: searchText || undefined,
      createTimeStart: filters.createdDateStart ? Math.floor(new Date(filters.createdDateStart).getTime() / 1000) : undefined,
      createTimeEnd: filters.createdDateEnd ? Math.floor(new Date(filters.createdDateEnd + ' 23:59:59').getTime() / 1000) : undefined
    })
    setLoading(false)

    if (err) {
      message.error(err.message || 'Failed to fetch data')
      return
    }

    if (result) {
      const mappedData: ChildCode[] = result.list.map((item: BatchDiscountChild) => ({
        id: item.id,
        code: item.code,
        status: item.status,
        isRedeemed: item.isRedeemed,
        redeemedByEmail: item.redeemedByEmail,
        redeemedAt: item.redeemedAt,
        invoiceId: item.invoiceId,
        subscriptionId: item.subscriptionId,
        paymentId: item.paymentId,
        createTime: item.createTime
      }))
      setData(mappedData)
      setTotal(result.total)
      setTotalCount(result.total)
    }
  }, [ruleId, page, pageSize, searchText, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (value: string) => {
    setSearchText(value)
    setPage(0)
  }

  const handleGoBack = () => {
    navigate('/bulk-discount-code/list')
  }

  const handleExport = async () => {
    if (!ruleId) return
    
    message.loading({ content: 'Creating export task...', key: 'export' })
    const [, err] = await exportBatchChildrenReq(Number(ruleId), 'xlsx')
    
    if (err) {
      message.error({ content: err.message || 'Export failed', key: 'export' })
      return
    }
    
    message.success({ 
      content: 'Child codes are being exported, please check task list for progress.', 
      key: 'export',
      duration: 3 
    })
    appConfigStore.setTaskListOpen(true)
  }

  const handleFilterSubmit = (newFilters: ChildCodeFilters) => {
    setFilters(newFilters)
    setPage(0)
    setFilterModalOpen(false)
  }

  // Get active filters for display
  const getActiveFilters = () => {
    const activeFilters: { key: string; label: string }[] = []
    
    if (filters.createdDateStart || filters.createdDateEnd) {
      const dateLabel = filters.createdDateStart && filters.createdDateEnd
        ? `${filters.createdDateStart} ~ ${filters.createdDateEnd}`
        : filters.createdDateStart 
          ? `From ${filters.createdDateStart}`
          : `Until ${filters.createdDateEnd}`
      activeFilters.push({ key: 'createdDate', label: dateLabel })
    }
    
    return activeFilters
  }

  const removeFilter = (filterKey: string) => {
    const newFilters = { ...filters }
    if (filterKey === 'createdDate') {
      delete newFilters.createdDateStart
      delete newFilters.createdDateEnd
    }
    
    setFilters(newFilters)
    if (page === 0) {
      fetchData()
    } else {
      setPage(0)
    }
  }

  const clearAllFilters = () => {
    setFilters({})
    if (page === 0) {
      fetchData()
    } else {
      setPage(0)
    }
  }

  const activeFilters = getActiveFilters()
  const filterCount = activeFilters.length

  const columns: ColumnsType<ChildCode> = [
    {
      title: 'Batch ID',
      key: 'batchId',
      width: 150,
      render: () => ruleId
    },
    {
      title: 'Sub-code',
      dataIndex: 'code',
      key: 'code',
      width: 220,
      render: (code: string) => (
        <div className="flex items-center gap-2">
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
          <Tooltip title="Copy">
            <CopyOutlined 
              style={{ color: '#8c8c8c', cursor: 'pointer' }}
              onClick={() => {
                navigator.clipboard.writeText(code)
                message.success('Copied')
              }}
            />
          </Tooltip>
        </div>
      )
    },
    {
      title: 'Created Date',
      key: 'createdDate',
      width: 150,
      render: (_, record) => record.createTime 
        ? new Date(record.createTime * 1000).toLocaleDateString() 
        : '-'
    }
  ]

  const handleTableChange: TableProps<ChildCode>['onChange'] = (pagination) => {
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
      {/* Back link */}
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />}
        onClick={handleGoBack}
        className="p-0 mb-4"
        style={{ color: '#666' }}
      >
        Back to Bulk Discount Code
      </Button>

      {/* Title */}
      <h1 className="text-xl font-semibold mb-6">{masterCode}Child Codes</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ maxWidth: 500 }}>
        <StatsCard
          icon={<ClockCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
          label="Total"
          value={totalCount}
          iconBgColor="#bae7ff"
        />
        {/* <StatsCard
          icon={<CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
          label="Redeemed"
          value={redeemedCount}
          iconBgColor="#d9f7be"
        /> */}
      </div>

      {/* Filter and Search */}
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
          placeholder="Search by Sub-code"
          allowClear
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
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
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">Records</h2>
          <div className="flex gap-3">
            <Button
              icon={<SyncOutlined />}
              onClick={fetchData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => setImportModalOpen(true)}
            >
              Import
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleExport}
            >
              Export
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table<ChildCode>
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

      {/* Filter Modal */}
      <ChildCodeFilterModal
        open={filterModalOpen}
        filters={filters}
        onClose={() => setFilterModalOpen(false)}
        onSubmit={handleFilterSubmit}
      />

      {/* Import Modal */}
      {importModalOpen && (
        <ImportModal
          closeModal={() => setImportModalOpen(false)}
          importType="BatchDiscountChildrenImport"
        />
      )}
    </div>
  )
}

export default ChildCodeList
