import React, { useState, useEffect } from 'react'
import { 
  Input, 
  DatePicker, 
  Button, 
  Card, 
  Upload, 
  message, 
  Space,
  Statistic,
  List,
  Divider,
  Pagination,
  Tooltip
} from 'antd'
import { 
  SearchOutlined, 
  CloudUploadOutlined, 
  CopyOutlined,
  DownloadOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { ResponsiveTable } from '@/components/table/responsiveTable'
import { ExportButton } from '../table/exportButton'
import RefundStatusTag from './refundStatusTag'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import { RefundItem, SearchResult, CreditNoteListRequest, CreditNote } from './types'
import { getCreditNoteListReq, uploadCSVAndSearchReq } from '../../requests'
import { exportDataReq } from '../../requests'
import { useAppConfigStore } from '../../stores'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { TextArea } = Input

// format price display, format: $299.00 USD, same as refundList.tsx
const formatPriceDisplay = (amount: number, currency: string) => {
  const appConfigStore = useAppConfigStore.getState()
  const currencyInfo = appConfigStore.supportCurrency.find(c => c.Currency === currency)

  if (!currencyInfo) {
    return `${currency} ${Math.abs(amount).toFixed(2)}`
  }

  const symbol = currencyInfo.Symbol
  const formattedAmount = Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount) / currencyInfo.Scale)

  return `${symbol}${formattedAmount} ${currency}`
}

const BulkSearch: React.FC = () => {
  const [emailInput, setEmailInput] = useState('')
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult>({
    matched: [],
    unmatched: [],
    total: 0,
    uniqueMatchedCount: 0
  })
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [currentSearchParams, setCurrentSearchParams] = useState<CreditNoteListRequest>({})

  const handleSearch = async () => {
    if (!emailInput.trim() && fileList.length === 0) {
      message.warning('Please enter emails or upload a CSV file')
      return
    }

    setLoading(true)
    try {
      let emails: string[] = []
      
      // Parse email input
      if (emailInput.trim()) {
        emails = emailInput
          .split(/[\n,;]/)
          .map(email => email.trim())
          .filter(email => email && email.includes('@'))
      }

      // Validate email format
      if (emails.length === 0) {
        message.warning('No valid email addresses found')
        setLoading(false)
        return
      }

      // Prepare request parameters
      const requestParams: CreditNoteListRequest = {
        emails: emails.join(','),
        page: 0,
        count: 1000, // Set a large count to fetch all results
        sortField: 'gmt_modify',
        sortType: 'desc'
      }

      // Add date range
      if (dateRange && dateRange[0] && dateRange[1]) {
        // Set start time to 00:00:00 of the day
        requestParams.createTimeStart = dayjs(dateRange[0]).startOf('day').unix()
        // Set end time to 23:59:59 of the day to ensure full day filtering
        requestParams.createTimeEnd = dayjs(dateRange[1]).endOf('day').unix()
      }

      // Save current search parameters for export
      setCurrentSearchParams(requestParams)

      let response
      if (fileList.length > 0 && fileList[0].originFileObj) {
        // If there's a file, use the file upload API
        response = await uploadCSVAndSearchReq(fileList[0].originFileObj, requestParams)
      } else {
        // Otherwise use the standard search API
        response = await getCreditNoteListReq(requestParams)
      }

      const [data, error] = response
      
      if (error) {
        message.error(`Search failed: ${error.message}`)
        return
      }

      if (!data) {
        message.error('No data received from API')
        return
      }

      // Check if data is returned
      if (!data.creditNotes || data.creditNotes.length === 0) {
        // No matching records found
        setSearchResults({
          matched: [],
          unmatched: emails,
          total: emails.length,
          uniqueMatchedCount: 0
        })
        message.info('No refund records found for the provided emails')
        return
      }

      // Process API response data
      const matched: RefundItem[] = (data.creditNotes as CreditNote[]).map((creditNote: CreditNote, index: number) => {
        // Get email info - following refundList.tsx implementation
        let email = 'N/A'
        let userId: number | undefined = undefined
        
        if (creditNote.userSnapshot?.email) {
          email = creditNote.userSnapshot.email
          userId = creditNote.userSnapshot.id
        } else if (creditNote.originalPaymentInvoice?.data) {
          try {
            const userData = JSON.parse(creditNote.originalPaymentInvoice.data)
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
        
        // If still no userId, use userId from the record
        if (!userId && creditNote.userId) {
          userId = creditNote.userId
        }

        // Get plan name
        const planName = creditNote.planSnapshot?.plan?.planName || creditNote.productName || 'N/A'
        
        // Get subscription ID
        const subscriptionId = creditNote.subscriptionId || 'N/A'
        
        // Get plan cycle info
        const planIntervalCount = creditNote.planSnapshot?.plan?.intervalCount || 1
        const planIntervalUnit = creditNote.planSnapshot?.plan?.intervalUnit || 'month'
        
        // Handle timestamp conversion - using a safer approach
        const formatTimestamp = (timestamp: number | undefined) => {
          if (!timestamp || timestamp <= 0) return 'N/A'
          try {
            return new Date(timestamp * 1000).toISOString().split('T')[0]
          } catch (e) {
            console.warn('Failed to format timestamp:', timestamp, e)
            return 'N/A'
          }
        }
        

        
        const refundDate = formatTimestamp(creditNote.createTime)
        
        // Get refund method
        const refundMethod = creditNote.gateway?.displayName || creditNote.gateway?.name || 'N/A'
        
        // Get refund reason
        const refundReason = creditNote.message || 'N/A'
        
        return {
          id: creditNote.id.toString(),
          invoiceId: creditNote.invoiceId || 'N/A',
          email,
          userId,
          planName,
          subscriptionId,
          planInterval: `${planIntervalCount} ${planIntervalUnit}${planIntervalCount > 1 ? 's' : ''}`,
          refundAmount: Math.abs(creditNote.totalAmount || 0), // Use absolute value
          currency: creditNote.currency || 'USD',
          refundDate,
          refundMethod,
          refundReason,
          refundStatus: getRefundStatus(creditNote.status),
          merchant: refundMethod,
          // Add plan cycle info
          planIntervalCount,
          planIntervalUnit
        }
      }).filter((item: RefundItem) => item.email !== 'N/A') // Filter out records without valid emails

      // Find unmatched emails
      const allEmails = emails
      const matchedEmails = matched.map(item => item.email).filter(email => email !== 'N/A')
      const unmatched = allEmails.filter(email => !matchedEmails.includes(email))

      // Calculate unique matched email count
      const uniqueMatchedEmails = [...new Set(matchedEmails)]

      // Add debug log
      console.log('Search results:', {
        allEmails,
        matchedEmails,
        uniqueMatchedEmails,
        unmatched,
        totalMatched: matched.length,
        uniqueMatchedCount: uniqueMatchedEmails.length,
        totalUnmatched: unmatched.length
      })

      setSearchResults({
        matched,
        unmatched,
        total: allEmails.length,
        uniqueMatchedCount: uniqueMatchedEmails.length
      })

      message.success(`Search completed. Found ${matched.length} refund records across ${uniqueMatchedEmails.length} email addresses.`)
    } catch (error) {
      console.error('Search error:', error)
      message.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Convert API status code to display status
  const getRefundStatus = (status: number): 'completed' | 'partial' | 'failed' | 'processing' | 'cancelled' => {
    switch (status) {
      case 2:
        return 'processing'
      case 3:
        return 'completed'
      case 4:
        return 'failed'
      case 5:
        return 'cancelled' // Cancelled status maps to cancelled
      default:
        return 'processing' // Default status
    }
  }

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return searchResults.matched.slice(startIndex, endIndex)
  }

  // Handle page change
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page)
    if (size && size !== pageSize) {
      setPageSize(size)
      setCurrentPage(1) // Reset to first page
    }
  }

  const handleClearAll = () => {
    setEmailInput('')
    setDateRange(null)
    setFileList([])
    setSearchResults({
      matched: [],
      unmatched: [],
      total: 0,
      uniqueMatchedCount: 0
    })
    setCurrentPage(1) // Reset page number
  }

  const handleCopyUnmatched = () => {
    const unmatchedText = searchResults.unmatched.join('\n')
    navigator.clipboard.writeText(unmatchedText)
    message.success('Unmatched emails copied to clipboard')
  }

  const handleExportUnmatched = () => {
    const unmatchedText = searchResults.unmatched.join('\n')
    const blob = new Blob([unmatchedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'unmatched_emails.txt'
    a.click()
    URL.revokeObjectURL(url)
    message.success('Unmatched emails exported')
  }

  const appConfigStore = useAppConfigStore()

  const handleExport = async (type: 'csv' | 'xlsx') => {
    if (searchResults.matched.length === 0) {
      message.warning('No matched results to export')
      return
    }

    try {
      // Use current search parameters for export to ensure bulk search results are exported
      const exportParams = {
        ...currentSearchParams,
        page: 0,
        count: searchResults.matched.length, // Export matched results count
        sortField: currentSearchParams.sortField || 'gmt_modify',
        sortType: currentSearchParams.sortType || 'desc'
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
        'Bulk search results are being exported via credit note export, please check task list for progress.'
      )
      appConfigStore.setTaskListOpen(true)
    } catch (error) {
      console.error('Error exporting bulk search results:', error)
      message.error(`Failed to export ${type.toUpperCase()} file`)
    }
  }

  const uploadProps: UploadProps = {
    fileList,
    beforeUpload: (file) => {
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv')
      if (!isCSV) {
        message.error('You can only upload CSV files!')
        return false
      }
      
      // Read CSV file content
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        // from csv file, extract emails, deduplicate and preserve order
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
        const matches = text.match(emailRegex) || []
        const seen = new Set<string>()
        const emails: string[] = []
        for (const raw of matches) {
          const email = raw.trim()
          if (email && !seen.has(email)) {
            seen.add(email)
            emails.push(email)
          }
        }
        if (emails.length === 0) {
          message.warning('No valid email addresses found in CSV')
          return
        }
        setEmailInput(emails.join('\n'))
        message.success(`Loaded ${emails.length} emails from CSV`)
      }
      reader.readAsText(file)
      
      return false // Prevent automatic upload
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList)
    },
    onRemove: () => {
      setFileList([])
    }
  }

  const columns: ColumnsType<RefundItem> = [
    {
      title: 'Invoice ID',
      key: 'invoiceId',
      width: 180,
      minWidth: 160,
      ellipsis: true,
      align: 'left',
      render: (_, record: RefundItem) => {
        const invoiceId = record.invoiceId || 'N/A'
        return (
          <div className="min-w-0 flex items-center gap-2">
            <Tooltip title="Click to view invoice PDF">
              <span 
                className="font-medium text-blue-600 truncate-text block cursor-pointer hover:text-blue-800"
                onClick={() => {
                  // Navigate to invoice page, adjust routing as needed
                  window.open(`/invoice/${record.invoiceId}`, '_blank')
                }}
              >
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
      align: 'left',
      render: (_, record: RefundItem) => {
        const email = record.email || ''
        const userId = record.userId
        
        return (
          <div className="min-w-0">
            <Tooltip title="Click to view user details">
              <span 
                className="font-medium text-blue-600 truncate-text block cursor-pointer hover:text-blue-800"
                onClick={() => {
                  if (userId) {
                    // Navigate to user detail page, adjust routing as needed
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
      dataIndex: 'planName',
      key: 'planName',
      width: 150,
      minWidth: 100,
      ellipsis: true,
      align: 'left',
      render: (planName: string, record: RefundItem) => (
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
      render: (_, record: RefundItem) => {
        // Display plan cycle info, consistent with refundList.tsx
        if (record.planIntervalCount && record.planIntervalUnit) {
          const intervalCount = record.planIntervalCount
          const intervalUnit = record.planIntervalUnit
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
      render: (_, record: RefundItem) => (
        <div className="min-w-0">
          <div className="font-medium text-gary-600 truncate-text">
            {formatPriceDisplay(record.refundAmount, record.currency)}
          </div>
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
      render: (_, record: RefundItem) => (
        <span className="whitespace-nowrap block">
          {record.refundDate}
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
      render: (_, record: RefundItem) => {
        const gatewayName = record.refundMethod || 'N/A'
        return (
          <div>
            <span className="whitespace-nowrap max-w-full text-gray-900">
              <span className="truncate-text block" title={gatewayName}>
                {gatewayName}
              </span>
            </span>
          </div>
        )
      }
    },
    {
      title: 'Refund Status',
      dataIndex: 'refundStatus',
      key: 'refundStatus',
      width: 120,
      minWidth: 100,
      ellipsis: true,
      align: 'left',
      render: (status: string) => <RefundStatusTag status={status} />
    },
    {
      title: 'Refund Reason',
      key: 'refundReason',
      dataIndex: 'message',
      width: 250,
      minWidth: 200,
      ellipsis: true,
      align: 'left',
      render: (_, record: RefundItem) => {
        const refundReason = record.refundReason || 'N/A'
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
    }
  ]

  return (
    <div className="space-y-6">
      {/* Inject responsive table styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .truncate-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
          display: block;
        }
        
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
        
        /* Remove alternating background color for table rows */
        .responsive-table-container .ant-table-tbody > tr:nth-child(even) > td {
          background-color: #ffffff !important;
        }
        
        .responsive-table-container .ant-table-tbody > tr:nth-child(odd) > td {
          background-color: #ffffff !important;
        }
        
        /* Hover effect */
        .responsive-table-container .ant-table-tbody > tr:hover > td {
          background-color: #fafafa !important;
        }
      ` }} />
      
      {/* Preview area */}
      <div>
        <h3 className="text-lg font-medium mb-4">Preview</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email input */}
          <div>
            <h4 className="text-base font-medium mb-3">Email Input</h4>
            <TextArea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Paste or type email addresses separated by line breaks or commas.&#10;Examples:&#10;user1@example.com, user2@example.com&#10;user3@example.com&#10;user4@example.com"
              style={{ height: 160, resize: 'none' }}
              className="mb-2"
            />
            <div className="text-sm text-gray-500 mb-4">
              Support multiple emails, separated by line breaks or commas
            </div>
            <div className="flex justify-end">
              <Button 
                type="link" 
                onClick={() => setEmailInput('')}
                className="text-gray-500"
              >
                clear all
              </Button>
            </div>
          </div>

          {/* CSV upload */}
          <div>
            <h4 className="text-base font-medium mb-3">Or Upload CSV File</h4>
            <div style={{ height: 160, border: '2px dashed #d9d9d9', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
              <Upload
                {...uploadProps}
                showUploadList={false}
                style={{ width: '100%', height: '100%' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }}>
                  <CloudUploadOutlined className="text-4xl text-yellow-500 mb-2" />
                  <p className="text-base text-gray-600 mb-4">
                    Drag CSV file here, or click to select file
                  </p>
                  <Button 
                    type="primary" 
                    className="px-6"
                  >
                    Select File
                  </Button>
                </div>
              </Upload>
            </div>
          </div>
        </div>

        {/* Date range filter */}
        <div className="mt-6">
          <h4 className="text-base font-medium mb-3">Refund Date Range (Optional)</h4>
          <RangePicker
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(dates) => {
              if (dates) {
                setDateRange([
                  dates[0]?.format('YYYY-MM-DD') || '',
                  dates[1]?.format('YYYY-MM-DD') || ''
                ])
              } else {
                setDateRange(null)
              }
            }}
            placeholder={['Start Date', 'End Date']}
            className="w-80"
          />
        </div>

        {/* Search button */}
        <div className="mt-6">
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
            className="px-6"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Search results statistics */}
      {searchResults.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center">
            <Statistic
              title="Total Emails"
              value={searchResults.total}
              className="text-gray-600"
            />
          </Card>
          <Card className="text-center">
            <Statistic
              title="Matched Emails"
              value={searchResults.uniqueMatchedCount || 0}
              className="text-yellow-600"
            />
          </Card>
          <Card className="text-center">
            <Statistic
              title="Unmatched Emails"
              value={searchResults.unmatched.length}
              className="text-red-600"
            />
          </Card>
        </div>
      )}

      {/* Unmatched email list */}
      {searchResults.unmatched.length > 0 && (
        <Card className="shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Unmatched Email List</h3>
            <Space>
              <Button 
                icon={<CopyOutlined />} 
                onClick={handleCopyUnmatched}
                className="px-4"
              >
                Copy
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleExportUnmatched}
                className="px-4"
              >
                Export
              </Button>
            </Space>
          </div>
          <List
            dataSource={searchResults.unmatched}
            renderItem={(email) => (
              <List.Item>
                <span className="text-gray-700">{email}</span>
              </List.Item>
            )}
            className="max-h-40 overflow-y-auto"
          />
        </Card>
      )}

      {/* Search results table */}
      {searchResults.matched.length > 0 && (
        <>
          <Divider />
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Search Results</h3>
            <Space>
              <ExportButton
                onExportButtonClick={() => handleExport('csv')}
                className="px-4"
              >
                Export CSV
              </ExportButton>
              <ExportButton
                onExportButtonClick={() => handleExport('xlsx')}
                className="px-4"
              >
                Export Excel
              </ExportButton>
            </Space>
          </div>
          
          <Card className="shadow-sm">
            <div className="responsive-table-container">
              <ResponsiveTable
                columns={columns}
                dataSource={getCurrentPageData()}
                rowKey="id"
                pagination={false}
                scroll={{ 
                  x: 1350,
                  y: 'calc(100vh - 400px)'
                }}
                size="middle"
                className="min-w-full"
                tableLayout="fixed"
              />
            </div>
            
            {/* Pagination and record count */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="text-gray-600">
                Total {searchResults.matched.length} records
              </div>
              <Pagination
                current={currentPage}
                total={searchResults.matched.length}
                pageSize={pageSize}
                showSizeChanger={false}
                showQuickJumper={false}
                responsive={true}
                size="default"
                className="responsive-pagination"
                onChange={(page: number) => {
                  setCurrentPage(page)
                }}
              />
            </div>
          </Card>
        </>
      )}

      {/* Clear button */}
      {searchResults.total > 0 && (
        <div className="flex justify-center">
          <Button 
            onClick={handleClearAll}
            className="px-6"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}

export default BulkSearch 