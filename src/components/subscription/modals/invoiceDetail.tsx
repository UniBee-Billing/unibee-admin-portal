import { Button, Col, Divider, Modal, Row } from 'antd'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { REFUND_STATUS } from '../../../constants'
import { ramdonString, showAmount } from '../../../helpers'
import { IProfile, InvoiceItem, UserInvoice } from '../../../shared.types'

interface Props {
  user: IProfile | undefined
  detail: UserInvoice
  closeModal: () => void
}

const Index = ({ detail, closeModal }: Props) => {
  const [loading] = useState(false)
  // const appConfigStore = useAppConfigStore();
  if (detail != null && detail.lines) {
    detail.lines.forEach((item) => {
      item.id = ramdonString(8)
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
        <Col span={4}>{detail.refund != null ? 'Yes' : 'No'}</Col>
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
            <Col span={4}>{REFUND_STATUS[detail.refund.status]}</Col>
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
          <div style={{ fontWeight: 'bold' }}>(excl tax)</div>
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
            <Col span={12}>{v.description}</Col>
            <Col span={4}>
              {showAmount(v.unitAmountExcludingTax as number, v.currency, true)}
            </Col>
            <Col span={1} style={{ fontSize: '18px' }}>
              ×
            </Col>
            <Col span={3}>{v.quantity}</Col>
            <Col span={4}>
              {showAmount(
                (v.unitAmountExcludingTax as number) * (v.quantity as number),
                v.currency,
                true
              )}
            </Col>
          </Row>
        ))}
      <Divider />

      <Row className="flex items-center">
        <Col span={14}> </Col>
        <Col span={6} style={{ fontSize: '18px' }} className="text-red-800">
          Total Discounted
        </Col>
        <Col
          className="text-red-800"
          span={4}
        >{`${detail.discountAmount != null && detail.discountAmount > 0 ? showAmount(-1 * detail.discountAmount, detail.currency, true) : showAmount(0, detail.currency)}`}</Col>
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
        >{`${showAmount(detail.totalAmount, detail.currency, true)}`}</Col>
      </Row>

      {/* <Row className="flex items-center">
        <Col span={20}></Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>{getTotal(invoiceList)}</span>
          total with payment link
        </Col>
      </Row> */}

      <div className="mt-6 flex items-center justify-end gap-4">
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* <Button onClick={onSendInvoice} loading={loading} disabled={loading}>
            Send Invoice
    </Button> */}
          <Button onClick={closeModal} disabled={loading} type="primary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default Index
