import { PAYMENT_STATUS, PAYMENT_TIME_LINE_TYPE } from '@/constants'
import { formatDate, showAmount } from '@/helpers'
import { usePagination } from '@/hooks'
import { exportDataReq, getPaymentTimelineReq } from '@/requests'
import '@/shared.css'
import './paymentTab.css'
import {
  IProfile,
  PaymentItem,
  PaymentStatus,
  PaymentTimelineType
} from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import {
  InfoCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
  SyncOutlined,
  FilterOutlined,
  ExportOutlined,
  SearchOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Form,
  FormInstance,
  Input,
  Popover,
  Row,
  Select,
  Space,
  Spin,
  Tooltip,
  message,
  Tag
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { Currency } from 'dinero.js'
import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RefundInfoModal from '../payment/refundModal'
import ResponsiveTable from '../table/responsiveTable'
import CopyToClipboard from '../ui/copyToClipboard'
import { PaymentStatusTag } from '../ui/statusTag'

const PAGE_SIZE = 10
const STATUS_FILTER = Object.entries(PAYMENT_STATUS).map((s) => {
  const [value, { label }] = s
  return { value: Number(value), text: label }
})
const PAYMENT_TYPE_FILTER = Object.entries(PAYMENT_TIME_LINE_TYPE).map((s) => {
  const [value, { label }] = s
  return { value: Number(value), text: label }
})

type TFilters = {
  status: number[] | null
  timelineTypes: number[] | null
  gatewayIds: number[] | null
}

const Index = ({
  user,
  extraButton,
  embeddingMode,
  enableSearch
}: {
  user?: IProfile | undefined
  extraButton?: ReactElement
  embeddingMode: boolean
  enableSearch?: boolean
}) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const { page, onPageChange, onPageChangeNoParams } = usePagination()
  const [filters, setFilters] = useState<TFilters>({
    status: null,
    timelineTypes: null,
    gatewayIds: null
  })
  const pageChange = embeddingMode ? onPageChangeNoParams : onPageChange
  const appConfigStore = useAppConfigStore()
  const [paymentList, setPaymentList] = useState<PaymentItem[]>([])
  const [paymentIdx, setPaymentIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [standaloneFilters, setStandaloneFilters] = useState<Record<string, any>>({})
  const toggleRefundModal = () => setRefundModalOpen(!refundModalOpen)

  const GATEWAY_FILTER = appConfigStore.gateway.map((g) => ({
    value: g.gatewayId as number,
    text: g.displayName
  }))

  const fetchData = async (overrideSearchKey?: string) => {
    let searchTerm = normalizeSearchTerms(overrideSearchKey)
    if (null == searchTerm) {
      return
    }
    searchTerm.page = page
    searchTerm.count = pageSize
    // Only merge filters state in embedding mode (table column filters)
    // In standalone mode, filters come directly from the form
    if (embeddingMode) {
      searchTerm = { ...searchTerm, ...filters }
    }
    setLoading(true)
    const [res, err] = await getPaymentTimelineReq(searchTerm, () => fetchData())
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { paymentTimeLines, total } = res
    setPaymentList(paymentTimeLines ?? [])
    setTotal(total)
  }
  const goSearch = (overrideSearchKey?: string) => {
    if (page == 0) {
      fetchData(overrideSearchKey)
    } else {
      pageChange(1, PAGE_SIZE)
    }
  }

  const getColumns = (includeFilters: boolean = false): ColumnsType<PaymentItem> => [
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 120,
      render: (id) => (
        <div className="flex items-center gap-1">
          <Tooltip title={id}>
            <div
              style={{
                width: '100px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {id}
            </div>
          </Tooltip>
          <CopyToClipboard content={id} />
        </div>
      )
    },
    {
      title: 'External ID',
      dataIndex: 'externalTransactionId',
      key: 'externalTransactionId',
      width: 120,
      render: (id) => (
        <div className="flex items-center gap-1">
          <Tooltip title={id}>
            <div
              style={{
                width: '100px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {id}
            </div>
          </Tooltip>
          <CopyToClipboard content={id} />
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (amt, pay) => showAmount(amt, pay.currency)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      ...(includeFilters && {
        filters: STATUS_FILTER,
        filteredValue: filters.status
      }),
      render: (status, pay) => (
        <div className="flex items-center gap-2">
          {PaymentStatusTag(status)}
          {status == PaymentStatus.FAILED && (
            <Popover
              placement="right"
              content={
                <div className="min-w-48 max-w-60">
                  {pay.payment.authorizeReason != '' && (
                    <Row>
                      <Col span={8} className="text-xs text-gray-500">
                        Auth reason:
                      </Col>
                      <Col span={16} className="text-sm">
                        {pay.payment.authorizeReason}
                      </Col>
                    </Row>
                  )}
                  {pay.payment.failureReason != '' && (
                    <Row>
                      <Col span={8} className="text-xs text-gray-500">
                        Other:
                      </Col>
                      <Col span={16} className="text-sm">
                        {pay.payment.failureReason}
                      </Col>
                    </Row>
                  )}
                </div>
              }
            >
              <InfoCircleOutlined />
            </Popover>
          )}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'timelineType',
      key: 'timelineTypes',
      width: 100,
      ...(includeFilters && {
        filters: PAYMENT_TYPE_FILTER,
        filteredValue: filters.timelineTypes
      }),
      render: (s: PaymentTimelineType) => {
        const title = PAYMENT_TIME_LINE_TYPE[s].label
        if (s == PaymentTimelineType.REFUND) {
          return (
            <Button
              type="link"
              style={{ padding: 0 }}
              className="btn-refunded-payment"
            >
              {title}
            </Button>
          )
        } else if (s == PaymentTimelineType.PAYMENT) {
          return title
        }
      }
    },
    {
      title: 'Gateway',
      dataIndex: 'gatewayId',
      key: 'gatewayIds',
      width: 120,
      ...(includeFilters && {
        filters: GATEWAY_FILTER,
        filteredValue: filters.gatewayIds
      }),
      render: (gateway) =>
        appConfigStore.gateway.find((g) => g.gatewayId == gateway)?.displayName
    },
    {
      title: 'Sub ID',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      width: 120,
      render: (subId) =>
        subId == '' || subId == null ? (
          ''
        ) : (
          <div className="flex items-center gap-1">
            <Button
              type="link"
              onClick={() => navigate(`/subscription/${subId}`)}
              style={{ padding: 0 }}
              className="overflow-hidden overflow-ellipsis whitespace-nowrap"
            >
              {subId}
            </Button>
            <CopyToClipboard content={subId} />
          </div>
        )
    },
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      width: 140,
      render: (ivId) =>
        ivId == '' || ivId == null ? (
          ''
        ) : (
          <div className="flex items-center gap-1">
            <Button
              onClick={() => navigate(`/invoice/${ivId}`)}
              type="link"
              style={{ padding: 0 }}
              className="overflow-hidden overflow-ellipsis whitespace-nowrap"
            >
              {ivId}
            </Button>
            <CopyToClipboard content={ivId} />
          </div>
        )
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      render: (userId) =>
        userId == '' || userId == null ? (
          ''
        ) : (
          <div className="flex items-center gap-1">
            <Button
              type="link"
              onClick={() => navigate(`/user/${userId}`)}
              style={{ padding: 0 }}
              className="overflow-hidden overflow-ellipsis whitespace-nowrap"
            >
              {userId}
            </Button>
            <CopyToClipboard content={userId.toString()} />
          </div>
        )
    },
    {
      title: 'Created by',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      align: 'left',
      render: (d) => formatDate(d, true)
    }
  ]

  const normalizeSearchTerms = (overrideSearchKey?: string) => {
    const rawFormValues = form.getFieldsValue()
    // In standalone mode, the filter form (drawer) can be closed/unmounted; persist selections
    const mergedValues = !embeddingMode
      ? { ...standaloneFilters, ...rawFormValues }
      : rawFormValues
    const searchTerm = JSON.parse(JSON.stringify(mergedValues))
    Object.keys(searchTerm).forEach(
      (k) =>
        (searchTerm[k] == undefined ||
          (typeof searchTerm[k] == 'string' && searchTerm[k].trim() == '')) &&
        delete searchTerm[k]
    )

    // Add searchKey from search input (for standalone mode)
    const sk = overrideSearchKey !== undefined ? overrideSearchKey : searchText
    if (!embeddingMode && sk && sk.trim() !== '') {
      searchTerm.searchKey = sk.trim()
    }

    if (enableSearch) {
      const start = form.getFieldValue('createTimeStart')
      const end = form.getFieldValue('createTimeEnd')
      if (start != null) {
        searchTerm.createTimeStart = start.hour(0).minute(0).second(0).unix()
      }
      if (end != null) {
        searchTerm.createTimeEnd = end.hour(23).minute(59).second(59).unix()
      }

      // return
      let amtFrom = searchTerm.amountStart,
        amtTo = searchTerm.amountEnd
      if (amtFrom != '' && amtFrom != null) {
        amtFrom =
          Number(amtFrom) *
          appConfigStore.currency[searchTerm.currency as Currency]!.Scale
        if (isNaN(amtFrom) || amtFrom < 0) {
          message.error('Invalid amount-from value.')
          return null
        }
      }
      if (amtTo != '' && amtTo != null) {
        amtTo =
          Number(amtTo) *
          appConfigStore.currency[searchTerm.currency as Currency]!.Scale
        if (isNaN(amtTo) || amtTo < 0) {
          message.error('Invalid amount-to value')
          return null
        }
      }

      if (
        typeof amtFrom == 'number' &&
        typeof amtTo == 'number' &&
        amtFrom > amtTo
      ) {
        message.error('Amount-from must be less than or equal to amount-to')
        return null
      }
      searchTerm.amountStart = amtFrom
      searchTerm.amountEnd = amtTo
    }
    if (user != null) {
      searchTerm.userId = user.id as number
    }
    return searchTerm
  }

  const clearFilters = () => {
    setFilters({ status: null, timelineTypes: null, gatewayIds: null })
    setSearchText('')
    setStandaloneFilters({})
  }

  // Standalone mode filter helpers
  const getStandaloneFilterCount = () => {
    const filters = standaloneFilters
    let count = 0
    if (filters?.status && filters.status.length > 0) count += filters.status.length
    if (filters?.timelineTypes && filters.timelineTypes.length > 0) count += filters.timelineTypes.length
    if (filters?.gatewayIds && filters.gatewayIds.length > 0) count += filters.gatewayIds.length
    if (filters?.createTimeStart || filters?.createTimeEnd) count++
    if ((filters?.amountStart && (filters.amountStart + '').trim() !== '') || (filters?.amountEnd && (filters.amountEnd + '').trim() !== '')) count++
    if (filters?.currency) count++
    return count
  }

  const getStandaloneActiveFilters = () => {
    const activeFilters: { key: string; label: string; value: any; type: string }[] = []
    const filters = standaloneFilters
    
    // Status filters
    if (filters?.status && filters.status.length > 0) {
      filters.status.forEach((status: number) => {
        const statusLabel = STATUS_FILTER.find(s => s.value === status)?.text
        if (statusLabel) {
          activeFilters.push({ key: `status-${status}`, label: statusLabel, value: status, type: 'status' })
        }
      })
    }

    // Timeline Type filters
    if (filters?.timelineTypes && filters.timelineTypes.length > 0) {
      filters.timelineTypes.forEach((type: number) => {
        const typeLabel = PAYMENT_TYPE_FILTER.find(t => t.value === type)?.text
        if (typeLabel) {
          activeFilters.push({ key: `timelineType-${type}`, label: typeLabel, value: type, type: 'timelineType' })
        }
      })
    }

    // Gateway filters
    if (filters?.gatewayIds && filters.gatewayIds.length > 0) {
      filters.gatewayIds.forEach((gatewayId: number) => {
        const gatewayLabel = GATEWAY_FILTER.find(g => g.value === gatewayId)?.text
        if (gatewayLabel) {
          activeFilters.push({ key: `gateway-${gatewayId}`, label: gatewayLabel, value: gatewayId, type: 'gateway' })
        }
      })
    }

    // Date range filters
    if (filters?.createTimeStart || filters?.createTimeEnd) {
      const startStr = filters.createTimeStart ? filters.createTimeStart.format('MMM DD') : ''
      const endStr = filters.createTimeEnd ? filters.createTimeEnd.format('MMM DD') : ''
      const startYear = filters.createTimeStart ? filters.createTimeStart.year() : null
      const endYear = filters.createTimeEnd ? filters.createTimeEnd.year() : null
      
      // Check if dates span different years
      const isYearSpanning = startYear != null && endYear != null && startYear !== endYear
      
      let dateLabel = ''
      if (startStr && endStr) {
        if (isYearSpanning) {
          dateLabel = `${filters.createTimeStart.format('MMM DD, YYYY')} ~ ${filters.createTimeEnd.format('MMM DD, YYYY')}`
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

    // Amount filters
    if ((filters?.amountStart && (filters.amountStart + '').trim() !== '') || (filters?.amountEnd && (filters.amountEnd + '').trim() !== '')) {
      let amountLabel = ''
      if (filters.amountStart && (filters.amountStart + '').trim() !== '' && filters.amountEnd && (filters.amountEnd + '').trim() !== '') {
        amountLabel = `${filters.amountStart}~${filters.amountEnd} ${filters.currency || ''}`
      } else if (filters.amountStart && (filters.amountStart + '').trim() !== '') {
        amountLabel = `From ${filters.amountStart} ${filters.currency || ''}`
      } else if (filters.amountEnd && (filters.amountEnd + '').trim() !== '') {
        amountLabel = `To ${filters.amountEnd} ${filters.currency || ''}`
      }
      if (amountLabel) {
        activeFilters.push({ key: 'amountRange', label: amountLabel, value: 'amountRange', type: 'amount' })
      }
    } else if (filters?.currency) {
      // Show currency as a standalone filter when no amount is specified
      activeFilters.push({ key: 'currency', label: filters.currency, value: filters.currency, type: 'currency' })
    }

    return activeFilters
  }

  const removeStandaloneFilter = (filterKey: string) => {
    if (filterKey.startsWith('status-')) {
      const status = Number(filterKey.replace('status-', ''))
      const currentStatus = form.getFieldValue('status') || []
      const newStatus = currentStatus.filter((s: number) => s !== status)
      form.setFieldValue('status', newStatus.length > 0 ? newStatus : undefined)
    } else if (filterKey.startsWith('timelineType-')) {
      const type = Number(filterKey.replace('timelineType-', ''))
      const currentTypes = form.getFieldValue('timelineTypes') || []
      const newTypes = currentTypes.filter((t: number) => t !== type)
      form.setFieldValue('timelineTypes', newTypes.length > 0 ? newTypes : undefined)
    } else if (filterKey.startsWith('gateway-')) {
      const gatewayId = Number(filterKey.replace('gateway-', ''))
      const currentGateways = form.getFieldValue('gatewayIds') || []
      const newGateways = currentGateways.filter((g: number) => g !== gatewayId)
      form.setFieldValue('gatewayIds', newGateways.length > 0 ? newGateways : undefined)
    } else if (filterKey === 'dateRange') {
      form.setFieldsValue({ createTimeStart: undefined, createTimeEnd: undefined })
    } else if (filterKey === 'amountRange') {
      form.setFieldsValue({ amountStart: undefined, amountEnd: undefined, currency: undefined })
    } else if (filterKey === 'currency') {
      form.setFieldValue('currency', undefined)
    }
    // Persist current form values so pagination keeps the filters
    setStandaloneFilters(form.getFieldsValue())
    // Trigger refetch
    if (page === 0) {
      fetchData()
    } else {
      pageChange(1, pageSize)
    }
  }

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }
    payload = { ...payload, ...filters }

    // return
    setExporting(true)
    const [_, err] = await exportDataReq({
      task: 'TransactionExport',
      payload
    })
    setExporting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(
      'Transaction list is being exported, please check task list for progress.'
    )
    appConfigStore.setTaskListOpen(true)
  }

  const onTableChange: TableProps<PaymentItem>['onChange'] = (
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
      pageChange(1, newPageSize)
    } else {
      pageChange(newPage, newPageSize)
    }

    // Update filters for embedded mode (when column filters are used)
    if (embeddingMode) {
      setFilters(filters as TFilters)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, filters, user])

  if (embeddingMode) {
    // Embedded mode (used within user detail page)
    return (
      <div>
        {refundModalOpen && (
          <RefundInfoModal
            originalInvoiceId={paymentList[paymentIdx].payment.invoiceId}
            closeModal={toggleRefundModal}
            detail={paymentList[paymentIdx].refund!}
            ignoreAmtFactor={false}
          />
        )}
        {enableSearch && (
          <Search
            form={form}
            goSearch={goSearch}
            clearFilters={clearFilters}
            searching={loading}
            exporting={exporting}
            exportData={exportData}
            onPageChange={pageChange}
          />
        )}
        <ResponsiveTable
          columns={getColumns(true).filter((c) => c.key != 'userId')}
          dataSource={paymentList}
          onChange={onTableChange}
          rowKey={'id'}
          className="transaction-table"
          pagination={{
            current: page + 1,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            locale: { items_per_page: '' },
            disabled: loading,
            className: 'transaction-pagination',
          }}
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
          scroll={{ x: 1400 }}
          onRow={(_, rowIndex) => {
            return {
              onClick: (event) => {
                if (
                  event.target instanceof Element &&
                  event.target.closest('.btn-refunded-payment') != null
                ) {
                  setPaymentIdx(rowIndex as number)
                  toggleRefundModal()
                  return
                }
              }
            }
          }}
        />
        <div className="flex items-center justify-center">{extraButton}</div>
      </div>
    )
  }

  // Standalone mode (main transactions page)
  return (
    <div className="bg-gray-50 min-h-screen">
      {refundModalOpen && (
        <RefundInfoModal
          originalInvoiceId={paymentList[paymentIdx].payment.invoiceId}
          closeModal={toggleRefundModal}
          detail={paymentList[paymentIdx].refund!}
          ignoreAmtFactor={false}
        />
      )}

      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold mb-6">Transactions</h1>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2" style={{ maxWidth: '520px', flex: 1 }}>
              <Input
                placeholder="Search by Sub ID, Invoice ID, Transaction ID, User ID"
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
                <span style={{ marginRight: getStandaloneFilterCount() > 0 ? '8px' : 0 }}>Filter</span>
                {getStandaloneFilterCount() > 0 && (
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
                    {getStandaloneFilterCount()}
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
                      <Form
                        form={form}
                        layout="vertical"
                        initialValues={DEFAULT_TERM}
                      >
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
                            options={STATUS_FILTER.map(s => ({ label: s.text, value: s.value }))}
                          />
                        </Form.Item>

                        {/* Type */}
                        <Form.Item label="Type" name="timelineTypes" style={{ marginBottom: '20px' }}>
                          <Select
                            placeholder="Choose a Type"
                            allowClear
                            mode="multiple"
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                            }
                            options={PAYMENT_TYPE_FILTER.map(s => ({ label: s.text, value: s.value }))}
                          />
                        </Form.Item>

                        {/* Gateway */}
                        <Form.Item label="Gateway" name="gatewayIds" style={{ marginBottom: '20px' }}>
                          <Select
                            placeholder="Choose a Gateway"
                            allowClear
                            mode="multiple"
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                            }
                            options={GATEWAY_FILTER.map(g => ({ label: g.text, value: g.value }))}
                          />
                        </Form.Item>

                        {/* Transaction created */}
                        <Form.Item label="Transaction created" style={{ marginBottom: '20px' }}>
                          <div className="flex items-center gap-2">
                            <Form.Item name="createTimeStart" noStyle>
                              <DatePicker
                                placeholder="From"
                                format="MM.DD.YYYY"
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
                                format="MM.DD.YYYY"
                                disabledDate={(d) => d.isAfter(new Date())}
                                style={{ flex: 1 }}
                              />
                            </Form.Item>
                          </div>
                        </Form.Item>

                        {/* Amount */}
                        <Form.Item label="Amount" style={{ marginBottom: '20px' }}>
                          <Form.Item name="currency" noStyle>
                            <Select
                              style={{ width: '100%', marginBottom: '8px' }}
                              showSearch
                              filterOption={(input, option) =>
                                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                              }
                              options={appConfigStore.supportCurrency.map((c) => ({
                                label: c.Currency,
                                value: c.Currency
                              }))}
                            />
                          </Form.Item>
                          <div className="flex items-center gap-2">
                            <Form.Item name="amountStart" noStyle>
                              <Input placeholder="From" style={{ flex: 1 }} />
                            </Form.Item>
                            <span className="text-gray-400">-</span>
                            <Form.Item name="amountEnd" noStyle>
                              <Input placeholder="To" style={{ flex: 1 }} />
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
                              setFilterDrawerOpen(false)
                              // Persist standalone filters so pagination keeps parameters
                              setStandaloneFilters(form.getFieldsValue())
                              if (page === 0) {
                                fetchData()
                              } else {
                                pageChange(1, pageSize)
                              }
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
          {getStandaloneActiveFilters().length > 0 && (
            <div 
              className="mt-4 flex items-center gap-2 flex-wrap"
            >
              {getStandaloneActiveFilters().map(filter => (
                <Tag
                  key={filter.key}
                  closable
                  onClose={() => removeStandaloneFilter(filter.key)}
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
                onClick={() => {
                  // Clear all filters including form fields
                  form.resetFields()
                  clearFilters()
                  pageChange(1, PAGE_SIZE)
                }}
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
                  icon={<ExportOutlined />}
                  onClick={exportData}
                  loading={exporting}
                  disabled={loading || exporting}
                  className="flex items-center"
                >
                  Export
                </Button>
              </div>
            </div>
          </div>

          <ResponsiveTable
            columns={getColumns(false)}
            dataSource={paymentList}
            onChange={onTableChange}
            rowKey={'id'}
            className="transaction-table"
            pagination={{
              current: page + 1,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              locale: { items_per_page: '' },
              disabled: loading,
              className: 'transaction-pagination',
            }}
            loading={{
              spinning: loading,
              indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
            }}
            scroll={{ x: 1400 }}
            onRow={(_, rowIndex) => {
              return {
                onClick: (event) => {
                  if (
                    event.target instanceof Element &&
                    event.target.closest('.btn-refunded-payment') != null
                  ) {
                    setPaymentIdx(rowIndex as number)
                    toggleRefundModal()
                    return
                  }
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

const DEFAULT_TERM = {
  // currency: 'EUR'
  // status: [],
  // amountStart: '',
  // amountEnd: ''
  // refunded: false,
}
const Search = ({
  form,
  searching,
  exporting,
  exportData,
  goSearch,
  onPageChange,
  clearFilters
}: {
  form: FormInstance<unknown>
  searching: boolean
  exporting: boolean
  exportData: () => void
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
  clearFilters: () => void
}) => {
  const appConfigStore = useAppConfigStore()
  const watchCurrency = Form.useWatch('currency', form)
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    clearFilters()
  }

  const currencySymbol = useMemo(
    () => appConfigStore.currency[watchCurrency as Currency]?.Symbol,
    [watchCurrency]
  )

  return (
    <div>
      <Form
        form={form}
        onFinish={goSearch}
        disabled={searching}
        initialValues={DEFAULT_TERM}
        className="my-4"
      >
        <Row className="mb-3 flex items-center" gutter={[8, 8]}>
          <Col span={4} className="font-bold text-gray-500">
            Transaction created
          </Col>
          <Col span={4}>
            <Form.Item name="createTimeStart" noStyle={true}>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="From"
                format="YYYY-MMM-DD"
                disabledDate={(d) => d.isAfter(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              name="createTimeEnd"
              noStyle={true}
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
                    return value.isAfter(start)
                      ? Promise.resolve()
                      : Promise.reject('Must be later than start date')
                  }
                })
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="To"
                format="YYYY-MMM-DD"
                disabledDate={(d) => d.isAfter(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={12} className="flex justify-end">
            <Space>
              <Button onClick={clear} disabled={searching}>
                Clear
              </Button>
              <Button
                onClick={form.submit}
                type="primary"
                loading={searching}
                disabled={searching}
              >
                Search
              </Button>
              <Button
                onClick={exportData}
                loading={exporting}
                disabled={searching || exporting}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4} className="font-bold text-gray-500">
            <div className="flex items-center">
              <span className="mr-2">Amount</span>
              <Form.Item name="currency" noStyle={true}>
                <Select
                  style={{ width: 80 }}
                  options={appConfigStore.supportCurrency.map((c) => ({
                    label: c.Currency,
                    value: c.Currency
                  }))}
                />
              </Form.Item>
            </div>
          </Col>
          <Col span={4}>
            <Form.Item name="amountStart" noStyle={true}>
              <Input
                prefix={currencySymbol ? `from ${currencySymbol}` : ''}
                onPressEnter={form.submit}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="amountEnd" noStyle={true}>
              <Input
                prefix={currencySymbol ? `to ${currencySymbol}` : ''}
                onPressEnter={form.submit}
              />
            </Form.Item>
          </Col>
          {/* <Col span={11} className=" ml-4 font-bold text-gray-500">
            <span className="mr-2">Status</span>
            <Form.Item name="status" noStyle={true}>
              <Select
                mode="multiple"
                options={statusOpt}
                style={{ maxWidth: 420, minWidth: 120, margin: '8px 0' }}
              />
            </Form.Item>
          </Col> */}
        </Row>
      </Form>
    </div>
  )
}
