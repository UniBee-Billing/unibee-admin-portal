import RefundIcon from '@/assets/refund.svg?react'
import { INVOICE_STATUS } from '@/constants'
import {
  downloadStaticFile,
  formatDate,
  getInvoicePermission,
  showAmount
} from '@/helpers'
import { usePagination } from '@/hooks'
import { exportDataReq, getInvoiceListReq } from '@/requests'
import '@/shared.css'
import './invoicesTab.css'
import { InvoiceStatus, IProfile, UserInvoice } from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import {
  CheckCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  ExportOutlined,
  FilterOutlined,
  LoadingOutlined,
  MailOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Dropdown,
  Form,
  FormInstance,
  Input,
  InputNumber,
  MenuProps,
  message,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  Tag
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { Currency } from 'dinero.js'
import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import { normalizeAmt } from '../helpers'
import MarkAsPaidModal from '../invoice/markAsPaidModal'
import MarkAsRefundedModal from '../invoice/markAsRefundedModal'
import RefundInfoModal from '../payment/refundModal'
import ResponsiveTable from '../table/responsiveTable'
import CopyToClipboard from '../ui/copyToClipboard'
import { InvoiceStatusTag } from '../ui/statusTag'
import InvoiceDetailModal from './modals/invoiceDetail'
import NewInvoiceModal from './modals/newInvoice'

const BASE_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10
const STATUS_FILTER = [
  { value: 1, text: 'Pending' },
  { value: 2, text: 'Processing' },
  { value: 3, text: 'Paid' },
  { value: 4, text: 'Failed' },
  { value: 5, text: 'Cancelled' }
]

const DEFAULT_TERM = {
  // currency: 'EUR',
  amountStart: '',
  amountEnd: ''
}

// Blue tone to indicate clickable icons
const ACTION_ICON_COLOR = '#1677ff'

type TFilters = {
  status: number[] | null
}

const Index = ({
  user,
  extraButton,
  embeddingMode,
  embeddedIn,
  enableSearch
}: {
  user?: IProfile | undefined
  extraButton?: ReactElement
  embeddingMode: boolean // invoiceList can be embedded as part of a page, or be the page itself.
  embeddedIn?: 'userInvoicePage' | 'subscriptionDetailPage' // invoiceList is used in /invoice/list, user detail (invoice tab), subscription detail (invoice tab)
  // click the ivId go directly to invoice detail, but there is a go-back button, click to go back to where it came from.
  // invoiceList, subList, userList are opened in new page using <a href=*** />, not in-app navigate,
  // so I have to pass embeddedIn to know which parent I'm in.
  enableSearch: boolean
}) => {
  //   const navigate = useNavigate()
  const appConfig = useAppConfigStore()
  const [form] = Form.useForm()
  const [invoiceList, setInvoiceList] = useState<UserInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const pageName = embeddedIn ?? 'page'
  const { page, onPageChange } = usePagination(pageName)
  const pageChange = onPageChange // embeddingMode ? onPageChangeNoParams : onPageChange
  const [filters, setFilters] = useState<TFilters>({
    status: null
  })
  const [standaloneFilters, setStandaloneFilters] = useState<Record<string, any>>({})
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false)
  const [invoiceDetailModalOpen, setInvoiceDetailModalOpen] = useState(false)
  const [invoiceIdx, setInvoiceIdx] = useState(-1) // -1: not selected, any action button: (delete, edit,refund) will set this value to the selected invoiceIdx
  const [refundMode, setRefundMode] = useState(false) // create invoice and create refund invoice share a modal, I need this to check which one is used.
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  // refund invoice Modal, showing refund info
  const [refundInfoModalOpen, setRefundInfoModalOpen] = useState(false)
  const toggleRefundInfoModal = () => {
    if (refundInfoModalOpen) {
      setInvoiceIdx(-1)
    }
    setRefundInfoModalOpen(!refundInfoModalOpen)
  }

  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false)
  const toggleMarkPaidModal = () => {
    if (markPaidModalOpen) {
      setInvoiceIdx(-1)
    }
    setMarkPaidModalOpen(!markPaidModalOpen)
  }
  const [markRefundedModalOpen, setMarkRefundedModalOpen] = useState(false)
  const toggleMarkRefundedModal = () => {
    if (markRefundedModalOpen) {
      setInvoiceIdx(-1)
    }
    setMarkRefundedModalOpen(!markRefundedModalOpen)
  }

  const toggleNewInvoiceModal = () => {
    if (newInvoiceModalOpen) {
      setInvoiceIdx(-1)
      setRefundMode(false)
    }
    setNewInvoiceModalOpen(!newInvoiceModalOpen)
  }

  const toggleInvoiceDetailModal = () => {
    if (invoiceDetailModalOpen) {
      setInvoiceIdx(-1)
    }
    setInvoiceDetailModalOpen(!invoiceDetailModalOpen)
  }

  const normalizeSearchTerms = (overrideSearchKey?: string) => {
    const rawFormValues = form.getFieldsValue()
    // For standalone mode, form may be unmounted (drawer closed). Merge with last saved values.
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

    // Add search key from search input (for standalone mode)
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

      // Handle currency separately - can be used independently of amount
      const currency = form.getFieldValue('currency')
      if (currency) {
        searchTerm.currency = currency
      }

      // return
      let amtFrom = searchTerm.amountStart,
        amtTo = searchTerm.amountEnd
      if (amtFrom != '' && amtFrom != null) {
        amtFrom =
          Number(amtFrom) *
          appConfig.currency[searchTerm.currency as Currency]!.Scale
        if (isNaN(amtFrom) || amtFrom < 0) {
          message.error('Invalid amount-from value.')
          return null
        }
      }
      if (amtTo != '' && amtTo != null) {
        amtTo =
          Number(amtTo) *
          appConfig.currency[searchTerm.currency as Currency]!.Scale
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

  const fetchData = async (overrideSearchKey?: string) => {
    // in embedding mode, invoice table is inside user detail component or subscription component, or other in the future.
    // in these cases, userId must be ready to get the invoices for this specific user.
    // most of times, user obj might take a while to be ready(other component are running req to get it).
    // if we run fetchData now, userId(optional to run getInvoiceList) is still null, then all user invoices will be returned.
    if (embeddingMode && user == null) {
      return
    }
    let searchTerm = normalizeSearchTerms(overrideSearchKey)
    if (null == searchTerm) {
      return
    }
    searchTerm.page = page
    searchTerm.count = pageSize
    // Only merge column filters when in embedding mode;
    // in standalone mode, we read all conditions from the form values directly.
    if (embeddingMode) {
      searchTerm = { ...searchTerm, ...filters }
    }
    setLoading(true)
    const [res, err] = await getInvoiceListReq(searchTerm, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { invoices, total } = res
    if (invoices != null) {
      normalizeAmt(invoices)
      setInvoiceList(invoices)
    } else {
      setInvoiceList([])
    }
    setTotal(total)
  }

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }
    if (embeddingMode) {
      payload = { ...payload, ...filters }
    }

    setExporting(true)
    const [_, err] = await exportDataReq({ task: 'InvoiceExport', payload })
    setExporting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(
      'Invoice list is being exported, please check task list for progress.'
    )
    appConfig.setTaskListOpen(true)
  }

  const downloadInvoice = (iv: UserInvoice) => () => {
    downloadStaticFile(iv.sendPdf, `${iv.invoiceId}.pdf`)
  }

  // Status tag renderer (override label for status=2 to "Processing")
  const renderStatusTag = (statusId: InvoiceStatus) => {
    const conf = INVOICE_STATUS[statusId]
    const text =
      statusId === InvoiceStatus.AWAITING_PAYMENT
        ? 'Processing'
        : statusId === InvoiceStatus.DRAFT
        ? 'Pending'
        : conf.label
    return <Tag color={conf.color}>{text}</Tag>
  }

  const goSearch = (overrideSearchKey?: string) => {
    if (page == 0) {
      fetchData(overrideSearchKey)
    } else {
      pageChange(1, pageSize)
    }
  }

  const clearFilters = () => {
    setFilters({ status: null })
    setSearchText('')
    setStandaloneFilters({})
  }

  // Standalone mode filter helpers
  const getStandaloneFilterCount = () => {
    const filters = standaloneFilters
    let count = 0
    if (filters?.status && filters.status.length > 0) count += filters.status.length
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
    } else if (filterKey === 'dateRange') {
      form.setFieldsValue({ createTimeStart: undefined, createTimeEnd: undefined })
    } else if (filterKey === 'amountRange') {
      form.setFieldsValue({ amountStart: undefined, amountEnd: undefined, currency: undefined })
    } else if (filterKey === 'currency') {
      form.setFieldValue('currency', undefined)
    }
    // Sync to persistent standalone filters
    setStandaloneFilters(form.getFieldsValue())
    // Trigger refetch
    if (page === 0) {
      fetchData()
    } else {
      pageChange(1, pageSize)
    }
  }

  const getInvoiceActions = (invoice: UserInvoice, rowIndex: number): MenuProps['items'] => {
    const permission = getInvoicePermission(invoice)
    const items: MenuProps['items'] = []

    if (permission.refundable) {
      items.push({
        key: 'refund',
        icon: <DollarOutlined style={{ color: ACTION_ICON_COLOR }} />,
        label: 'Create Refund Invoice',
        onClick: (e) => {
          e.domEvent.stopPropagation()
          setInvoiceIdx(rowIndex)
          refund()
        }
      })
    }

    if (permission.sendable) {
      items.push({
        key: 'send',
        icon: <MailOutlined style={{ color: ACTION_ICON_COLOR }} />,
        label: 'Send Invoice',
        onClick: (e) => {
          e.domEvent.stopPropagation()
          setInvoiceIdx(rowIndex)
          toggleInvoiceDetailModal()
        }
      })
    }

    if (permission.asPaidMarkable) {
      items.push({
        key: 'markPaid',
        icon: <CheckCircleOutlined style={{ color: ACTION_ICON_COLOR }} />,
        label: 'Mark as Paid',
        onClick: (e) => {
          e.domEvent.stopPropagation()
          setInvoiceIdx(rowIndex)
          toggleMarkPaidModal()
        }
      })
    }

    if (permission.asRefundedMarkable) {
      items.push({
        key: 'markRefunded',
        icon: <CheckCircleOutlined style={{ color: ACTION_ICON_COLOR }} />,
        label: 'Mark as Refunded',
        onClick: (e) => {
          e.domEvent.stopPropagation()
          setInvoiceIdx(rowIndex)
          toggleMarkRefundedModal()
        }
      })
    }

    return items
  }

  const columns: ColumnsType<UserInvoice> = [
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      width: 140,
      render: (ivId) => {
        const referer = encodeURIComponent(
          window.location.pathname + window.location.search
        )
        return (
          <div className="invoice-id-wrapper flex items-center gap-1">
            <Tooltip title={ivId}>
              <a
                href={`${location.origin}${BASE_PATH}invoice/${ivId}?&referer=${referer}`}
                style={{
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}
              >
                {ivId}
              </a>
            </Tooltip>
            <CopyToClipboard content={ivId} />
          </div>
        )
      }
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amt, iv) => (
        <div className="flex items-center">
          <div className={iv.refund == null ? '' : 'text-red-500'}>
            {showAmount(amt, iv.currency, true)}
          </div>
          {iv.refund == null && (
            <div className="text-xs text-gray-500 ml-1">{`(tax: ${showAmount(iv.taxAmount, iv.currency, true)})`}</div>
          )}
          {iv.refund != null && (
            <Tooltip title="Refund info">
              <div className="btn-refund-info-modal-wrapper ml-1 flex">
                <RefundIcon />
              </div>
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'refund',
      key: 'refund',
      width: 120,
      render: (refund) => (refund == null ? 'Invoice' : 'Credit Note')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      filters: embeddingMode ? STATUS_FILTER : undefined,
      filteredValue: embeddingMode ? filters.status : undefined,
      render: (s) => renderStatusTag(s as InvoiceStatus)
    },
    {
      title: 'Paid Date',
      dataIndex: 'payment',
      key: 'payment',
      width: 140,
      render: (payment, iv) =>
        iv.refund == null ? (
          payment == null || payment.paidTime == 0 ? (
            '―'
          ) : (
            <div className="font-mono">
              {formatDate(payment.paidTime, true)}
            </div>
          )
        ) : iv.refund.refundTime == 0 ? (
          '―'
        ) : (
          <div className="font-mono">
            {formatDate(iv.refund.refundTime, true)}
          </div>
        )
    },
    {
      title: 'Gateway',
      dataIndex: 'gateway',
      key: 'gateway',
      width: 120,
      render: (g) => (g == null ? null : g.name)
    },
    {
      title: 'Created by',
      dataIndex: 'createFrom',
      key: 'createFrom',
      width: 120,
      render: (by, _) => (by != 'Admin' ? 'System' : 'Admin')
    },
    {
      title: 'Email',
      dataIndex: 'userAccount',
      key: 'userEmail',
      width: 200,
      render: (_, iv) =>
        iv.userAccount == null ? null : (
          <div className="invoice-email-wrapper flex items-center gap-1">
            <span>{iv.userAccount.email}</span>
            <CopyToClipboard content={iv.userAccount.email} />
          </div>
        )
    },
    {
      title: 'Title',
      dataIndex: 'invoiceName',
      key: 'invoiceName',
      width: 150
    },
    {
      title: embeddingMode && user ? (
        <>
          <span>Actions</span>
          <Tooltip title="New Invoice">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              onClick={() => {
                setInvoiceIdx(-1)
                setRefundMode(false)
                toggleNewInvoiceModal()
              }}
              icon={<PlusOutlined />}
            />
          </Tooltip>
        </>
      ) : (
        'Actions'
      ),
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, invoice, index) => {
        const permission = getInvoicePermission(invoice)
        const actions = getInvoiceActions(invoice, index)
        return (
          <div className="invoice-action-btn-wrapper flex items-center gap-2">
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={
                  <EditOutlined
                    style={{
                      color: permission.editable ? ACTION_ICON_COLOR : '#bfbfbf'
                    }}
                  />
                }
                onClick={() => {
                  setInvoiceIdx(index)
                  toggleNewInvoiceModal()
                }}
                disabled={!permission.editable}
              />
            </Tooltip>
            <Tooltip title="Download">
              <Button
                type="text"
                icon={<DownloadOutlined style={{ color: ACTION_ICON_COLOR }} />}
                onClick={downloadInvoice(invoice)}
                disabled={!permission.downloadable}
              />
            </Tooltip>
            {actions && actions.length > 0 && (
              <Dropdown
                menu={{ items: actions }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button type="text" icon={<MoreOutlined style={{ color: ACTION_ICON_COLOR }} />} />
              </Dropdown>
            )}
          </div>
        )
      }
    }
  ]

  const refund = () => {
    setRefundMode(true)
    setNewInvoiceModalOpen(true)
  }

  const onTableChange: TableProps<UserInvoice>['onChange'] = (
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
    // Embedded mode (used within user detail page or subscription detail page)
    return (
      <div>
        {refundInfoModalOpen && invoiceList[invoiceIdx]?.refund != null && (
          <RefundInfoModal
            originalInvoiceId={invoiceList[invoiceIdx].payment?.invoiceId}
            detail={invoiceList[invoiceIdx].refund!}
            closeModal={toggleRefundInfoModal}
            ignoreAmtFactor={true}
          />
        )}
        {markPaidModalOpen && (
          <MarkAsPaidModal
            closeModal={toggleMarkPaidModal}
            refresh={fetchData}
            invoiceId={invoiceList[invoiceIdx].invoiceId}
          />
        )}
        {markRefundedModalOpen && (
          <MarkAsRefundedModal
            closeModal={toggleMarkRefundedModal}
            refresh={fetchData}
            invoiceId={invoiceList[invoiceIdx].invoiceId}
          />
        )}
        {newInvoiceModalOpen &&
          (invoiceIdx === -1 ? user != null : invoiceList[invoiceIdx]?.userAccount != null || user != null) && (
            <NewInvoiceModal
              isOpen={true}
              refundMode={refundMode}
              detail={invoiceIdx == -1 ? null : invoiceList[invoiceIdx]}
              permission={getInvoicePermission(
                invoiceIdx == -1 ? null : invoiceList[invoiceIdx]
              )}
              user={user ?? invoiceList[invoiceIdx]?.userAccount}
              closeModal={toggleNewInvoiceModal}
              refresh={fetchData}
            />
          )}
        {invoiceDetailModalOpen && invoiceList[invoiceIdx] && (
          <InvoiceDetailModal
            detail={invoiceList[invoiceIdx]}
            user={user}
            closeModal={toggleInvoiceDetailModal}
          />
        )}
        {enableSearch && (
          <Search
            form={form}
            goSearch={goSearch}
            searching={loading}
            clearFilters={clearFilters}
            onPageChange={pageChange}
          />
        )}
        <ResponsiveTable
          columns={columns.filter((c) => c.key != 'userEmail')}
          dataSource={invoiceList}
          onChange={onTableChange}
          rowKey={'id'}
          className="invoice-table"
          pagination={{
            current: page + 1,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            locale: { items_per_page: '' },
            disabled: loading,
            className: 'invoice-pagination'
          }}
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
          scroll={{ x: 1400 }}
          onRow={(_, rowIndex) => {
            return {
              onClick: (event) => {
                setInvoiceIdx(rowIndex as number)
                if (
                  event.target instanceof Element &&
                  event.target.closest('.invoice-id-wrapper') != null
                ) {
                  return
                }
                if (
                  event.target instanceof Element &&
                  event.target.closest('.invoice-email-wrapper') != null
                ) {
                  return
                }
                if (
                  event.target instanceof Element &&
                  event.target.closest('.btn-refund-info-modal-wrapper') != null
                ) {
                  toggleRefundInfoModal()
                  return
                }
                if (
                  event.target instanceof Element &&
                  event.target.closest('.invoice-action-btn-wrapper') == null
                ) {
                  toggleInvoiceDetailModal()
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

  // Standalone mode (main invoices page)
  return (
    <div className="bg-gray-50 min-h-screen">
      {refundInfoModalOpen && invoiceList[invoiceIdx]?.refund != null && (
        <RefundInfoModal
          originalInvoiceId={invoiceList[invoiceIdx].payment?.invoiceId}
          detail={invoiceList[invoiceIdx].refund!}
          closeModal={toggleRefundInfoModal}
          ignoreAmtFactor={true}
        />
      )}
      {markPaidModalOpen && (
        <MarkAsPaidModal
          closeModal={toggleMarkPaidModal}
          refresh={fetchData}
          invoiceId={invoiceList[invoiceIdx].invoiceId}
        />
      )}
      {markRefundedModalOpen && (
        <MarkAsRefundedModal
          closeModal={toggleMarkRefundedModal}
          refresh={fetchData}
          invoiceId={invoiceList[invoiceIdx].invoiceId}
        />
      )}
      {newInvoiceModalOpen &&
        (invoiceIdx === -1 ? user != null : invoiceList[invoiceIdx]?.userAccount != null || user != null) && (
          <NewInvoiceModal
            isOpen={true}
            refundMode={refundMode}
            detail={invoiceIdx == -1 ? null : invoiceList[invoiceIdx]}
            permission={getInvoicePermission(
              invoiceIdx == -1 ? null : invoiceList[invoiceIdx]
            )}
            user={user ?? invoiceList[invoiceIdx]?.userAccount}
            closeModal={toggleNewInvoiceModal}
            refresh={fetchData}
          />
        )}
      {invoiceDetailModalOpen && invoiceList[invoiceIdx] && (
        <InvoiceDetailModal
          detail={invoiceList[invoiceIdx]}
          user={user}
          closeModal={toggleInvoiceDetailModal}
        />
      )}

      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold mb-6">Invoices</h1>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2" style={{ maxWidth: '450px', flex: 1 }}>
              <Input
                placeholder="Search by Invoice ID or Email"
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
                  color: '#000'
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

                        {/* Invoice created */}
                        <Form.Item label="Invoice created" style={{ marginBottom: '20px' }}>
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
                              options={appConfig.supportCurrency.map((c) => ({
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
                            style={{
                              backgroundColor: '#FFD700',
                              borderColor: '#FFD700',
                              color: '#000',
                              fontWeight: 500
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
                  setStandaloneFilters({})
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
            columns={columns}
            dataSource={invoiceList}
            onChange={onTableChange}
            rowKey={'id'}
            className="invoice-table"
            pagination={{
              current: page + 1,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              locale: { items_per_page: '' },
              disabled: loading,
              className: 'invoice-pagination'
            }}
            loading={{
              spinning: loading,
              indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
            }}
            scroll={{ x: 1400 }}
            onRow={(_, rowIndex) => {
              return {
                onClick: (event) => {
                  setInvoiceIdx(rowIndex as number)
                  if (
                    event.target instanceof Element &&
                    event.target.closest('.invoice-id-wrapper') != null
                  ) {
                    return
                  }
                  if (
                    event.target instanceof Element &&
                    event.target.closest('.invoice-email-wrapper') != null
                  ) {
                    return
                  }
                  if (
                    event.target instanceof Element &&
                    event.target.closest('.btn-refund-info-modal-wrapper') != null
                  ) {
                    toggleRefundInfoModal()
                    return
                  }
                  if (
                    event.target instanceof Element &&
                    event.target.closest('.invoice-action-btn-wrapper') == null
                  ) {
                    toggleInvoiceDetailModal()
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

const Search = ({
  form,
  searching,
  goSearch,
  onPageChange,
  clearFilters
}: {
  form: FormInstance<unknown>
  searching: boolean
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
      >
        <Row className="mb-3 flex items-center" gutter={[8, 8]}>
          <Col span={3} className="font-bold text-gray-500">
            First/Last name
          </Col>
          <Col span={4}>
            <Form.Item name="firstName" noStyle={true}>
              <Input onPressEnter={form.submit} placeholder="first name" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="lastName" noStyle={true}>
              <Input onPressEnter={form.submit} placeholder="last name" />
            </Form.Item>
          </Col>
          <Col span={1}></Col>
          <Col span={3} className="font-bold text-gray-500">
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
          <Col span={3}>
            <Form.Item name="amountStart" noStyle={true}>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                prefix={currencySymbol ? `from ${currencySymbol}` : ''}
                onPressEnter={form.submit}
              />
            </Form.Item>
          </Col>

          <Col span={3}>
            <Form.Item name="amountEnd" noStyle={true}>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                prefix={currencySymbol ? `to ${currencySymbol}` : ''}
                onPressEnter={form.submit}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row className="mb-3 flex items-center" gutter={[8, 8]}>
          <Col span={3} className="font-bold text-gray-500">
            Invoice created
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
          <Col span={10} className="flex justify-end">
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
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
