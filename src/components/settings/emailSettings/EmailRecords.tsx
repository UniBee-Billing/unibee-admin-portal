import { CheckOutlined, CloseOutlined, FilterOutlined, MailOutlined, PercentageOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, DatePicker, Input, Row, Select, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useState, useEffect } from 'react'
import EmailDetailsModal from '../integrations/sendgrid/EmailDetailsModal'
import { getEmailHistoryListReq, TEmailHistory, TEmailHistoryStatistics } from '@/requests/emailService'
import dayjs from 'dayjs'
import ResponsiveTable from '@/components/table/responsiveTable'
import '../integrations/sendgrid/SendGridRecords.css'

export interface EmailRecord {
  key: string
  id: number
  sentTime: string
  recipient: string
  subject: string
  status: 'sent' | 'failed' | 'pending'
  channel: string
  failureReason: string
  content: string
}

const EmailRecords = () => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EmailRecord[]>([])
  const [statistics, setStatistics] = useState<TEmailHistoryStatistics>({
    totalSend: 0,
    totalSuccess: 0,
    totalFail: 0
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<EmailRecord | null>(null)

  const mapStatus = (status: 0 | 1 | 2): 'pending' | 'sent' | 'failed' => {
    switch (status) {
      case 0:
        return 'pending'
      case 1:
        return 'sent'
      case 2:
        return 'failed'
    }
  }

  const fetchEmailHistory = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    
    const statusMap: { [key: string]: number[] } = {
      sent: [1],
      failed: [2, 0],
    }

    const params = {
      page: page - 1,
      count: pageSize,
      searchKey: searchText || undefined,
      status: statusFilter !== 'all' ? statusMap[statusFilter] : undefined,
      createTimeStart: dateRange?.[0] ? dayjs(dateRange[0]).startOf('day').unix() : undefined,
      createTimeEnd: dateRange?.[1] ? dayjs(dateRange[1]).endOf('day').unix() : undefined,
    } as Parameters<typeof getEmailHistoryListReq>[0]

    try {
      const [respData] = await getEmailHistoryListReq(params)
      
      if (respData) {
        const formattedData: EmailRecord[] = respData.emailHistories.map((item: TEmailHistory) => ({
          key: String(item.id),
          id: item.id,
          sentTime: dayjs(item.createTime * 1000).format('MM/DD/YYYY, hh:mm A'),
          recipient: item.email,
          subject: item.title,
          status: mapStatus(item.status),
          channel: item.gatewayName || '-',
          failureReason: item.status === 2 ? item.response : '-',
          content: item.content
        }))
        setData(formattedData)
        setStatistics(respData.emailHistoryStatistics)
        setPagination(prev => ({ ...prev, total: respData.total, current: page, pageSize }))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmailHistory(pagination.current, pagination.pageSize)
  }, [])

  const handleFilter = () => {
    fetchEmailHistory(1, pagination.pageSize)
  }

  const handleTableChange: TableProps<EmailRecord>['onChange'] = (newPagination) => {
    const newPage = newPagination.current || 1
    const newPageSize = newPagination.pageSize || 20
    
    setPagination(prev => ({
      ...prev,
      current: newPage,
      pageSize: newPageSize,
    }))
    
    fetchEmailHistory(newPage, newPageSize)
  }

  const handleViewDetails = (record: EmailRecord) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRecord(null)
  }

  const successDenominator = statistics.totalSend > 0
    ? statistics.totalSend
    : (statistics.totalSuccess + statistics.totalFail)
  const successRate = (() => {
    if (successDenominator <= 0) return '0.0'
    const rawRate = (statistics.totalSuccess / successDenominator) * 100
    const truncated = Math.floor(rawRate * 10) / 10
    return truncated.toFixed(1)
  })()

  const columns: TableProps<EmailRecord>['columns'] = [
    {
      title: 'Sent Time',
      dataIndex: 'sentTime',
      key: 'sentTime',
      width: 200,
    },
    {
      title: 'Recipient',
      dataIndex: 'recipient',
      key: 'recipient',
      width: 250,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        if (status === 'sent') {
          return <Tag color="success">Sent</Tag>
        }
        if (status === 'pending') {
          return <Tag color="warning">Pending</Tag>
        }
        return <Tag color="error">Failed</Tag>
      },
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
    },
    {
      title: 'Failure Reason',
      dataIndex: 'failureReason',
      key: 'failureReason',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: EmailRecord) => (
        <Button type="link" size="small" onClick={() => handleViewDetails(record)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="email-records-embedded">
      <div className="mb-6 flex items-center gap-3">
        <Input
          placeholder="Search email or title"
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1 max-w-md"
          size="large"
          allowClear
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-44"
          size="large"
          suffixIcon={<span className="text-gray-400">▼</span>}
        >
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="sent">Sent</Select.Option>
          <Select.Option value="failed">Failed</Select.Option>
        </Select>
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(range) => setDateRange(range as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          allowClear
          placeholder={["Start date", "End date"]}
          size="large"
          className="w-[320px]"
        />
        <Button
          type="primary"
          icon={<FilterOutlined />}
          size="large"
          onClick={handleFilter}
          className="hover:opacity-90"
        >
          Filter
        </Button>
      </div>

      <div className="mb-6 bg-gray-100 rounded-lg p-4">
        <Row gutter={16}>
          <Col span={6}>
            <Card className="shadow-sm" bodyStyle={{ padding: '20px' }}>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                  <MailOutlined className="text-2xl text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Sent</div>
                  <div className="text-3xl font-bold">{statistics.totalSend}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="shadow-sm" bodyStyle={{ padding: '20px' }}>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-50">
                  <CheckOutlined className="text-2xl text-green-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Successful</div>
                  <div className="text-3xl font-bold">{statistics.totalSuccess}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="shadow-sm" bodyStyle={{ padding: '20px' }}>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
                  <CloseOutlined className="text-2xl text-red-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Failed</div>
                  <div className="text-3xl font-bold">{statistics.totalFail}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="shadow-sm" bodyStyle={{ padding: '20px' }}>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-50">
                  <PercentageOutlined className="text-2xl text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Success Rate</div>
                  <div className="text-3xl font-bold">{successRate}%</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <ResponsiveTable
          columns={columns}
          dataSource={data}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            locale: { items_per_page: '' },
            className: 'sendgrid-pagination',
          }}
          loading={loading}
          onChange={handleTableChange}
        />
      </div>

      <EmailDetailsModal
        open={isModalOpen}
        onClose={handleCloseModal}
        record={selectedRecord}
      />
    </div>
  )
}

export default EmailRecords
