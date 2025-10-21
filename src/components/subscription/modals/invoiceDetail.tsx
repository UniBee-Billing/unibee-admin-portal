import { REFUND_STATUS } from '@/constants'
import { getInvoicePermission, randomString, showAmount } from '@/helpers'
import { sendInvoiceInMailReq } from '@/requests'
import { InvoiceItem, IProfile, UserInvoice } from '@/shared.types'
import { Button, Col, Divider, message, Modal, Row } from 'antd'
import dayjs from 'dayjs'
import React, { useState } from 'react'
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
      title="Invoice Detail"
      open={true}
      width={'820px'}
      footer={null}
      closeIcon={null}
    >
      <Row>
        <Col span={6} style={{ fontWeight: 'bold' }}>
          Invoice title
        </Col>
        <Col span={6} style={{ fontWeight: 'bold' }}>
          User name
        </Col>
        <Col span={8} style={{ fontWeight: 'bold' }}>
          Payment gateway
        </Col>
        <Col span={4} style={{ fontWeight: 'bold' }}>
          Refund
        </Col>
      </Row>
      <Row
        style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}
      >
        <Col span={6}>{detail.invoiceName}</Col>
        <Col span={6}>{getUserName(detail)}</Col>
        <Col span={8}>{detail.gateway.gatewayName}</Col>
        <Col span={4}>{detail.refund !== null ? 'Yes' : 'No'}</Col>
      </Row>
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
      <Divider style={{ color: '#757575' }} />
      <Row style={{ display: 'flex', alignItems: 'center' }}>
        <Col span={12}>
          <span style={{ fontWeight: 'bold' }}>Item description</span>
        </Col>
        <Col span={4}>
          <div style={{ fontWeight: 'bold' }}>Amount</div>
        </Col>
        <Col span={1}></Col>
        <Col span={3}>
          <span style={{ fontWeight: 'bold' }}>Quantity</span>
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Total</span>
        </Col>
      </Row>
      {invoiceList &&
        invoiceList.map((v) => (
          <Row
            key={v.id}
            style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}
          >
            <Col span={12}>
              <LongTextPopover text={v.description} width="360px" />
            </Col>
            <Col span={4}>
              {showAmount(v.unitAmountExcludingTax as number, v.currency, true)}
            </Col>
            <Col span={1} style={{ fontSize: '18px' }}>
              ×
            </Col>
            <Col span={3}>{v.quantity}</Col>
            <Col span={4}>
              {showAmount(v.amountExcludingTax as number, v.currency, true)}
            </Col>
          </Row>
        ))}
      <Divider />

      <Row className="flex items-center">
        <Col span={14}> </Col>
        <Col span={6} style={{ fontSize: '18px' }} className="text-red-800">
          Subtotal
        </Col>
        <Col className="text-red-800" span={4}>
          <span>
            {`${showAmount(detail.subscriptionAmountExcludingTax, detail.currency, true)}`}
          </span>
        </Col>
      </Row>

      <Row className="flex items-center">
        <Col span={14}> </Col>
        <Col span={6} style={{ fontSize: '18px' }} className="text-red-800">
          Promo Credit{' '}
          {detail?.promoCreditTransaction != null &&
            `(${Math.abs(detail.promoCreditTransaction.deltaAmount)})`}
        </Col>
        <Col className="text-red-800" span={4}>
          <span>
            {`${showAmount(detail.promoCreditDiscountAmount * -1, detail.currency)}`}
          </span>
        </Col>
      </Row>

      <Row className="flex items-center">
        <Col span={14}> </Col>
        <Col span={6} style={{ fontSize: '18px' }} className="text-red-800">
          Total Discounted
        </Col>
        <Col className="text-red-800" span={4}>
          {detail.discount !== null ? (
            <span>
              {`${showAmount(detail.discountAmount * -1, detail.currency, true)}`}
              <CouponPopover coupon={detail.discount} />
            </span>
          ) : (
            showAmount(0, detail.currency)
          )}
        </Col>
      </Row>
      <Row>
        <Col span={14}> </Col>
        <Col span={6} style={{ fontSize: '18px' }} className="text-gray-700">
          VAT{`(${detail.taxPercentage / 100} %)`}
        </Col>
        <Col
          span={4}
          className="text-gray-700"
        >{`${showAmount(detail.taxAmount, detail.currency, true)}`}</Col>
      </Row>
      <Divider style={{ margin: '4px 0' }} />
      <Row>
        <Col span={14}> </Col>
        <Col
          span={6}
          style={{ fontSize: '18px', fontWeight: 'bold' }}
          className="text-gray-600"
        >
          Order Total
        </Col>
        <Col
          style={{ fontSize: '18px', fontWeight: 'bold' }}
          className="text-gray-600"
          span={4}
        >
          {`${showAmount(detail.totalAmount, detail.currency, true)}`}
          <div>
            <InvoiceLink invoice={detail} />
          </div>
        </Col>
      </Row>
      <div className="mt-6 flex items-center justify-end gap-4">
        <div className="flex w-full justify-between gap-4">
          <Button
            onClick={onSendInvoice}
            loading={loading}
            disabled={loading || !getInvoicePermission(detail).sendable}
          >
            Send Invoice
          </Button>
          <Button onClick={closeModal} disabled={loading} type="primary">
            Close
          </Button>
        </div>
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
