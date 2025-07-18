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
import { InvoiceStatus, IProfile, UserInvoice } from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import {
  CheckCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  ExportOutlined,
  LoadingOutlined,
  MailOutlined,
  PlusOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  message,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tooltip
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { Currency } from 'dinero.js'
import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import { normalizeAmt } from '../helpers'
import MarkAsPaidModal from '../invoice/markAsPaidModal'
import MarkAsRefundedModal from '../invoice/markAsRefundedModal'
import RefundInfoModal from '../payment/refundModal'
import CopyToClipboard from '../ui/copyToClipboard'
import { InvoiceStatusTag } from '../ui/statusTag'
import InvoiceDetailModal from './modals/invoiceDetail'
import NewInvoiceModal from './modals/newInvoice'

const BASE_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10
const STATUS_FILTER = Object.entries(INVOICE_STATUS).map((s) => {
  const [value, { label }] = s
  return { value: Number(value), text: label }
})

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
  const [total, setTotal] = useState(0)
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false)
  const [invoiceDetailModalOpen, setInvoiceDetailModalOpen] = useState(false)
  const [invoiceIdx, setInvoiceIdx] = useState(-1) // -1: not selected, any action button: (delete, edit,refund) will set this value to the selected invoiceIdx
  const [refundMode, setRefundMode] = useState(false) // create invoice and create refund invoice share a modal, I need this to check which one is used.

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
      setRefundMode(false)
    }
    setInvoiceDetailModalOpen(!invoiceDetailModalOpen)
  }

  const normalizeSearchTerms = () => {
    const searchTerm = JSON.parse(JSON.stringify(form.getFieldsValue()))
    Object.keys(searchTerm).forEach(
      (k) =>
        (searchTerm[k] == undefined ||
          (typeof searchTerm[k] == 'string' && searchTerm[k].trim() == '')) &&
        delete searchTerm[k]
    )
    if (enableSearch) {
      const start = form.getFieldValue('createTimeStart')
      const end = form.getFieldValue('createTimeEnd')
      if (start != null) {
        searchTerm.createTimeStart = start.hour(0).minute(0).second(0).unix()
      }
      if (end != null) {
        searchTerm.createTimeEnd = end.hour(23).minute(59).second(59).unix()
      }

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

  const fetchData = async () => {
    // in embedding mode, invoice table is inside user detail component or subscription component, or other in the future.
    // in these cases, userId must be ready to get the invoices for this specific user.
    // most of times, user obj might take a while to be ready(other component are running req to get it).
    // if we run fetchData now, userId(optional to run getInvoiceList) is still null, then all user invoices will be returned.
    if (embeddingMode && user == null) {
      return
    }
    let searchTerm = normalizeSearchTerms()
    if (null == searchTerm) {
      return
    }
    searchTerm.page = page
    searchTerm.count = PAGE_SIZE
    searchTerm = { ...searchTerm, ...filters }
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
    payload = { ...payload, ...filters }

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

  const goSearch = () => {
    if (page == 0) {
      fetchData()
    } else {
      pageChange(1, PAGE_SIZE)
    }
  }

  const columns: ColumnsType<UserInvoice> = [
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) => {
        const referer = encodeURIComponent(
          window.location.pathname + window.location.search
        )
        return (
          <div className="invoice-id-wrapper flex items-center">
            <a
              href={`${location.origin}${BASE_PATH}invoice/${ivId}?&referer=${referer}`}
              style={{ fontFamily: 'monospace' }}
            >
              {ivId}
            </a>
            <CopyToClipboard content={ivId} />
          </div>
        )
      }
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 160,
      render: (amt, iv) => (
        <div className="flex items-center">
          <div className={iv.refund == null ? '' : 'text-red-500'}>
            {showAmount(amt, iv.currency, true)}
          </div>
          {iv.refund == null && (
            <div className="text-xs text-gray-500">{` (tax: ${showAmount(iv.taxAmount, iv.currency, true)})`}</div>
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
      width: 100,
      render: (refund) => (refund == null ? 'Invoice' : 'Credit Note')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: STATUS_FILTER,
      filteredValue: filters.status,
      render: (s, iv) => InvoiceStatusTag(s as InvoiceStatus, iv.refund != null)
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
            <div className="w-[130px] font-mono">
              {formatDate(payment.paidTime, true)}
            </div>
          )
        ) : iv.refund.refundTime == 0 ? (
          '―'
        ) : (
          <div className="w-[130px] font-mono">
            {formatDate(iv.refund.refundTime, true)}
          </div>
        )
    },
    {
      title: 'Gateway',
      dataIndex: 'gateway',
      key: 'gateway',
      render: (g) => (g == null ? null : g.name)
    },
    {
      title: 'Created by',
      dataIndex: 'createFrom',
      key: 'createFrom',
      width: 110,
      render: (by, _) => (by != 'Admin' ? 'System' : 'Admin')
    },
    {
      title: 'User',
      dataIndex: 'userAccount',
      key: 'userName',
      width: 130,
      // hidden: embeddingMode,
      // "hidden" is supported in higher version of antd, but that version broke many other things,
      // like <DatePicker />
      render: (_, iv) => (
        <span>{`${iv.userAccount.firstName} ${iv.userAccount.lastName}`}</span>
      )
    },
    {
      title: 'Email',
      dataIndex: 'userAccount',
      key: 'userEmail',
      // hidden: embeddingMode,
      render: (_, iv) =>
        iv.userAccount == null ? null : (
          <a href={`mailto:${iv.userAccount.email}`}> {iv.userAccount.email}</a>
        )
    },
    {
      title: 'Title',
      dataIndex: 'invoiceName',
      key: 'invoiceName'
    },
    {
      title: (
        <>
          <span>Actions</span>
          {user != undefined && (
            <Tooltip title="New invoice">
              <Button
                size="small"
                style={{ marginLeft: '8px' }}
                onClick={() => {
                  setInvoiceIdx(-1)
                  toggleNewInvoiceModal()
                }}
                icon={<PlusOutlined />}
                disabled={user == undefined}
              />
            </Tooltip>
          )}
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchData}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
          <Tooltip title="Export">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading || exporting}
              onClick={exportData}
              loading={exporting}
              icon={<ExportOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      key: 'action',
      // width: 180,
      // fixed: 'right',
      render: (
        _,
        invoice // use fn to generate these icons, only show available ones.
      ) => (
        <Space
          size="small"
          className="invoice-action-btn-wrapper"
          // style={{ width: '170px' }}
        >
          <Tooltip title="Edit">
            <Button
              onClick={toggleNewInvoiceModal}
              icon={<EditOutlined />}
              style={{ border: 'unset' }}
              disabled={!getInvoicePermission(invoice).editable}
            />
          </Tooltip>
          <Tooltip title="Create Refund Invoice">
            <Button
              onClick={refund}
              icon={<DollarOutlined />}
              style={{ border: 'unset' }}
              disabled={!getInvoicePermission(invoice).refundable}
            />
          </Tooltip>
          {getInvoicePermission(invoice).asPaidMarkable ? (
            <Tooltip title="Mark invoice as PAID">
              <Button
                onClick={toggleMarkPaidModal}
                icon={<CheckCircleOutlined />}
                style={{ border: 'unset' }}
              />
            </Tooltip>
          ) : null}

          {getInvoicePermission(invoice).asRefundedMarkable ? (
            <Tooltip title="Mark invoice as Refunded">
              <Button
                onClick={toggleMarkRefundedModal}
                icon={<CheckCircleOutlined />}
                style={{ border: 'unset' }}
              />
            </Tooltip>
          ) : null}

          <Tooltip title="Send invoice">
            <Button
              onClick={toggleInvoiceDetailModal}
              icon={<MailOutlined />}
              style={{ border: 'unset' }}
              disabled={!getInvoicePermission(invoice).sendable}
            />
          </Tooltip>
          <Tooltip title="Download Invoice">
            <Button
              onClick={downloadInvoice(invoice)}
              icon={<DownloadOutlined />}
              style={{ border: 'unset' }}
              disabled={!getInvoicePermission(invoice).downloadable}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const refund = () => {
    setRefundMode(true)
    toggleNewInvoiceModal()
  }

  const clearFilters = () => setFilters({ status: null })

  const onTableChange: TableProps<UserInvoice>['onChange'] = (_, filters) => {
    setFilters(filters as TFilters)
  }

  useEffect(() => {
    fetchData()
  }, [page, filters, user])

  return (
    <div>
      {refundInfoModalOpen && invoiceList[invoiceIdx].refund != null && (
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
        (user != null || invoiceList[invoiceIdx].userAccount != null) && (
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
      {invoiceDetailModalOpen && (
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
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Table
          columns={
            !embeddingMode
              ? columns
              : columns.filter(
                  (c) => c.key != 'userName' && c.key != 'userEmail'
                )
          }
          dataSource={invoiceList}
          onChange={onTableChange}
          rowKey={'id'}
          rowClassName="clickable-tbl-row"
          pagination={false}
          scroll={{ x: 'max-content', y: 640 }}
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
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
        />
        <span
          style={{ cursor: 'pointer', marginLeft: '8px' }}
          onClick={fetchData}
        ></span>
      </div>
      <div className="my-4 flex items-center justify-between">
        <div className="flex items-center justify-center">{extraButton}</div>
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          size="small"
          onChange={pageChange}
          disabled={loading}
          showSizeChanger={false}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
        />
      </div>
    </div>
  )
}

export default Index

const DEFAULT_TERM = {
  // currency: 'EUR',
  amountStart: '',
  amountEnd: ''
}
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
