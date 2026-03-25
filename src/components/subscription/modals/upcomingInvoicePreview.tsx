import { showAmount } from '@/helpers'
import { InvoiceItem, UserInvoice } from '@/shared.types'
import { Button, Col, Divider, Modal, Row } from 'antd'

interface Props {
  invoice: UserInvoice
  onClose: () => void
}

const UpcomingInvoicePreview = ({ invoice, onClose }: Props) => {
  return (
    <Modal
      title="Upcoming Invoice Preview"
      open={true}
      width={'920px'}
      footer={null}
      closeIcon={null}
    >
      <Row style={{ display: 'flex', alignItems: 'center' }}>
        <Col span={13}>
          <span style={{ fontWeight: 'bold' }}>Item description</span>
        </Col>
        <Col span={4}>
          <div style={{ fontWeight: 'bold' }}>Unit price</div>
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Quantity</span>
        </Col>
        <Col span={3}>
          <span style={{ fontWeight: 'bold' }}>Total</span>
        </Col>
      </Row>
      <Divider plain style={{ margin: '8px 0', color: '#757575' }}>
        Next billing period invoice
      </Divider>
      <ShowInvoiceItems items={invoice.lines} currency={invoice.currency} />
      <SubtotalInfo invoice={invoice} />
      <div className="mx-0 my-4 flex justify-end gap-4">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  )
}

export default UpcomingInvoicePreview

const ShowInvoiceItems = ({
  items,
  currency
}: {
  items: InvoiceItem[]
  currency: string
}) =>
  items.map((i, idx) => (
    <Row key={idx}>
      <Col span={13} className="pr-2">
        {i.description}
      </Col>
      <Col span={4}>
        {showAmount(i.unitAmountExcludingTax as number, i.currency || currency)}
      </Col>
      <Col span={4}>{i.quantity}</Col>
      <Col span={3}>
        {showAmount(i.amountExcludingTax as number, i.currency || currency)}
      </Col>
    </Row>
  ))

const SubtotalInfo = ({ invoice }: { invoice: UserInvoice }) => (
  <>
    <div className="flex w-full justify-end">
      <div style={{ width: '260px' }}>
        <Divider plain style={{ margin: '8px 0', color: '#757575' }}></Divider>
      </div>
    </div>

    <Row>
      <Col span={17}></Col>
      <Col span={4}>Subtotal</Col>
      <Col span={3} style={{ fontWeight: 'bold' }}>
        {showAmount(invoice.subscriptionAmountExcludingTax, invoice.currency)}
      </Col>
    </Row>
    {invoice.promoCreditDiscountAmount != 0 && (
      <Row>
        <Col span={17}></Col>
        <Col span={4}>Credit used</Col>
        <Col span={3} style={{ fontWeight: 'bold' }}>
          {showAmount(-1 * invoice.promoCreditDiscountAmount, invoice.currency)}
        </Col>
      </Row>
    )}
    {invoice.discountAmount !== 0 && (
      <Row>
        <Col span={17}></Col>
        <Col span={4}>Total Discounted</Col>
        <Col span={3} style={{ fontWeight: 'bold' }}>
          {showAmount(-1 * invoice.discountAmount, invoice.currency)}
        </Col>
      </Row>
    )}

    <Row>
      <Col span={17}></Col>
      <Col span={4}>VAT({`${invoice.taxPercentage / 100}%`})</Col>
      <Col span={3} style={{ fontWeight: 'bold' }}>
        {showAmount(invoice.taxAmount, invoice.currency)}
      </Col>
    </Row>
    <Row>
      <Col span={17}></Col>
      <Col span={4}>Total</Col>
      <Col span={3} style={{ fontWeight: 'bold' }}>
        {showAmount(invoice.totalAmount, invoice.currency)}
      </Col>
    </Row>
  </>
)
