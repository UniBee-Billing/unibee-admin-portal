import { REFUND_STATUS } from '@/constants'
import { getInvoicePermission, randomString, showAmount } from '@/helpers'
import { sendInvoiceInMailReq } from '@/requests'
import { InvoiceItem, IProfile, UserInvoice } from '@/shared.types'
import { Button, Col, Divider, message, Modal, Row } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import CouponPopover from '../../ui/couponPopover'
import LongTextPopover from '../../ui/longTextPopover'

interface Props {
  user: IProfile | undefined
  detail: UserInvoice
  closeModal: () => void
}

const Index = ({ detail, closeModal }: Props) => {
  const [loading, setLoading] = useState(false)
  if (detail != null && detail.lines) {
    detail.lines.forEach((item) => {
      item.id = randomString(8)
    })
  }

  const [invoiceList] = useState<InvoiceItem[]>(detail.lines)

  const getUserName = (iv: UserInvoice) => {
    if (iv.userAccount == null) {
      return ''
    }
    return (
      <a
        href={`mailto: ${iv.userAccount.email}`}
      >{`${iv.userAccount.firstName} ${iv.userAccount.lastName}`}</a>
    )
  }

  const onSendInvoice = async () => {
    if (detail == null || detail.invoiceId == '' || detail.invoiceId == null) {
      return
    }
    setLoading(true)
    const [_, err] = await sendInvoiceInMailReq(detail.invoiceId)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Invoice sent.')
    closeModal()
  }

  return (
    <Modal
      title={<div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 600 }}>Invoice Detail</div>}
      open={true}
      width={'720px'}
      footer={null}
      closeIcon={<span style={{ fontSize: '20px' }}>×</span>}
      onCancel={closeModal}
    >
      {/* Header Info Card */}
      <div style={{
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '24px'
      }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>Invoice Title:</div>
            <div style={{ fontWeight: 500, fontSize: '15px' }}>{detail.invoiceName}</div>
          </Col>
          <Col span={12}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>Payment Gateway:</div>
            <div style={{ fontWeight: 500, fontSize: '15px' }}>{detail.gateway.gatewayName}</div>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: '12px' }}>
          <Col span={12}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>User Name:</div>
            <div style={{ fontWeight: 500, fontSize: '15px' }}>{getUserName(detail)}</div>
          </Col>
          <Col span={12}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>Refund:</div>
            <div style={{ fontWeight: 500, fontSize: '15px' }}>{detail.refund !== null ? 'Yes' : 'No'}</div>
          </Col>
        </Row>
      </div>
      {detail.refund && (
        <div style={{ margin: '22px 0' }}>
          <Divider style={{ color: '#757575', fontSize: '14px' }}>
            Refund detail
          </Divider>
          <Row style={{ fontWeight: 'bold' }} className="text-gray-500">
            <Col span={4}>Amount</Col>
            <Col span={8}>Reason</Col>
            <Col span={8}>Created at</Col>
            <Col span={4}>Status</Col>
          </Row>
          <Row className="text-gray-500">
            <Col span={4}>
              {showAmount(
                detail.refund.refundAmount,
                detail.refund.currency,
                true
              )}
            </Col>
            <Col span={8}>{detail.refund.refundComment}</Col>
            <Col span={8}>
              {dayjs(detail.refund.createTime * 1000).format('YYYY-MMM-DD')}
            </Col>
            <Col span={4}>{REFUND_STATUS[detail.refund.status].label}</Col>
          </Row>
        </div>
      )}
      {/* Items Table */}
      <div style={{ border: '1px solid #e8e8e8', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
        <Row style={{
          backgroundColor: '#f5f5f5',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Col span={10}>
            <span style={{ fontWeight: 600, color: '#333' }}>Invoice title</span>
          </Col>
          <Col span={5} style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 600, color: '#333' }}>Total Amount</span>
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: 600, color: '#333' }}>Quantity</span>
          </Col>
          <Col span={5} style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 600, color: '#333' }}>Total</span>
          </Col>
        </Row>
        {invoiceList &&
          invoiceList.map((v) => (
            <Row
              key={v.id}
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                borderTop: '1px solid #f0f0f0'
              }}
            >
              <Col span={10}>
                <LongTextPopover text={v.description} width="320px" />
              </Col>
              <Col span={5} style={{ textAlign: 'right' }}>
                {showAmount(v.unitAmountExcludingTax as number, v.currency, true)}
              </Col>
              <Col span={4} style={{ textAlign: 'center' }}>
                {v.quantity}
              </Col>
              <Col span={5} style={{ textAlign: 'right' }}>
                {showAmount(v.amountExcludingTax as number, v.currency, true)}
              </Col>
            </Row>
          ))}
      </div>

      {/* Summary Card */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          border: '1px solid #e8e8e8',
          borderRadius: '8px',
          padding: '16px 20px',
          minWidth: '280px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666' }}>Subtotal</span>
            <span>{showAmount(detail.subscriptionAmountExcludingTax, detail.currency, true)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666' }}>Promo Credit</span>
            <span>{showAmount(detail.promoCreditDiscountAmount * -1, detail.currency, true)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666' }}>
              Total Discounted
              {detail.discount !== null && <CouponPopover coupon={detail.discount} />}
            </span>
            <span>
              {detail.discount !== null
                ? showAmount(detail.discountAmount * -1, detail.currency, true)
                : showAmount(0, detail.currency)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666' }}>VAT({detail.taxPercentage / 100}%)</span>
            <span>{showAmount(detail.taxAmount, detail.currency, true)}</span>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Order Total</span>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>
              {showAmount(detail.totalAmount, detail.currency, true)}
            </span>
          </div>
          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <InvoiceLink invoice={detail} />
          </div>
        </div>
      </div>
      {/* Footer Buttons */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
        <Button
          onClick={closeModal}
          disabled={loading}
          style={{ flex: 1, height: '44px', fontSize: '15px' }}
        >
          Close
        </Button>
        <Button
          type="primary"
          onClick={onSendInvoice}
          loading={loading}
          disabled={loading || !getInvoicePermission(detail).sendable}
          style={{
            flex: 1,
            height: '44px',
            fontSize: '15px'
          }}
        >
          Send Invoice
        </Button>
      </div>
    </Modal>
  )
}

export default Index

const InvoiceLink = ({ invoice }: { invoice: UserInvoice }) => {
  let label = ''
  if (invoice.status === 2) {
    // Awaiting payment
    label = 'Payment link'
  } else if (invoice.status === 3) {
    // Paid or refunded
    label = 'Invoice link'
  } else {
    return null
  }
  return (
    <a
      href={invoice.link}
      target="_blank"
      className="text-sm text-gray-400"
      rel="noreferrer"
    >
      {label}
    </a>
  )
}

