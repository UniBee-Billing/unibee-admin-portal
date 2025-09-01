import React, { useState, useEffect, useRef } from 'react'
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  message,
  Table,
  Tag,
  Pagination,
  Empty,
  Tooltip
} from 'antd'
import { SearchOutlined, ClearOutlined, FilterOutlined, CopyOutlined, FileTextOutlined } from '@ant-design/icons'
import { ExportButton } from '../table/exportButton'
import RefundStatusTag from './refundStatusTag'
import type { ColumnsType, TableProps } from 'antd/es/table'
import {
  CreditNote,
  CreditNoteListRequest
} from './types'
import {
  getCreditNoteListReq,
  getPlanList,
  getPaymentGatewayListReq
} from '../../requests'
import { exportDataReq } from '../../requests'
import { useAppConfigStore } from '../../stores'
import { IPlan, PlanStatus } from '../../shared.types'
// import { showAmount } from '../../helpers'

const { RangePicker } = DatePicker

// Add responsive table styles
const tableStyles = `
  .responsive-table-container {
    overflow-x: auto;
    overflow-y: hidden;
    border-radius: 8px;
  }
  
  .responsive-table-container .ant-table {
    min-width: 100%;
    border-radius: 8px;
  }
  
  /* Table header styles - unified gray background, left aligned */
  .responsive-table-container .ant-table-thead > tr > th {
    white-space: nowrap;
    padding: 12px 8px;
    background-color: #f5f5f5 !important;
    border-bottom: 1px solid #e8e8e8;
    font-weight: 600;
    color: #333333 !important;
    text-align: left !important;
    text-align-last: left !important;
  }
  
  /* Table content styles - unified white background, left aligned */
  .responsive-table-container .ant-table-tbody > tr > td {
    padding: 12px 8px;
    vertical-align: top;
    border-bottom: 1px solid #f0f0f0;
    background-color: #ffffff !important;
    text-align: left !important;
    text-align-last: left !important;
  }
  
  /* 移除表格行的交替背景色 */
  .responsive-table-container .ant-table-tbody > tr:nth-child(even) > td {
    background-color: #ffffff !important;
  }
  
  .responsive-table-container .ant-table-tbody > tr:nth-child(odd) > td {
    background-color: #ffffff !important;
  }
  
  /* 悬停效果 */
  .responsive-table-container .ant-table-tbody > tr:hover > td {
    background-color: #fafafa !important;
  }
  
  /* 中等分辨率屏幕优化 (1920x1080) */
  @media (min-width: 1920px) and (max-width: 2559px) {
    .responsive-table-container .ant-table-thead > tr > th,
    .responsive-table-container .ant-table-tbody > tr > td {
      padding: 14px 10px;
    }
    
    .responsive-table-container .ant-table-thead > tr > th {
      font-size: 14px;
    }
    
    .responsive-table-container .ant-table-tbody > tr > td {
      font-size: 13px;
    }
    
    /* 中等分辨率屏幕下的列宽优化 */
    .responsive-table-container .ant-table-cell:nth-child(1) { width: 150px !important; } /* Invoice ID */
    .responsive-table-container .ant-table-cell:nth-child(2) { width: 190px !important; } /* Email */
    .responsive-table-container .ant-table-cell:nth-child(3) { width: 170px !important; } /* Plan Name */
    .responsive-table-container .ant-table-cell:nth-child(4) { width: 110px !important; } /* Cycle Period */
    .responsive-table-container .ant-table-cell:nth-child(5) { width: 150px !important; } /* Refund Amount */
    .responsive-table-container .ant-table-cell:nth-child(6) { width: 130px !important; } /* Refund Date */
    .responsive-table-container .ant-table-cell:nth-child(7) { width: 150px !important; } /* Refund Method */
    .responsive-table-container .ant-table-cell:nth-child(8) { width: 280px !important; } /* Refund Reason */
    .responsive-table-container .ant-table-cell:nth-child(9) { width: 130px !important; } /* Status */
  }
  
  /* 2K屏幕优化 */
  @media (min-width: 2560px) {
    .responsive-table-container .ant-table-thead > tr > th,
    .responsive-table-container .ant-table-tbody > tr > td {
      padding: 16px 12px;
    }
    
    .responsive-table-container .ant-table-thead > tr > th {
      font-size: 15px;
    }
    
    .responsive-table-container .ant-table-tbody > tr > td {
      font-size: 14px;
    }
    
    /* 2K屏幕下的列宽优化 */
    .responsive-table-container .ant-table-cell:nth-child(1) { width: 160px !important; } /* Invoice ID */
    .responsive-table-container .ant-table-cell:nth-child(2) { width: 200px !important; } /* Email */
    .responsive-table-container .ant-table-cell:nth-child(3) { width: 180px !important; } /* Plan Name */
    .responsive-table-container .ant-table-cell:nth-child(4) { width: 120px !important; } /* Cycle Period */
    .responsive-table-container .ant-table-cell:nth-child(5) { width: 160px !important; } /* Refund Amount */
    .responsive-table-container .ant-table-cell:nth-child(6) { width: 140px !important; } /* Refund Date */
    .responsive-table-container .ant-table-cell:nth-child(7) { width: 160px !important; } /* Refund Method */
    .responsive-table-container .ant-table-cell:nth-child(8) { width: 300px !important; } /* Refund Reason */
    .responsive-table-container .ant-table-cell:nth-child(9) { width: 140px !important; } /* Status */
  }
  
  /* 13.3英寸屏幕优化 */
  @media (max-width: 1366px) {
    .responsive-table-container .ant-table-thead > tr > th,
    .responsive-table-container .ant-table-tbody > tr > td {
      padding: 8px 6px;
    }
    
    .responsive-table-container .ant-table-thead > tr > th {
      font-size: 13px;
    }
    
    .responsive-table-container .ant-table-tbody > tr > td {
      font-size: 13px;
    }
    
    .responsive-table-container .ant-table-thead > tr > th,
    .responsive-table-container .ant-table-tbody > tr > td {
      line-height: 1.4;
    }
    
    /* 13.3英寸屏幕下的列宽优化 */
    .responsive-table-container .ant-table-cell:nth-child(1) { width: 120px !important; } /* Invoice ID */
    .responsive-table-container .ant-table-cell:nth-child(2) { width: 160px !important; } /* Email */
    .responsive-table-container .ant-table-cell:nth-child(3) { width: 140px !important; } /* Plan Name */
    .responsive-table-container .ant-table-cell:nth-child(4) { width: 90px !important; } /* Cycle Period */
    .responsive-table-container .ant-table-cell:nth-child(5) { width: 120px !important; } /* Refund Amount */
    .responsive-table-container .ant-table-cell:nth-child(6) { width: 100px !important; } /* Refund Date */
    .responsive-table-container .ant-table-cell:nth-child(7) { width: 120px !important; } /* Refund Method */
    .responsive-table-container .ant-table-cell:nth-child(8) { width: 200px !important; } /* Refund Reason */
    .responsive-table-container .ant-table-cell:nth-child(9) { width: 100px !important; } /* Status */
  }
  
  /* 侧边栏展开状态下的表格优化 */
  .sidebar-expanded .responsive-table-container {
    margin-left: 0;
  }
  
  /* 确保表格内容在小屏幕上不会换行 */
  .responsive-table-container .ant-table-cell {
    word-break: keep-all;
    white-space: nowrap;
  }
  
  /* 长文本的省略号处理 */
  .responsive-table-container .truncate-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    display: block;
  }
  

  
  /* 固定列样式优化 - 保持一致的背景色 */
  .responsive-table-container .ant-table-cell.ant-table-cell-fix-left,
  .responsive-table-container .ant-table-cell.ant-table-cell-fix-right {
    background-color: #ffffff !important;
    z-index: 2;
  }
  
  .responsive-table-container .ant-table-thead .ant-table-cell.ant-table-cell-fix-left,
  .responsive-table-container .ant-table-thead .ant-table-cell.ant-table-cell-fix-right {
    background-color: #f5f5f5 !important;
  }
  
  /* 分页器响应式优化 */
  .responsive-pagination {
    margin-top: 16px;
  }
  
  .responsive-pagination .ant-pagination-options {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
  
  /* 分页器选项左对齐 */
  .responsive-pagination .ant-pagination-options .ant-select,
  .responsive-pagination .ant-pagination-options .ant-pagination-options-quick-jumper {
    text-align: left;
  }
  
  .responsive-pagination .ant-pagination-options .ant-pagination-options-quick-jumper input {
    text-align: left;
  }
  
  /* 小屏幕下的分页器优化 */
  @media (max-width: 768px) {
    .responsive-pagination .ant-pagination-options {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
    
    .responsive-pagination .ant-pagination-total-text {
      text-align: center;
      margin-bottom: 8px;
    }
  }
  
  /* 表格滚动条样式 */
  .responsive-table-container::-webkit-scrollbar {
    height: 8px;
  }
  
  .responsive-table-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .responsive-table-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  .responsive-table-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  /* 筛选器响应式优化 */
  .ant-table-filter-dropdown {
    max-width: 300px;
  }
  
  .ant-table-filter-dropdown .ant-table-filter-dropdown-btns {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  /* 强制覆盖Antd默认样式 */
  .responsive-table-container .ant-table-thead > tr > th::before {
    display: none !important;
  }
  
  .responsive-table-container .ant-table-thead > tr > th.ant-table-column-has-sorters {
    background-color: #f5f5f5 !important;
  }
  
  .responsive-table-container .ant-table-thead > tr > th.ant-table-column-has-sorters:hover {
    background-color: #e8e8e8 !important;
  }
`

// Define filter option types
interface FilterOption {
  text: string
  label: string
  value: string | number
}

// Format price display, format: $299.00 USD
const formatPriceDisplay = (amount: number, currency: string) => {
  const appConfigStore = useAppConfigStore.getState()
  const currencyInfo = appConfigStore.supportCurrency.find(c => c.Currency === currency)

  if (!currencyInfo) {
    return `${currency} ${Math.abs(amount).toFixed(2)}`
  }

  // Get currency symbol
  const symbol = currencyInfo.Symbol
  // Format amount (considering Scale), use absolute value to remove negative sign
  const formattedAmount = Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount) / currencyInfo.Scale)

  return `${symbol}${formattedAmount} ${currency}`
}

const RefundList: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [creditNoteList, setCreditNoteList] = useState<CreditNote[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<CreditNoteListRequest>({})
  const [tableFilters, setTableFilters] = useState<Record<string, any>>({})

  const [planOptions, setPlanOptions] = useState<FilterOption[]>([])
  const [planLoading, setPlanLoading] = useState(false)
  const planFilterRef = useRef<{ value: number; text: string }[]>([])

  // Gateway filter options
  const [gatewayOptions, setGatewayOptions] = useState<FilterOption[]>([])



  // Status options
  const statusOptions: FilterOption[] = [
    { text: 'Processing', label: 'Processing', value: 2 },
    { text: 'Completed', label: 'Completed', value: 3 },
    { text: 'Failed', label: 'Failed', value: 4 },
    { text: 'Cancelled', label: 'Cancelled', value: 5 }
  ]

  // Fetch all available payment gateways for filter options
  const fetchAllGateways = async () => {
    try {
      const [gateways, error] = await getPaymentGatewayListReq()

      if (error) {
        console.error('Error fetching gateways:', error)
        return
      }

      if (gateways && Array.isArray(gateways)) {
        const gatewayOptionsArray: FilterOption[] = gateways.map((gateway: any) => ({
          text: gateway.displayName || gateway.name,
          label: gateway.displayName || gateway.name,
          value: gateway.gatewayId
        }))

        setGatewayOptions(gatewayOptionsArray)
      }
    } catch (error) {
      console.error('Error fetching gateways:', error)
    }
  }

  useEffect(() => {
    fetchCreditNoteList()
  }, [currentPage, pageSize, filters])

  // Fetch plan list information
  useEffect(() => {
    fetchPlan()
  }, [])

  // Fetch all gateway options
  useEffect(() => {
    fetchAllGateways()
  }, [])

  const fetchPlan = async () => {
    setPlanLoading(true)
    try {
      const [planList, err] = await getPlanList(
        {
          status: [
            PlanStatus.ACTIVE,
            PlanStatus.SOFT_ARCHIVED,
            PlanStatus.HARD_ARCHIVED
          ],
          page: 0,
          count: 500
        },
        fetchPlan
      )

      if (err) {
        console.error('Error fetching plan list:', err)
        setPlanOptions([
          { text: 'Error loading plans', label: 'Error loading plans', value: 'error' }
        ])
        return
      }

      if (planList && planList.plans) {
        // Generate filter options for Plan Name column
        planFilterRef.current =
          planList.plans == null
            ? []
            : planList.plans.map((p: IPlan) => ({
              value: p.plan?.id,
              text: p.plan?.planName
            }))

        const planOptionsArray: FilterOption[] = planFilterRef.current.map((p) => ({
          text: p.text,
          label: p.text,
          value: p.value
        }))

        setPlanOptions(planOptionsArray)
      } else {
        setPlanOptions([
          { text: 'No plans available', label: 'No plans available', value: 'no-plans' }
        ])
      }
    } catch (error) {
      console.error('Error fetching plan list:', error)
      setPlanOptions([
        { text: 'Error loading plans', label: 'Error loading plans', value: 'error' }
      ])
    } finally {
      setPlanLoading(false)
    }
  }


  const fetchCreditNoteList = async () => {
    setLoading(true)
    try {
      const requestData: CreditNoteListRequest = {
        ...filters,
        page: currentPage - 1, // API starts from 0
        count: pageSize,
        sortField: filters.sortField || 'gmt_modify',
        sortType: filters.sortType || 'desc'
      }



      // Call API
      const [result, error] = await getCreditNoteListReq(requestData)

      if (error) {
        throw error
      }

      if (result) {
        setCreditNoteList(result.creditNotes)
        setTotal(result.total)

        // Gateway filter options are fetched through dedicated API
      }
    } catch (error) {
      console.error('Error fetching credit note list:', error)
      message.error('Failed to fetch credit note list')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (values: any) => {
    const newFilters: CreditNoteListRequest = {}

    if (values.email) newFilters.searchKey = values.email
    if (values.planIds && values.planIds.length > 0) newFilters.planIds = values.planIds
    if (values.dateRange) {
      // Set start time to 00:00:00 of the day
      newFilters.createTimeStart = values.dateRange[0].startOf('day').unix()
      // Set end time to 23:59:59 of the day to ensure full day filtering
      newFilters.createTimeEnd = values.dateRange[1].endOf('day').unix()
    }

    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleClear = () => {
    form.resetFields()
    setFilters({})
    setCurrentPage(1)
    // Clear table column filter state
    setTableFilters({})
    // Gateway filter options are now static, no need to reset
  }

  const appConfigStore = useAppConfigStore()

  const handleExport = async (type: 'csv' | 'xlsx') => {
    try {
      const exportParams = {
        ...filters,
        page: 0,
        count: total, // Export all data
        sortField: filters.sortField || 'gmt_modify',
        sortType: filters.sortType || 'desc'
      }

      const [result, err] = await exportDataReq({
        task: 'CreditNoteExport',
        payload: exportParams,
        format: type
      })

      if (err) {
        throw err
      }

      message.success(
        'Credit note list is being exported via credit note export, please check task list for progress.'
      )
      appConfigStore.setTaskListOpen(true)
    } catch (error) {
      console.error('Error exporting credit notes:', error)
      message.error(`Failed to export ${type.toUpperCase()} file`)
    }
  }

  const getStatusText = (status: number) => {
    const statusMap: Record<number, string> = {
      2: 'Processing',
      3: 'Completed',
      4: 'Failed',
      5: 'Cancelled'
    }
    return statusMap[status] || 'Unknown'
  }



  const columns: ColumnsType<CreditNote> = [
    {
      title: 'Invoice ID',
      key: 'invoiceId',
      width: 180,
      minWidth: 160,
      ellipsis: true,
      fixed: 'left',
      align: 'left',
      render: (_, record: CreditNote) => {
        const invoiceId = record.invoiceId || 'N/A'
        return (
          <div className="min-w-0 flex items-center gap-2">
            <Tooltip title="Click to view invoice PDF">
              <span
                className="font-medium text-blue-600 truncate-text block cursor-pointer hover:text-blue-800"
                onClick={() => {
                  // Navigate to invoice page, adjust according to actual routing
                  window.open(`/invoice/${record.invoiceId}`, '_blank')
                }}
              >
                {/* <FileTextOutlined className="mr-1" /> */}
                {invoiceId}
              </span>
            </Tooltip>
            <Tooltip title="Copy Invoice ID">
              <CopyOutlined
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(invoiceId)
                  message.success('Invoice ID copied to clipboard')
                }}
              />
            </Tooltip>
          </div>
        )
      }
    },
    {
      title: 'Email',
      key: 'email',
      width: 180,
      minWidth: 150,
      ellipsis: true,
      fixed: 'left',
      align: 'left',
      render: (_, record: CreditNote) => {
        let email = 'N/A'
        let userId = null

        // Try to get email and user ID from userSnapshot
        if (record.userSnapshot?.email) {
          email = record.userSnapshot.email
          userId = record.userSnapshot.id
        }
        // If not in userSnapshot, try to parse from originalPaymentInvoice.data
        else if (record.originalPaymentInvoice?.data) {
          try {
            const userData = JSON.parse(record.originalPaymentInvoice.data)
            if (userData.email) {
              email = userData.email
            }
            if (userData.userId) {
              userId = userData.userId
            }
          } catch (e) {
            console.warn('Failed to parse user data:', e)
          }
        }

        // If still no userId, use userId from record
        if (!userId && record.userId) {
          userId = record.userId
        }

        return (
          <div className="min-w-0">
            <Tooltip title="Click to view user details">
              <span
                className="font-medium text-blue-600 truncate-text block cursor-pointer hover:text-blue-800"
                onClick={() => {
                  if (userId) {
                    // Navigate to user detail page, adjust according to actual routing
                    window.open(`/user/${userId}`, '_blank')
                  } else {
                    message.warning('User ID not available')
                  }
                }}
              >
                {email}
              </span>
            </Tooltip>
          </div>
        )
      }
    },
    {
      title: 'Plan Name',
      dataIndex: ['planSnapshot', 'plan', 'planName'],
      key: 'planName',
      width: 150,
      minWidth: 100,
      ellipsis: true,
      align: 'left',
      filters: planFilterRef.current,
      filteredValue: tableFilters.planName || null,
      filterSearch: (input, record) =>
        String(record.text).toLowerCase().includes(input.toLowerCase()),
      render: (planName: string, record: CreditNote) => (
        <div className="min-w-0">
          <div className="font-medium truncate-text" title={planName}>{planName}</div>
          <Tooltip title={`ID: ${record.subscriptionId}`}>
            <div className="text-xs text-gray-500 truncate-text cursor-help">
              ID: {record.subscriptionId}
            </div>
          </Tooltip>
        </div>
      )
    },
    {
      title: 'Cycle Period',
      key: 'cyclePeriod',
      width: 100,
      minWidth: 80,
      ellipsis: true,
      align: 'left',
      render: (_, record: CreditNote) => {
        // Get cycle information from subscription info
        const plan = record.planSnapshot?.plan
        if (plan) {
          const intervalCount = plan.intervalCount || 1
          const intervalUnit = plan.intervalUnit || 'month'
          return (
            <span className="whitespace-nowrap block">
              {intervalCount} {intervalUnit}{intervalCount > 1 ? 's' : ''}
            </span>
          )
        }
        return <span className="whitespace-nowrap block">Monthly</span>
      }
    },
    {
      title: 'Refund Amount',
      key: 'refundAmount',
      width: 140,
      minWidth: 120,
      ellipsis: true,
      align: 'left',
      render: (_, record: CreditNote) => (
        <div className="min-w-0">
          <div className="font-medium text-gary-600 truncate-text">
            {formatPriceDisplay(record.totalAmount, record.currency)}
          </div>
          {record.discountAmount > 0 && (
            <div className="text-xs text-gray-500 truncate-text">
              Discount: {formatPriceDisplay(record.discountAmount, record.currency)}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Refund Date',
      key: 'refundDate',
      width: 120,
      minWidth: 100,
      ellipsis: true,
      align: 'left',
      render: (_, record: CreditNote) => (
        <span className="whitespace-nowrap block">
          {new Date(record.createTime * 1000).toISOString().split('T')[0]}
        </span>
      )
    },
    {
      title: 'Refund Method',
      key: 'refundMethod',
      width: 140,
      minWidth: 120,
      ellipsis: true,
      align: 'left',
      render: (_, record: CreditNote) => {
        // Get refund method from payment gateway information
        const gatewayName = record.gateway?.displayName || 'N/A'
        return (
          <div>
            <span className="whitespace-nowrap max-w-full text-gray-900">
              <span className="truncate-text block" title={gatewayName}>
                {gatewayName}
              </span>
            </span>
          </div>
        )
      },
      filters: gatewayOptions,
      filteredValue: tableFilters.refundMethod || null,
      filterSearch: (input, record) =>
        String(record.text).toLowerCase().includes(input.toLowerCase()),
      onFilter: (value, record) => {
        return record.gateway?.gatewayId === value
      }
    },

    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      minWidth: 100,
      ellipsis: true,
      align: 'left',
      render: (status: number) => {
        // Convert numeric status to string status
        let statusString: 'completed' | 'partial' | 'failed' | 'processing' | 'cancelled'
        switch (status) {
          case 2:
            statusString = 'processing'
            break
          case 3:
            statusString = 'completed'
            break
          case 4:
            statusString = 'failed'
            break
          case 5:
            statusString = 'cancelled' // Cancelled status maps to cancelled
            break
          default:
            statusString = 'processing'
        }
        return <RefundStatusTag status={statusString} />
      },
      filters: statusOptions,
      filteredValue: tableFilters.status || null,
      filterSearch: (input, record) =>
        String(record.text).toLowerCase().includes(input.toLowerCase())
    },
    {
      title: 'Refund Reason',
      key: 'refundReason',
      dataIndex: 'message',
      width: 250,
      minWidth: 200,
      ellipsis: true,
      align: 'left',
      render: (message: string, record: CreditNote) => {
        const refundReason = message || record.message || 'N/A'
        return (
          <Tooltip
            title={refundReason}
            placement="topLeft"
            overlayStyle={{
              maxWidth: '600px',
              wordBreak: 'break-word',
              fontSize: '13px',
              lineHeight: '1.5',
              padding: '12px'
            }}
          >
            <span
              style={{
                cursor: 'pointer',
                fontSize: '13px',
                color: '#374151'
              }}
            >
              {refundReason}
            </span>
          </Tooltip>
        )
      }
    },
  ]

  return (
    <div className="space-y-6">
      {/* 注入响应式表格样式 */}
      <style dangerouslySetInnerHTML={{ __html: tableStyles }} />

      {/* 筛选条件 */}
      <Card className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item label="Email" name="email" className="mb-0">
              <Input
                placeholder="Select email"
                suffix={<SearchOutlined className="text-gray-400" />}
              />
            </Form.Item>

            <Form.Item label="Date Range" name="dateRange" className="mb-0">
              <RangePicker
                className="w-full"
                placeholder={['Start Date', 'End Date']}
              />
            </Form.Item>

            <Form.Item label="Subscription Plans" name="planIds" className="mb-0">
              <Select
                mode="multiple"
                placeholder="Select plans"
                allowClear
                options={planOptions}
                className="w-full"
                loading={planLoading}
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) => {
                  const label = (option?.label ?? '').toString().toLowerCase()
                  return label.includes(input.toLowerCase())
                }}
              />
            </Form.Item>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              icon={<ClearOutlined />}
              onClick={handleClear}
              className="px-6"
            >
              Clear
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              htmlType="submit"
              className="px-6"
            >
              Search
            </Button>
          </div>
        </Form>
      </Card>

      {/* 搜索结果标题和导出按钮 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-medium">Search Results</h3>
        <div className="flex flex-wrap gap-3">
          <ExportButton
            onExportButtonClick={() => handleExport('csv')}
            className="px-4 py-2 text-sm"
          >
            Export CSV
          </ExportButton>
          <ExportButton
            onExportButtonClick={() => handleExport('xlsx')}
            className="px-4 py-2 text-sm"
          >
            Export Excel
          </ExportButton>
        </div>
      </div>

      {/* 表格 */}
      <Card className="shadow-sm">
        <div className="responsive-table-container">
          <Table
            columns={columns}
            dataSource={creditNoteList}
            loading={loading}
            rowKey="id"
            scroll={{
              x: 1350,
              y: 'calc(100vh - 400px)'
            }}
            size="middle"
            className="min-w-full"
            tableLayout="fixed"
            locale={{
              emptyText: (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No Data" />
                </div>
              )
            }}
            onChange={((pagination, filters) => {
              // Handle pagination changes
              if (pagination.current) {
                setCurrentPage(pagination.current)
              }
              if (pagination.pageSize) {
                setPageSize(pagination.pageSize)
              }

              // Handle filter changes
              setTableFilters(filters)

              // Handle planName filter
              if (filters.planName && filters.planName.length > 0) {
                setCurrentPage(1) // Reset to first page when filter changes
                setFilters(prev => ({
                  ...prev,
                  planIds: filters.planName as number[]
                }))
              } else {
                // Clear planIds in filters when planName filter is cleared
                setCurrentPage(1) // Reset to first page when filter is cleared
                setFilters(prev => {
                  const newFilters = { ...prev }
                  delete newFilters.planIds
                  return newFilters
                })
              }

              // Handle status filter
              if (filters.status && filters.status.length > 0) {
                setCurrentPage(1) // Reset to first page when filter changes
                setFilters(prev => ({
                  ...prev,
                  status: filters.status as number[]
                }))
              } else {
                // Clear status in filters when status filter is cleared
                setCurrentPage(1) // Reset to first page when filter is cleared
                setFilters(prev => {
                  const newFilters = { ...prev }
                  delete newFilters.status
                  return newFilters
                })
              }

              // Handle refund method filter
              if (filters.refundMethod && filters.refundMethod.length > 0) {
                setCurrentPage(1) // Reset to first page when filter changes
                setFilters(prev => ({
                  ...prev,
                  gatewayIds: filters.refundMethod as number[]
                }))
              } else {
                // Clear gateway filter when refund method filter is cleared
                setCurrentPage(1) // Reset to first page when filter is cleared
                setFilters(prev => {
                  const newFilters = { ...prev }
                  delete newFilters.gatewayIds
                  return newFilters
                })
              }
            }) as TableProps<CreditNote>['onChange']}
            pagination={false}
          />

          {/* 分页和记录条数 */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="text-gray-600">
              Total {total} records
            </div>
            <Pagination
              current={currentPage}
              total={total}
              pageSize={pageSize}
              showSizeChanger={false}
              showQuickJumper={false}
              responsive={true}
              size="default"
              className="responsive-pagination"
              onChange={(page: number) => {
                if (page) {
                  setCurrentPage(page)
                }
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RefundList 