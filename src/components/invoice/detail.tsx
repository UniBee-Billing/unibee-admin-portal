import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  LoadingOutlined,
  MinusOutlined,
  ClockCircleOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons'
import { Button, Card, Col, Row, Spin, message } from 'antd'
import React, { CSSProperties, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { INVOICE_BIZ_TYPE } from '../../constants'
import { getInvoicePermission, showAmount } from '../../helpers'
import { getInvoiceDetailReq, getSplitPaymentsReq } from '../../requests'
import {
  InvoiceStatus,
  SplitPayment,
  SplitPaymentsData,
  UserInvoice
} from '../../shared.types'
import { normalizeAmt } from '../helpers'
import RefundModal from '../payment/refundModal'
import InvoiceDetailModal from '../subscription/modals/invoiceDetail'
import CopyToClipboard from '../ui/copyToClipboard'
import { InvoiceStatusTag } from '../ui/statusTag'
import MarkAsPaidModal from './markAsPaidModal'
import MarkAsRefundedModal from './markAsRefundedModal'
import SplitPaymentRefundModal from './splitPaymentRefundModal'
import TransactionHistory from './transactionHistory'

const cardStyle: CSSProperties = {
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
}

const infoCardStyle: CSSProperties = {
  ...cardStyle,
  padding: '16px 24px'
}

const Index = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [invoiceDetail, setInvoiceDetail] = useState<UserInvoice | null>(null)
  const [showInvoiceItems, setShowInvoiceItems] = useState(false)
  const toggleInvoiceItems = () => setShowInvoiceItems(!showInvoiceItems)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const toggleRefundModal = () => setRefundModalOpen(!refundModalOpen)
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false)
  const toggleMarkPaidModal = () => setMarkPaidModalOpen(!markPaidModalOpen)
  const [markRefundedModalOpen, setMarkRefundedModalOpen] = useState(false)
  const toggleMarkRefundedModal = () =>
    setMarkRefundedModalOpen(!markRefundedModalOpen)

  // Split payment states
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([])
  const [splitPaymentData, setSplitPaymentData] =
    useState<SplitPaymentsData | null>(null)
  const [splitPaymentLoading, setSplitPaymentLoading] = useState(false)
  const [splitPaymentRefundModalOpen, setSplitPaymentRefundModalOpen] =
    useState(false)
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] =
    useState<SplitPayment | null>(null)

  // PDF preview states
  const [delayingPreview, setDelayingPreview] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(true)

  const goBack = () => {
    const params = new URL(window.location.href).searchParams
    const referer = params.get('referer')
    let refererURL = '/invoice/list'
    if (referer != undefined) {
      refererURL = decodeURIComponent(referer)
    }
    navigate(refererURL)
  }

  const goToUser = (userId: number) => () =>
    navigate(`/user/${userId}?tab=invoice`)
  const goToSub = (subId: string) => () => navigate(`/subscription/${subId}`)

  // Check if invoice has split payment
  const hasSplitPayment = useMemo(() => {
    return invoiceDetail?.metadata?.HasSplitPayment === true
  }, [invoiceDetail])

  const fetchData = async () => {
    const pathName = window.location.pathname.split('/')
    const ivId = pathName.pop()
    if (ivId == null) {
      message.error('Invalid invoice')
      return
    }
    setLoading(true)
    const [res, err] = await getInvoiceDetailReq(ivId, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      setDelayingPreview(false)
      return
    }
    const { invoice } = res
    normalizeAmt([invoice])
    setInvoiceDetail(invoice)
  }

  const fetchSplitPayments = async () => {
    if (!invoiceDetail?.invoiceId) return

    setSplitPaymentLoading(true)
    const [res, err] = await getSplitPaymentsReq(
      invoiceDetail.invoiceId,
      fetchSplitPayments
    )
    setSplitPaymentLoading(false)

    if (err != null) {
      console.error('Failed to fetch split payments:', err)
      return
    }

    if (res) {
      setSplitPaymentData(res as SplitPaymentsData)
      setSplitPayments((res as SplitPaymentsData).payments || [])
    }
  }

  // Fetch split payments when invoice is loaded
  useEffect(() => {
    if (invoiceDetail?.invoiceId) {
      fetchSplitPayments()
    }
  }, [invoiceDetail?.invoiceId])

  if (delayingPreview && !loading) {
    setTimeout(() => setDelayingPreview(false), 2500)
  }

  useEffect(() => {
    if (refundModalOpen) {
      toggleRefundModal()
    }
    fetchData()
  }, [location])

  const isRefund = invoiceDetail?.refund != null
  const perm = getInvoicePermission(invoiceDetail)

  // Get display amounts
  const displayAmounts = useMemo(() => {
    // If we have split payment data, use it
    if (splitPaymentData && splitPaymentData.payments.length > 0) {
      return {
        totalAmount: splitPaymentData.totalAmount,
        paidAmount: splitPaymentData.paidAmount,
        remainingAmount: splitPaymentData.remainingAmount
      }
    }
    // Fallback: calculate based on invoice status
    const totalAmount = invoiceDetail?.totalAmount || 0
    const isPaid = invoiceDetail?.status === InvoiceStatus.PAID
    return {
      totalAmount,
      paidAmount: isPaid ? totalAmount : 0,
      remainingAmount: isPaid ? 0 : totalAmount
    }
  }, [splitPaymentData, invoiceDetail])

  return (
    <div className="bg-gray-50 min-h-screen">
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />

      {/* Modals */}
      {invoiceDetail && showInvoiceItems && (
        <InvoiceDetailModal
          user={invoiceDetail.userAccount}
          closeModal={toggleInvoiceItems}
          detail={invoiceDetail}
        />
      )}
      {invoiceDetail && refundModalOpen && (
        <RefundModal
          originalInvoiceId={invoiceDetail.payment?.invoiceId}
          detail={invoiceDetail.refund!}
          closeModal={toggleRefundModal}
          ignoreAmtFactor={true}
        />
      )}
      {invoiceDetail && markPaidModalOpen && (
        <MarkAsPaidModal
          closeModal={toggleMarkPaidModal}
          refresh={fetchData}
          invoiceId={invoiceDetail.invoiceId}
          setDelayingPreview={setDelayingPreview}
        />
      )}
      {invoiceDetail && markRefundedModalOpen && (
        <MarkAsRefundedModal
          closeModal={toggleMarkRefundedModal}
          refresh={fetchData}
          invoiceId={invoiceDetail.invoiceId}
          setDelayingPreview={setDelayingPreview}
        />
      )}

      {/* Split Payment Refund Modal */}
      <SplitPaymentRefundModal
        payment={selectedPaymentForRefund}
        invoiceId={invoiceDetail?.invoiceId || ''}
        open={splitPaymentRefundModalOpen}
        onClose={() => {
          setSplitPaymentRefundModalOpen(false)
          setSelectedPaymentForRefund(null)
        }}
        onSuccess={() => {
          fetchData()
          fetchSplitPayments()
        }}
      />

      <div className="p-6">
        {/* Back Button */}
        <div
          className="flex items-center gap-2 text-gray-600 cursor-pointer mb-4 hover:text-gray-800"
          onClick={goBack}
        >
          <ArrowLeftOutlined />
          <span>Back to Invoice List</span>
        </div>

        {/* Page Title */}
        <h1 className="text-2xl font-semibold mb-6">Invoice Info</h1>

        {/* Main Content Card */}
        <Card style={cardStyle} className="mb-6">
          {/* Header with Invoice Name */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-medium">
              {invoiceDetail?.invoiceName || 'Invoice'}
            </span>
            <Button onClick={toggleInvoiceItems}>Show Detail</Button>
          </div>

          {/* Amount Cards */}
          <Row gutter={16} className="mb-6">
              <Col span={8}>
                <Card
                  style={{
                    ...infoCardStyle,
                    backgroundColor: '#f0f9ff',
                    border: 'none'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#e0f2fe' }}
                    >
                      <DollarOutlined
                        style={{ fontSize: 20, color: '#0284c7' }}
                      />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Amount</div>
                      <div className="text-xl font-semibold">
                        {showAmount(
                          displayAmounts.totalAmount,
                          invoiceDetail?.currency,
                          true
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  style={{
                    ...infoCardStyle,
                    backgroundColor: '#f0fdf4',
                    border: 'none'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#dcfce7' }}
                    >
                      <CheckCircleOutlined
                        style={{ fontSize: 20, color: '#16a34a' }}
                      />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Paid Amount</div>
                      <div className="text-xl font-semibold">
                        {showAmount(
                          displayAmounts.paidAmount,
                          invoiceDetail?.currency,
                          true
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  style={{
                    ...infoCardStyle,
                    backgroundColor: '#fffbeb',
                    border: 'none'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#fef3c7' }}
                    >
                      <ClockCircleOutlined
                        style={{ fontSize: 20, color: '#d97706' }}
                      />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        Remaining Amount
                      </div>
                      <div className="text-xl font-semibold">
                        {showAmount(
                          displayAmounts.remainingAmount,
                          invoiceDetail?.currency,
                          true
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

          {/* Invoice Info - Two Column Layout */}
          <Row gutter={24} style={{ display: 'flex', alignItems: 'stretch' }}>
            {/* Left Column */}
            <Col span={12} style={{ display: 'flex' }}>
              <Card style={{ ...infoCardStyle, marginBottom: 0, flex: 1 }}>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice ID</span>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-600">
                        {invoiceDetail?.invoiceId}
                      </span>
                      {invoiceDetail && (
                        <CopyToClipboard content={invoiceDetail.invoiceId} />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice Amount</span>
                    <span>
                      {invoiceDetail &&
                        showAmount(
                          invoiceDetail.totalAmount,
                          invoiceDetail.currency,
                          true
                        )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Type</span>
                    <span>
                      {invoiceDetail &&
                        INVOICE_BIZ_TYPE[invoiceDetail.bizType]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount Amount</span>
                    <span>
                      {invoiceDetail?.discountAmount != null
                        ? showAmount(
                            invoiceDetail.discountAmount,
                            invoiceDetail.currency,
                            true
                          )
                        : '$0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Promo Credits</span>
                    <span>
                      {showAmount(
                        invoiceDetail?.promoCreditDiscountAmount,
                        invoiceDetail?.currency,
                        true
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Right Column */}
            <Col span={12} style={{ display: 'flex' }}>
              <Card style={{ ...infoCardStyle, marginBottom: 0, flex: 1 }}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status</span>
                    <div className="flex items-center gap-2">
                      {invoiceDetail &&
                        InvoiceStatusTag(
                          invoiceDetail.status,
                          invoiceDetail.refund != null
                        )}
                      {(perm.asPaidMarkable || perm.asRefundedMarkable) && (
                        <Button
                          type="link"
                          size="small"
                          onClick={
                            perm.asRefundedMarkable
                              ? toggleMarkRefundedModal
                              : toggleMarkPaidModal
                          }
                          style={{ padding: 0 }}
                        >
                          {isRefund ? 'Mark as Refunded' : 'Mark as Paid'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Refund</span>
                    <span>
                      {invoiceDetail?.refund == null ? (
                        'No'
                      ) : (
                        <Button
                          type="link"
                          size="small"
                          onClick={toggleRefundModal}
                          style={{ padding: 0 }}
                        >
                          {showAmount(
                            invoiceDetail.refund.refundAmount,
                            invoiceDetail.refund.currency,
                            true
                          )}
                        </Button>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Gateway</span>
                    <span>{invoiceDetail?.gateway?.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subscription ID</span>
                    {invoiceDetail?.subscriptionId ? (
                      <span
                        className="text-blue-600 cursor-pointer"
                        onClick={goToSub(invoiceDetail.subscriptionId)}
                      >
                        {invoiceDetail.subscriptionId}
                      </span>
                    ) : (
                      <MinusOutlined />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">User Name (Email)</span>
                    {invoiceDetail?.userAccount ? (
                      <span
                        className="text-blue-600 cursor-pointer"
                        onClick={goToUser(invoiceDetail.userId)}
                      >
                        {`${invoiceDetail.userAccount.firstName || ''} ${invoiceDetail.userAccount.lastName || ''} (${invoiceDetail.userAccount.email})`}
                      </span>
                    ) : (
                      <MinusOutlined />
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Transaction History - Only show for split payment invoices */}
          {hasSplitPayment && (
            <TransactionHistory
              payments={splitPayments}
              currency={invoiceDetail?.currency || ''}
              loading={splitPaymentLoading}
              invoiceId={invoiceDetail?.invoiceId || ''}
              onRefund={(payment) => {
                setSelectedPaymentForRefund(payment)
                setSplitPaymentRefundModalOpen(true)
              }}
            />
          )}
        </Card>

        {/* PDF Preview Section */}
        {invoiceDetail?.sendPdf && (
          <div className="mt-6">
            <div
              className="flex items-center gap-2 cursor-pointer mb-4"
              onClick={() => setPreviewVisible(!previewVisible)}
            >
              <span className="text-lg font-medium">Preview</span>
              <span className="text-gray-400 text-sm flex items-center gap-1">
                {previewVisible ? 'Hide' : 'Show'}
                {previewVisible ? <UpOutlined /> : <DownOutlined />}
              </span>
            </div>

            {previewVisible && (
              delayingPreview ? (
                <Card style={cardStyle}>
                  <Spin indicator={<LoadingOutlined spin />} size="large">
                    <div
                      className="flex items-center justify-center"
                      style={{ height: '500px' }}
                    >
                      Invoice file loading
                    </div>
                  </Spin>
                </Card>
              ) : (
                <Card style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                  <object
                    data={invoiceDetail.sendPdf}
                    type="application/pdf"
                    style={{
                      width: '100%',
                      height: 'calc(100vh - 200px)',
                      minHeight: '600px'
                    }}
                  >
                    <p className="p-4">
                      Unable to display PDF.{' '}
                      <a
                        href={invoiceDetail.sendPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600"
                      >
                        Download invoice
                      </a>
                    </p>
                  </object>
                </Card>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Index
