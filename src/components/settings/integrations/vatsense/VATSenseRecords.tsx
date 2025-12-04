import { ArrowLeftOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import { Button, DatePicker, Input, Select, Tag, Tooltip, message } from 'antd'
import type { TableProps } from 'antd';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ResponsiveTable from '@/components/table/responsiveTable'
import VATDetailsModal from './VATDetailsModal'
import VATCorrectModal from './VATCorrectModal'
import { getVATValidationHistoryReq, type VATNumberValidateHistory } from '@/requests'
import { getSystemInformationReq } from '@/requests/systemService'
import './VATSenseRecords.css'
import dayjs from 'dayjs'

export interface VATRecord {
  key: string;
  id: number;
  merchantId: number;
  vatNumber: string;
  country: string;
  countryCode: string;
  validationStatus: 'success' | 'failure';
  lastOperator: string;
  lastOperatorTime: string;
  manualOverride: 'activated' | 'deactivated' | 'none';
  notes: string;
  errorMessage?: string;
  companyName: string;
  companyAddress: string;
  validateGateway: string;
}

// Helper function to get country name from country code
const getCountryName = (countryCode: string): string => {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

// Convert API data to VATRecord
const convertToVATRecord = (history: VATNumberValidateHistory): VATRecord => {
  return {
    key: String(history.id),
    id: history.id,
    merchantId: history.merchantId,
    vatNumber: history.vatNumber,
    country: history.countryCode,
    countryCode: history.countryCode,
    validationStatus: history.status === 1 ? 'success' : 'failure',
    lastOperator: history.manualValidate ? 'Admin' : 'System',
    lastOperatorTime: dayjs(history.createTime * 1000).format('YYYY-MM-DD HH:mm'),
    manualOverride: history.manualValidate ? 'activated' : 'none',
    notes: history.validateMessage || '',
    errorMessage: history.status === 0 ? history.validateMessage : undefined,
    companyName: history.companyName || '',
    companyAddress: history.companyAddress || '',
    validateGateway: history.validateGateway || 'vatsense',
  }
}

const VATSenseRecords = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<any>(null)
  const [supportedCountries, setSupportedCountries] = useState<string[]>([])
  
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<VATRecord[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<VATRecord | null>(null)

  // Fetch supported countries from system information
  const fetchSupportedCountries = async () => {
    try {
      const [sysInfo, error] = await getSystemInformationReq()
      
      if (error) {
        console.error('Error fetching system information:', error)
        return
      }

      if (sysInfo?.supportCountryCode) {
        setSupportedCountries(Array.isArray(sysInfo.supportCountryCode) ? sysInfo.supportCountryCode : [])
      }
    } catch (err) {
      console.error('Exception in fetchSupportedCountries:', err)
    }
  }

  // Fetch VAT validation history from API
  const fetchVATHistory = async (overrides?: {
    page?: number;
    pageSize?: number;
    searchKey?: string;
    countryCode?: string;
    dateRange?: any;
  }) => {
    setLoading(true)
    try {
      const currentPage = overrides?.page !== undefined ? overrides.page : pagination.current - 1;
      const currentPageSize = overrides?.pageSize !== undefined ? overrides.pageSize : pagination.pageSize;
      const currentSearchKey = overrides?.searchKey !== undefined ? overrides.searchKey : searchText;
      const currentCountryCode = overrides?.countryCode !== undefined ? overrides.countryCode : countryFilter;
      const currentDateRange = overrides?.dateRange !== undefined ? overrides.dateRange : dateRange;
      
      const params = {
        page: currentPage,
        count: currentPageSize,
        searchKey: currentSearchKey || undefined,
        countryCode: currentCountryCode === 'all' ? undefined : currentCountryCode,
        validateGateway: 'vatsense',
        createTimeStart: currentDateRange?.[0] ? dayjs(currentDateRange[0]).startOf('day').unix() : undefined,
        createTimeEnd: currentDateRange?.[1] ? dayjs(currentDateRange[1]).endOf('day').unix() : undefined,
      }

      const [data, error] = await getVATValidationHistoryReq(params)
      
      if (error) {
        message.error('Failed to load VAT validation history')
        console.error('Error fetching VAT history:', error)
        return
      }

      if (data) {
        const records = data.numberValidateHistoryList.map(convertToVATRecord)
        setData(records)
        setPagination(prev => ({ ...prev, total: data.total }))
      }
    } catch (err) {
      message.error('An error occurred while fetching data')
      console.error('Exception in fetchVATHistory:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVATHistory()
    fetchSupportedCountries()
  }, [])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    fetchVATHistory({ page: 0 })
  }

  const handleClear = () => {
    setSearchText('')
    setCountryFilter('all')
    setDateRange(null)
    setPagination(prev => ({ ...prev, current: 1 }))
    
    // Fetch with cleared values directly
    fetchVATHistory({
      page: 0,
      searchKey: '',
      countryCode: 'all',
      dateRange: null,
    })
  }

  const handleTableChange: TableProps<VATRecord>['onChange'] = (newPagination) => {
    const newPage = newPagination.current || 1;
    const newPageSize = newPagination.pageSize || 20;
    
    setPagination(prev => ({
      ...prev,
      current: newPage,
      pageSize: newPageSize,
    }));
    
    // Fetch new data with updated pagination values
    fetchVATHistory({
      page: newPage - 1,
      pageSize: newPageSize,
    })
  };

  const handleViewDetails = (record: VATRecord) => {
    setSelectedRecord(record)
    setIsDetailsModalOpen(true)
  }

  const handleEdit = (record: VATRecord) => {
    setSelectedRecord(record)
    setIsCorrectModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedRecord(null)
  }

  const handleCloseCorrectModal = () => {
    setIsCorrectModalOpen(false)
    setSelectedRecord(null)
  }

  const handleCorrectConfirm = (data: any) => {
    // TODO: Implement save logic
    console.log('Correction confirmed:', data)
    message.success('VAT record corrected successfully')
    // Refresh the list after correction
    fetchVATHistory()
  }

  const columns: TableProps<VATRecord>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'VAT Number',
      dataIndex: 'vatNumber',
      key: 'vatNumber',
      width: 180,
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 150,
      render: (countryCode: string) => (
        <div>
          <div>{getCountryName(countryCode)}</div>
          <div className="text-xs text-gray-400">{countryCode}</div>
        </div>
      ),
    },
    {
      title: 'Validation Status',
      dataIndex: 'validationStatus',
      key: 'validationStatus',
      width: 150,
      render: (status: string) => (
        status === 'success' ? (
          <Tag color="success">Success</Tag>
        ) : (
          <Tag color="error">Failure</Tag>
        )
      ),
    },
    {
      title: 'Last Operator',
      dataIndex: 'lastOperator',
      key: 'lastOperator',
      width: 150,
      render: (operator: string, record: VATRecord) => (
        <div>
          <div>{operator}</div>
          <div className="text-xs text-gray-400">{record.lastOperatorTime}</div>
        </div>
      ),
    },
    // {
    //   title: 'Manual Override',
    //   dataIndex: 'manualOverride',
    //   key: 'manualOverride',
    //   width: 150,
    //   render: (override: string) => {
    //     if (override === 'activated') {
    //       return <Tag color="success">Activated</Tag>
    //     }
    //     if (override === 'deactivated') {
    //       return <Tag color="error">Deactivated</Tag>
    //     }
    //     return <span className="text-gray-400">None</span>
    //   },
    // },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: VATRecord) => (
        <div className="flex items-center gap-3">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined className="text-blue-500" />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Correct">
            <Button
              type="text"
              icon={<EditOutlined className="text-gray-500" />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b px-6 py-4">
        {/* Back Button */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/configuration?tab=integrations')}
          className="text-gray-500 hover:text-gray-700 -ml-2"
        >
          Back to Integrations
        </Button>
      </div>

      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold mb-6">VAT Number Management</h1>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search Input */}
            <div>
              <div className="text-sm text-gray-600 mb-2">Search</div>
              <Input
                placeholder="Search VAT Number, Company Name"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                size="large"
                allowClear
              />
            </div>

            {/* Date Range */}
            <div>
              <div className="text-sm text-gray-600 mb-2">Date</div>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={(range) => setDateRange(range)}
                format="MM.DD.YYYY"
                size="large"
                className="w-full"
                allowClear
              />
            </div>

            {/* Country Filter */}
            <div>
              <div className="text-sm text-gray-600 mb-2">Country</div>
              <Select
                value={countryFilter}
                onChange={setCountryFilter}
                className="w-full"
                size="large"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const label = option?.label;
                  if (typeof label === 'string') {
                    return label.toLowerCase().includes(input.toLowerCase());
                  }
                  return false;
                }}
              >
                <Select.Option value="all">All Countries</Select.Option>
                {supportedCountries.map((countryCode) => (
                  <Select.Option 
                    key={countryCode} 
                    value={countryCode}
                    label={`${getCountryName(countryCode)} (${countryCode})`}
                  >
                    {getCountryName(countryCode)} ({countryCode})
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              size="large"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSearch}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                color: '#fff',
                fontWeight: 500,
              }}
              className="hover:opacity-90"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Data Table */}
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
              className: 'vatsense-pagination',
            }}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 1400 }}
          />
        </div>
      </div>

      <VATDetailsModal
        open={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        record={selectedRecord}
      />

      <VATCorrectModal
        open={isCorrectModalOpen}
        onClose={handleCloseCorrectModal}
        record={selectedRecord}
        onConfirm={handleCorrectConfirm}
      />
    </div>
  )
}

export default VATSenseRecords

