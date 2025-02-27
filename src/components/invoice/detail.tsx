import { LoadingOutlined, MinusOutlined } from '@ant-design/icons'
import { Button, Col, Row, Spin, message } from 'antd'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { INVOICE_BIZ_TYPE } from '../../constants'
import { getInvoicePermission, showAmount } from '../../helpers'
import { getInvoiceDetailReq } from '../../requests'
import { UserInvoice } from '../../shared.types'
import { normalizeAmt } from '../helpers'
import RefundModal from '../payment/refundModal'
import InvoiceDetailModal from '../subscription/modals/invoiceDetail'
import CopyToClipboard from '../ui/copyToClipboard'
import { InvoiceStatusTag } from '../ui/statusTag'
import MarkAsPaidModal from './markAsPaidModal'
import MarkAsRefundedModal from './markAsRefundedModal'

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }
const previewWrapperStyle: CSSProperties = {
  height: 'calc(100vh - 460px)',
  width: '100%',
  marginTop: '24px'
}

const Index = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [invoiceDetail, setInvoiceDetail] = useState<UserInvoice | null>(null)
  const [showInvoiceItems, setShowInvoiceItems] = useState(false)
  const toggleInvoiceItems = () => setShowInvoiceItems(!showInvoiceItems)
  const [refundModalOpen, setRefundModalOpen] = useState(false) // show refund detail
  const toggleRefundModal = () => setRefundModalOpen(!refundModalOpen)
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false)
  const toggleMarkPaidModal = () => setMarkPaidModalOpen(!markPaidModalOpen)
  const [markRefundedModalOpen, setMarkRefundedModalOpen] = useState(false)
  const toggleMarkRefundedModal = () =>
    setMarkRefundedModalOpen(!markRefundedModalOpen)

  // for wire-transfer or crypto payment, markAsPaid and markAsRefunded will refresh current component after success.
  // new invoice pdf file will be regenerated, but old pdf file might be cached, causing pdf show 'processing', but invoice status show 'refunded'
  // I have to deley 2.5s after refresh, then show the pdf file.
  const [delayingPreview, setDelayingPreview] = useState(false)

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

  if (delayingPreview && !loading) {
    setTimeout(() => setDelayingPreview(false), 2500)
  }

  useEffect(() => {
    if (refundModalOpen) {
      // for refund invoice, there is a 'show detail' button, click will open a Modal showing this refund's original invoice which is a link.
      // click that link will reload the current component page with THAT invoice's detail info.
      // but that original invoice is not a refund invoice, so it has no 'show detail' button, no way to open a Modal
      // so I have to close the current modal.
      toggleRefundModal()
    }
    fetchData()
  }, [location])

  const isRefund = invoiceDetail?.refund != null
  const perm = getInvoicePermission(invoiceDetail)
  return (
    <div>
      {/* <Button
        onClick={() => {
          setDelayingPreview(true)
          fetchData()
        }}
      >
        test dealing pdf preview
      </Button> */}{' '}
      {/* test dealing feature */}
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
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
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Id
        </Col>
        <Col span={6} className="flex items-center">
          {invoiceDetail?.invoiceId}{' '}
          {invoiceDetail && (
            <CopyToClipboard content={invoiceDetail.invoiceId} />
          )}
        </Col>
        <Col span={4} style={colStyle}>
          Invoice Name
        </Col>
        <Col span={6}>{invoiceDetail?.invoiceName}</Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Amount
        </Col>
        <Col span={6}>
          {invoiceDetail == null
            ? ''
            : showAmount(
                invoiceDetail?.totalAmount,
                invoiceDetail?.currency,
                true
              )}
          <span className="text-xs text-gray-500">
            {invoiceDetail == null
              ? ''
              : ` (${invoiceDetail.taxPercentage / 100}% tax incl)`}
          </span>
        </Col>
        <Col span={4} style={colStyle}>
          Status
        </Col>
        <Col span={6}>
          {invoiceDetail != null &&
            InvoiceStatusTag(
              invoiceDetail.status,
              invoiceDetail?.refund != null
            )}
          {/* 
            status == 2 (processing) is used mainly for wire-transfer payment/refund, crypto refund,
            in which cases, payment/refund status updates are not provided by 3rd party API,
            admin have to check them offline, then update their status manually.
          */}
          {/* invoiceDetail != null &&
            invoiceDetail.status == 2 &&
            (isWireTransfer || isCrypto) && (
              <Button
                onClick={
                  isRefund ? toggleMarkRefundedModal : toggleMarkPaidModal
                }
                type="link"
                style={{ padding: 0 }}
              >
                {isRefund ? 'Mark as Refunded' : 'Mark as Paid'}
              </Button>
            ) */}
          {(perm.asPaidMarkable || perm.asRefundedMarkable) && ( // these 2 are exclusive, one is true, the other is false
            <Button
              onClick={
                perm.asRefundedMarkable
                  ? toggleMarkRefundedModal
                  : toggleMarkPaidModal
              }
              type="link"
              style={{ padding: 0 }}
            >
              {isRefund ? 'Mark as Refunded' : 'Mark as Paid'}
            </Button>
          )}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Items
        </Col>
        <Col span={6}>
          <Button size="small" onClick={toggleInvoiceItems}>
            Show Detail
          </Button>
        </Col>
        <Col span={4} style={colStyle}>
          Refund
        </Col>
        <Col span={6}>
          {invoiceDetail?.refund == null ? (
            'No'
          ) : (
            <>
              <span>
                {showAmount(
                  invoiceDetail.refund.refundAmount,
                  invoiceDetail.refund.currency,
                  true
                )}
              </span>
              &nbsp;&nbsp;
              <Button size="small" onClick={toggleRefundModal}>
                Show Detail
              </Button>
            </>
          )}
        </Col>
      </Row>
      {invoiceDetail?.refund == null && (
        <Row style={rowStyle} gutter={[16, 16]}>
          <Col span={4} style={colStyle}>
            Payment type
          </Col>
          <Col span={6}>
            {invoiceDetail != null && INVOICE_BIZ_TYPE[invoiceDetail?.bizType]}
          </Col>
          <Col span={4} style={colStyle}>
            Payment Gateway
          </Col>
          <Col span={6}>{invoiceDetail?.gateway.displayName}</Col>
        </Row>
      )}
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Discount Amount
        </Col>
        <Col span={6}>
          {invoiceDetail?.discountAmount != null
            ? showAmount(
                invoiceDetail?.discountAmount,
                invoiceDetail.currency,
                true
              )
            : 'N/A'}
        </Col>
        <Col span={4} style={colStyle}>
          Subscription Id
        </Col>
        <Col span={6}>
          {' '}
          {invoiceDetail == null ||
          invoiceDetail.subscriptionId == null ||
          invoiceDetail.subscriptionId == '' ? (
            <MinusOutlined />
          ) : (
            <span
              className="cursor-pointer text-blue-600"
              onClick={goToSub(invoiceDetail.subscriptionId)}
            >
              {' '}
              {invoiceDetail?.subscriptionId}
            </span>
          )}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Promo Credits{' '}
          {invoiceDetail?.promoCreditTransaction != null &&
            `(${Math.abs(invoiceDetail.promoCreditTransaction.deltaAmount)})`}
        </Col>
        <Col span={6}>
          {showAmount(
            invoiceDetail?.promoCreditDiscountAmount,
            invoiceDetail?.currency
          )}
        </Col>

        <Col span={4} style={colStyle}>
          User Name(Email)
        </Col>
        <Col span={6}>
          <span
            className="cursor-pointer text-blue-600"
            onClick={goToUser(invoiceDetail?.userId as number)}
          >
            {invoiceDetail &&
              `${invoiceDetail?.userAccount.firstName} ${invoiceDetail.userAccount.lastName} (${invoiceDetail?.userAccount.email})`}
          </span>
        </Col>
      </Row>
      {/* <UserInfo user={userProfile} /> */}
      {invoiceDetail == null ||
      invoiceDetail.sendPdf == null ||
      invoiceDetail.sendPdf == '' ||
      loading ? null : delayingPreview ? (
        <div style={previewWrapperStyle}>
          <Spin indicator={<LoadingOutlined spin />} size="large">
            <div className="flex items-center justify-center">
              Invoice file loading
            </div>
          </Spin>
        </div>
      ) : (
        <object
          data={invoiceDetail.sendPdf}
          type="application/pdf"
          style={previewWrapperStyle}
        >
          <p>
            <a href={invoiceDetail.sendPdf}>Download invoice</a>
          </p>
        </object>
      )}
      <div className="m-8 flex justify-center">
        <Button onClick={goBack}>Back to Invoice List</Button>
      </div>
    </div>
  )
}

export default Index
