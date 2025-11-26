import { SUBSCRIPTION_STATUS, USER_STATUS } from '@/constants'
import { formatDate } from '@/helpers'
import { usePagination } from '@/hooks'
import { exportDataReq, getPlanList, getUserListReq } from '@/requests'
import '@/shared.css'
import {
  IPlan,
  IProfile,
  PlanStatus,
  PlanType,
  SubscriptionStatus
} from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import {
  ExportOutlined,
  ImportOutlined,
  LoadingOutlined,
  SearchOutlined,
  SyncOutlined,
  FilterOutlined,
  PlusOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Form,
  FormInstance,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Tooltip,
  message,
  Tag
} from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ImportModal from '../shared/dataImportModal'
import LongTextPopover from '../ui/longTextPopover'
import { SubscriptionStatusTag, UserStatusTag } from '../ui/statusTag'
import CreateUserModal from './createUserModal'
import './list.css'
import ResponsiveTable from '../table/responsiveTable'
import CopyToClipboard from '../ui/copyToClipboard'

const BASE_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10
const USER_STATUS_FILTER = Object.entries(USER_STATUS).map((s) => {
  const [value, { label }] = s
  return { value: Number(value), text: label }
})

const SUB_STATUS_FILTER = Object.entries(SUBSCRIPTION_STATUS)
  .map((s) => {
    const [value, { label }] = s
    return { value: Number(value), text: label }
  })
  .filter(({ value }) => value != SubscriptionStatus.INITIATING)
// INITIATING status is used as a placeholder in this component when user has no active subscription, no need to show it in filter.

type TFilters = {
  status: number[] | null
  subStatus: number[] | null
  planIds: number[] | null
}

const Index = () => {
  const navigate = useNavigate()
  const appConfig = useAppConfigStore()
  const { page, onPageChange } = usePagination()
  const [importModalOpen, setImportModalOpen] = useState(false)
  const toggleImportModal = () => setImportModalOpen(!importModalOpen)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [filters, setFilters] = useState<TFilters>({
    status: null,
    subStatus: null,
    planIds: null
  })
  const planFilterRef = useRef<{ value: number; text: string }[]>([])

  const [newUserModalOpen, setNewUserModalOpen] = useState(false)
  const toggleNewUserModal = () => setNewUserModalOpen(!newUserModalOpen)
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [users, setUsers] = useState<IProfile[]>([])
  const [form] = Form.useForm()
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const normalizeSearchTerms = (overrideSearchKey?: string) => {
    const start = form.getFieldValue('createTimeStart')
    const end = form.getFieldValue('createTimeEnd')
    const searchTerms = JSON.parse(JSON.stringify(form.getFieldsValue()))
    Object.keys(searchTerms).forEach(
      (k) =>
        (searchTerms[k] == undefined ||
          (typeof searchTerms[k] == 'string' && searchTerms[k].trim() == '')) &&
        delete searchTerms[k]
    )
    if (start != null) {
      searchTerms.createTimeStart = start.hour(0).minute(0).second(0).unix()
    }
    if (end != null) {
      searchTerms.createTimeEnd = end.hour(23).minute(59).second(59).unix()
    }

    // Add search text using searchKey parameter
    const sk = overrideSearchKey !== undefined ? overrideSearchKey : searchText
    if (sk && sk.trim() !== '') {
      searchTerms.searchKey = sk.trim()
    }

    return searchTerms
  }

  const fetchData = async (overrideSearchKey?: string) => {
    setLoading(true)
    const [res, err] = await getUserListReq(
      {
        page,
        count: pageSize,
        ...normalizeSearchTerms(overrideSearchKey),
        ...filters
      },
      fetchData
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { userAccounts, total } = res
    setUsers(userAccounts ?? [])
    setTotal(total)
  }

  const fetchPlan = async () => {
    setLoadingPlans(true)
    const [planList, err] = await getPlanList(
      {
        // type: [PlanType.MAIN],
        status: [PlanStatus.ACTIVE],
        page: page,
        count: 500
      },
      fetchPlan
    )
    setLoadingPlans(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { plans } = planList
    planFilterRef.current =
      plans == null
        ? []
        : plans.map((p: IPlan) => ({
            value: p.plan?.id,
            text: p.plan?.planName
          }))
  }

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    payload = { ...payload, ...filters }

    setExporting(true)
    const [_, err] = await exportDataReq({ task: 'UserExport', payload })
    setExporting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(
      'User list is being exported, please check task list for progress.'
    )
    appConfig.setTaskListOpen(true)
  }

  const getColumns = (): ColumnsType<IProfile> => [
    {
      title: 'User ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => (
        <div className="flex items-center gap-1">
          <span>{id}</span>
          <CopyToClipboard content={String(id)} />
        </div>
      )
    },
    {
      title: 'Name',
      dataIndex: 'firstName',
      key: 'userName',
      render: (_, user) => user.firstName + ' ' + user.lastName
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'External User ID',
      dataIndex: 'externalUserId',
      key: 'externalUserId',
      render: (externalUserId) => (
        externalUserId ? (
          <div className="flex items-center gap-1">
            <Tooltip title={externalUserId}>
              <div
                style={{
                  maxWidth: '120px',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {externalUserId}
              </div>
            </Tooltip>
            <CopyToClipboard content={externalUserId} />
          </div>
        ) : null
      )
    },

    {
      title: 'Subscription Plan',
      dataIndex: 'subscriptionName',
      key: 'planIds',
      width: 132,
      render: (planName) => (
        <div className="w-28 overflow-hidden whitespace-nowrap">
          <LongTextPopover text={planName} placement="topLeft" width="132px" />
        </div>
      )
    },
    {
      title: 'Sub ID',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (subId, _) => 
        subId ? (
          <div className="flex items-center gap-1">
            <Tooltip title={subId}>
              <div
                style={{
                  width: '100px',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {subId}
              </div>
            </Tooltip>
            <CopyToClipboard content={subId} />
          </div>
        ) : null
    },
    {
      title: 'Sub Status',
      dataIndex: 'subscriptionStatus',
      key: 'subStatus',
      render: (subStatus, _) => SubscriptionStatusTag(subStatus)
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => (d === 0 ? '―' : formatDate(d)) // dayjs(d * 1000).format('YYYY-MMM-DD')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, _) => UserStatusTag(status)
    },
    {
      title: 'Actions',
      width: 128,
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/user/${record.id}`)}
          style={{ padding: 0 }}
        >
          Edit
        </Button>
      )
    }
  ]

  // search should always start with page 0(it shows ?page=1 on URL)
  // search result might have fewer records than pageSize(only visible on page=1), it will be empty from page=2
  const goSearch = (overrideSearchKey?: string) => {
    if (page == 0) {
      fetchData(overrideSearchKey)
    } else {
      onPageChange(1, pageSize)
    }
  }

  const clearFilters = () => {
    setFilters({ status: null, subStatus: null, planIds: null })
    form.resetFields()
    setSearchText('')
  }

  // Get active filter count and labels
  const getActiveFilters = () => {
    const activeFilters: { key: string; label: string; value: any; type: string }[] = []
    
    // Sub Status filters
    if (filters.subStatus && filters.subStatus.length > 0) {
      filters.subStatus.forEach(status => {
        const statusLabel = SUB_STATUS_FILTER.find(s => s.value === status)?.text
        if (statusLabel) {
          activeFilters.push({ key: `subStatus-${status}`, label: `${statusLabel} (Sub)`, value: status, type: 'subStatus' })
        }
      })
    }
    
    // User Status filters
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach(status => {
        const statusLabel = USER_STATUS_FILTER.find(s => s.value === status)?.text
        if (statusLabel) {
          activeFilters.push({ key: `status-${status}`, label: statusLabel, value: status, type: 'status' })
        }
      })
    }
    
    // Plan filters
    if (filters.planIds && filters.planIds.length > 0) {
      filters.planIds.forEach(planId => {
        const planLabel = planFilterRef.current.find(p => p.value === planId)?.text
        if (planLabel) {
          // Truncate long plan names
          const shortLabel = planLabel.length > 20 ? planLabel.substring(0, 20) + '...' : planLabel
          activeFilters.push({ key: `planIds-${planId}`, label: shortLabel, value: planId, type: 'plan' })
        }
      })
    }
    
    // Date range filters
    const startDate = form.getFieldValue('createTimeStart')
    const endDate = form.getFieldValue('createTimeEnd')
    if (startDate || endDate) {
      const startStr = startDate ? startDate.format('MMM DD') : ''
      const endStr = endDate ? endDate.format('MMM DD') : ''
      const startYear = startDate ? startDate.year() : null
      const endYear = endDate ? endDate.year() : null
      
      // Check if dates span different years
      const isYearSpanning = startYear != null && endYear != null && startYear !== endYear
      
      let dateLabel = ''
      if (startStr && endStr) {
        if (isYearSpanning) {
          dateLabel = `${startDate.format('MMM DD, YYYY')} ~ ${endDate.format('MMM DD, YYYY')}`
        } else {
          dateLabel = `${startStr} ~ ${endStr}`
        }
      } else if (startStr) {
        dateLabel = `From ${startStr}${startYear && endYear === null ? `, ${startYear}` : ''}`
      } else if (endStr) {
        dateLabel = `Until ${endStr}${endYear && startYear === null ? `, ${endYear}` : ''}`
      }
      
      if (dateLabel) {
        activeFilters.push({ key: 'dateRange', label: dateLabel, value: 'dateRange', type: 'date' })
      }
    }
    
    return activeFilters
  }

  const removeFilter = (filterKey: string) => {
    if (filterKey.startsWith('subStatus-')) {
      const status = Number(filterKey.replace('subStatus-', ''))
      const newSubStatus = filters.subStatus?.filter(s => s !== status) || []
      setFilters({ ...filters, subStatus: newSubStatus.length > 0 ? newSubStatus : null })
      form.setFieldValue('subStatus', newSubStatus.length > 0 ? newSubStatus : undefined)
    } else if (filterKey.startsWith('status-')) {
      const status = Number(filterKey.replace('status-', ''))
      const newStatus = filters.status?.filter(s => s !== status) || []
      setFilters({ ...filters, status: newStatus.length > 0 ? newStatus : null })
      form.setFieldValue('status', newStatus.length > 0 ? newStatus : undefined)
    } else if (filterKey.startsWith('planIds-')) {
      const planId = Number(filterKey.replace('planIds-', ''))
      const newPlanIds = filters.planIds?.filter(p => p !== planId) || []
      setFilters({ ...filters, planIds: newPlanIds.length > 0 ? newPlanIds : null })
      form.setFieldValue('planIds', newPlanIds.length > 0 ? newPlanIds : undefined)
    } else if (filterKey === 'dateRange') {
      form.setFieldsValue({ createTimeStart: undefined, createTimeEnd: undefined })
      // Trigger refetch
      if (page === 0) {
        fetchData()
      } else {
        onPageChange(1, pageSize)
      }
    }
  }

  const activeFilters = getActiveFilters()
  const filterCount = activeFilters.length

  const onTableChange: TableProps<IProfile>['onChange'] = (
    pagination,
    filters,
    _sorter,
    _extra
  ) => {
    const newPageSize = pagination.pageSize || PAGE_SIZE
    const newPage = pagination.current || 1
    
    // If pageSize changed, reset to page 1
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      onPageChange(1, newPageSize)
    } else {
      onPageChange(newPage, newPageSize)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters, page, pageSize])

  useEffect(() => {
    fetchPlan()
  }, [])

  return (
    <div className="bg-gray-50 min-h-screen">
      {newUserModalOpen && (
        <CreateUserModal closeModal={toggleNewUserModal} refresh={fetchData} />
      )}
      {importModalOpen && (
        <ImportModal
          closeModal={toggleImportModal}
          importType="UserImport"
        />
      )}

      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold mb-6">User List</h1>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2" style={{ maxWidth: '520px', flex: 1 }}>
              <Input
                placeholder="Search by User ID, Email, Sub ID or External User ID"
                value={searchText}
                onChange={(e) => {
                  const next = e.target.value
                  setSearchText(next)
                  const isClearClick =
                    (e as any).nativeEvent?.type === 'click' || (e as any).type === 'click'
                  if (isClearClick && next === '') {
                    goSearch('')
                  }
                }}
                onPressEnter={() => goSearch()}
                size="large"
                allowClear
                style={{ flex: 1 }}
              />
                <Button
                type="primary"
                icon={<SearchOutlined />}
                  onClick={() => goSearch()}
                size="large"
                style={{
                  backgroundColor: '#FFD700',
                  borderColor: '#FFD700',
                  color: '#000',
                }}
              />
            </div>
            
            {/* Filter Button */}
            <div style={{ position: 'relative' }}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                size="large"
                className="flex items-center"
                style={{
                  borderRadius: '8px',
                  padding: '4px 16px',
                  height: '40px'
                }}
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

              {/* Filter Panel - Floating */}
              {filterDrawerOpen && (
                <>
                  {/* Overlay */}
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999
                    }}
                    onClick={() => setFilterDrawerOpen(false)}
                  />
                  
                  {/* Filter Panel */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '400px',
                      zIndex: 1000
                    }}
                    className="bg-white rounded-lg shadow-xl border border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-6">Filters</h3>
                      <Form form={form} layout="vertical">
                        {/* Subscription Plan */}
                        <Form.Item label="Subscription Plan" name="planIds" style={{ marginBottom: '20px' }}>
                          <Select
                            placeholder="Choose a Subscription Plan"
                            allowClear
                            mode="multiple"
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                            }
                            options={planFilterRef.current.map(p => ({ label: p.text, value: p.value }))}
                          />
                        </Form.Item>

                        {/* Sub Status */}
                        <Form.Item label="Sub Status" name="subStatus" style={{ marginBottom: '20px' }}>
                          <Select
                            placeholder="Choose a Sub Status"
                            allowClear
                            mode="multiple"
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                            }
                            options={SUB_STATUS_FILTER.map(s => ({ label: s.text, value: s.value }))}
                          />
                        </Form.Item>

                        {/* Status */}
                        <Form.Item label="Status" name="status" style={{ marginBottom: '20px' }}>
                          <Select
                            placeholder="Choose a Status"
                            allowClear
                            mode="multiple"
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                            }
                            options={USER_STATUS_FILTER.map(s => ({ label: s.text, value: s.value }))}
                          />
                        </Form.Item>

                        {/* Account created */}
                        <Form.Item label="Account created" style={{ marginBottom: '20px' }}>
                          <div className="flex items-center gap-2">
                            <Form.Item name="createTimeStart" noStyle>
                              <DatePicker
                                placeholder="From"
                                format="YYYY-MM-DD"
                                disabledDate={(d) => d.isAfter(new Date())}
                                style={{ flex: 1 }}
                              />
                            </Form.Item>
                            <span className="text-gray-400">-</span>
                            <Form.Item
                              name="createTimeEnd"
                              noStyle
                              rules={[
                                {
                                  required: false,
                                  message: 'Must be later than start date.'
                                },
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    const start = getFieldValue('createTimeStart')
                                    if (null == start || value == null) {
                                      return Promise.resolve()
                                    }
                                    return value.isAfter(start) || value.isSame(start, 'day')
                                      ? Promise.resolve()
                                      : Promise.reject('Must be same or later than start date')
                                  }
                                })
                              ]}
                            >
                              <DatePicker
                                placeholder="To"
                                format="YYYY-MM-DD"
                                disabledDate={(d) => d.isAfter(new Date())}
                                style={{ flex: 1 }}
                              />
                            </Form.Item>
                          </div>
                        </Form.Item>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 mt-6">
                          <Button
                            onClick={() => setFilterDrawerOpen(false)}
                            size="large"
                          >
                            Close
                          </Button>
                          <Button
                            type="primary"
                            size="large"
                            onClick={() => {
                              // Apply filters from form
                              const formValues = form.getFieldsValue()
                              
                              // Reset to page 1 if not already there
                              if (page !== 0) {
                                onPageChange(1, pageSize)
                              }
                              
                              setFilters({
                                status: formValues.status || null,
                                subStatus: formValues.subStatus || null,
                                planIds: formValues.planIds || null
                              })
                              
                              setFilterDrawerOpen(false)
                            }}
                            style={{
                              backgroundColor: '#FFD700',
                              borderColor: '#FFD700',
                              color: '#000',
                              fontWeight: 500,
                            }}
                          >
                            Save Filters
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Active Filters Display - Below Search Bar */}
          {activeFilters.length > 0 && (
            <div 
              className="mt-4 flex items-center gap-2 flex-wrap"
            >
              {activeFilters.map(filter => (
                <Tag
                  key={filter.key}
                  closable
                  onClose={() => removeFilter(filter.key)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '13px',
                    borderRadius: '16px',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f5',
                    display: 'inline-flex',
                    alignItems: 'center',
                    margin: 0,
                    marginBottom: '4px'
                  }}
                >
                  {filter.label}
                </Tag>
              ))}
              <span
                onClick={clearFilters}
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
        </div>

        {/* Records Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Records</h2>
              <div className="flex items-center gap-3">
                <Button
                  icon={<SyncOutlined />}
                  onClick={() => fetchData()}
                  disabled={loading}
                  className="flex items-center"
                >
                  Refresh
                </Button>
                <Button
                  icon={<ImportOutlined />}
                  onClick={toggleImportModal}
                  disabled={loading}
                  className="flex items-center"
                >
                  Import
                </Button>
                <Button
                  icon={<ExportOutlined />}
                  onClick={exportData}
                  loading={exporting}
                  disabled={loading || exporting}
                  className="flex items-center"
                >
                  Export
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={toggleNewUserModal}
                  style={{
                    backgroundColor: '#FFD700',
                    borderColor: '#FFD700',
                    color: '#000',
                    fontWeight: 500,
                  }}
                >
                  New User
                </Button>
              </div>
            </div>
          </div>

          {loadingPlans ? (
            <Spin
              indicator={<LoadingOutlined spin />}
              size="large"
              style={{
                width: '100%',
                height: '320px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          ) : (
            <ResponsiveTable
              columns={getColumns()}
              dataSource={users}
              onChange={onTableChange}
              rowKey={'id'}
              className="user-list-table"
              pagination={{
                current: page + 1,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                locale: { items_per_page: '' },
                disabled: loading,
                className: 'user-list-pagination',
              }}
              loading={{
                spinning: loading,
                indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
              }}
              scroll={{ x: 1400 }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Index
