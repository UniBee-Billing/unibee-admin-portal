import { LoadingOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Empty, message, Modal, Row, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { showAmount } from '../../../helpers'
import { updateSubscription } from '../../../requests'
import { Invoice, InvoiceItem, IPreview } from '../../../shared.types'

interface Props {
  subscriptionId?: string
  newPlanId: number
  addons: { quantity: number; addonPlanId: number }[]
  discountCode: string
  creditAmt: number | null
  onCancel: () => void
  onAfterConfirm: () => void
  createPreview: () => Promise<[IPreview | null, Error | null]>
}

const updateSubPreview = ({
  subscriptionId,
  newPlanId,
  addons,
  discountCode,
  creditAmt,
  onCancel,
  onAfterConfirm,
  createPreview
}: Props) => {
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [previewInfo, setPreviewInfo] = useState<IPreview | null>(null)

  const onOK = async () => {
    if (subscriptionId === undefined || previewInfo === null) {
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {
      subscriptionId,
      newPlanId,
      addons,
      confirmTotalAmount: previewInfo.totalAmount,
      confirmCurrency: previewInfo.currency,
      prorationDate: previewInfo.prorationDate,
      discountCode: discountCode,
      applyPromoCredit: creditAmt != null && creditAmt >= 0,
      applyPromoCreditAmount: creditAmt
    }
    if (!body.applyPromoCredit) {
      delete body.applyPromoCredit
      delete body.applyPromoCreditAmount
    }
    setConfirming(true)
    const [updateSubRes, err] = await updateSubscription(body)
    setConfirming(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    if (updateSubRes.paid) {
      message.success('Subscription plan upgraded')
    } else {
      message.success('Subscription plan upgraded, but not paid')
    }
    onAfterConfirm()
  }

  const fetchPreview = async () => {
    setLoading(true)
    const [previewRes, err] = await createPreview()
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setPreviewInfo(previewRes)
  }

  useEffect(() => {
    fetchPreview()
  }, [])

  return (
    <Modal
      title="Subscription Update Preview"
      open={true}
      width={'920px'}
      footer={null}
      closeIcon={null}
    >
      {loading && previewInfo === null ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spin
            spinning={true}
            indicator={<LoadingOutlined style={{ fontSize: '32px' }} spin />}
          />
        </div>
      ) : !loading && previewInfo === null ? (
        <Empty description="No preview" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
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
            ↓ Next billing period invoices ↓
          </Divider>
          {previewInfo !== null && (
            <ShowInvoiceItems items={previewInfo.nextPeriodInvoice.lines} />
          )}

          {previewInfo !== null && (
            <SubtotalInfo
              iv={previewInfo.nextPeriodInvoice}
              isCreditUsed={
                previewInfo.nextPeriodInvoice.promoCreditDiscountAmount != 0
              }
            />
          )}

          <Divider plain style={{ margin: '8px 0', color: '#757575' }}>
            ↓ Current billing period invoices ↓
          </Divider>
          {previewInfo !== null && (
            <ShowInvoiceItems items={previewInfo.invoice.lines} />
          )}

          {previewInfo !== null && (
            <SubtotalInfo
              iv={previewInfo.invoice}
              isCreditUsed={previewInfo.invoice.promoCreditDiscountAmount != 0}
            />
          )}
        </>
      )}
      <div className="mx-0 my-4 flex justify-end gap-4">
        <Button disabled={loading || confirming} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onOK}
          loading={confirming || loading}
          disabled={loading || confirming || previewInfo === null}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default updateSubPreview

const ShowInvoiceItems = ({ items }: { items: InvoiceItem[] }) =>
  items.map((i, idx) => (
    <Row key={idx}>
      <Col span={13} className="pr-2">
        {i.description}{' '}
      </Col>
      <Col span={4}>
        {showAmount(i.unitAmountExcludingTax as number, i.currency)}
      </Col>
      <Col span={4}>{i.quantity}</Col>
      <Col span={3}>
        {showAmount(i.amountExcludingTax as number, i.currency)}
      </Col>
    </Row>
  ))

const SubtotalInfo = ({
  iv,
  isCreditUsed
}: {
  iv: Invoice
  isCreditUsed: boolean
}) => (
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
        {showAmount(iv.subscriptionAmountExcludingTax, iv.currency)}
      </Col>
    </Row>
    {isCreditUsed && (
      <Row>
        <Col span={17}></Col>
        <Col span={4}>
          Credit used({iv.promoCreditPayout?.creditAmount ?? '0'})
        </Col>
        <Col span={3} style={{ fontWeight: 'bold' }}>
          {showAmount(-1 * iv.promoCreditDiscountAmount, iv.currency)}
        </Col>
      </Row>
    )}
    {iv.discountAmount !== 0 && (
      <Row>
        <Col span={17}></Col>
        <Col span={4}>
          Total Discounted
          {/* <CouponPopover coupon={discount} /> */}
        </Col>
        <Col span={3} style={{ fontWeight: 'bold' }}>
          {showAmount(-1 * iv.discountAmount, iv.currency)}
        </Col>
      </Row>
    )}

    <Row>
      <Col span={17}></Col>
      <Col span={4}>
        VAT(
        {`${iv.taxPercentage / 100}%`})
      </Col>
      <Col span={3} style={{ fontWeight: 'bold' }}>
        {showAmount(iv.taxAmount, iv.currency)}
      </Col>
    </Row>
    <Row>
      <Col span={17}></Col>
      <Col span={4}>Total</Col>
      <Col span={3} style={{ fontWeight: 'bold' }}>
        {showAmount(iv.totalAmount, iv.currency)}
      </Col>
    </Row>
  </>
)
