import { LoadingOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Empty, message, Modal, Row, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { showAmount } from '../../../helpers'
import { createPreviewReq, updateSubscription } from '../../../requests'
import { Invoice, InvoiceItem, IPreview } from '../../../shared.types'

interface Props {
  subscriptionId?: string
  newPlanId: number
  addons: { quantity: number; addonPlanId: number }[]
  discountCode: string
  onCancel: () => void
  onAfterConfirm: () => void
}

const updateSubPreview = ({
  subscriptionId,
  newPlanId,
  addons,
  discountCode,
  onCancel,
  onAfterConfirm
}: Props) => {
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [previewInfo, setPreviewInfo] = useState<IPreview | null>(null)

  const createPreview = async () => {
    if (subscriptionId === undefined) {
      return
    }
    setLoading(true)
    const [previewRes, err] = await createPreviewReq(
      subscriptionId,
      newPlanId,
      addons,
      discountCode
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return err
    }
    setPreviewInfo(previewRes)
    return null
  }

  const onOK = async () => {
    if (subscriptionId === undefined || previewInfo === null) {
      return
    }

    setConfirming(true)
    const [updateSubRes, err] = await updateSubscription(
      subscriptionId,
      newPlanId,
      addons,
      previewInfo.totalAmount,
      previewInfo.currency,
      previewInfo.prorationDate,
      discountCode
    )
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

  useEffect(() => {
    createPreview()
  }, [])

  return (
    <Modal
      title="Subscription Upgrade Preview"
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
            <Col span={9}>
              <span style={{ fontWeight: 'bold' }}>Item description</span>
            </Col>
            <Col span={4}>
              <div style={{ fontWeight: 'bold' }}>Unit price</div>
            </Col>
            <Col span={1}></Col>
            <Col span={3}>
              <span style={{ fontWeight: 'bold' }}>Quantity</span>
            </Col>
            <Col span={4}>
              <span style={{ fontWeight: 'bold' }}>VAT</span>
            </Col>
            <Col span={3}>
              <span style={{ fontWeight: 'bold' }}>Total</span>
            </Col>
          </Row>
          <Divider plain style={{ margin: '12px 0', color: '#757575' }}>
            ↓ Next billing period invoice ↓
          </Divider>
          {previewInfo !== null && (
            <ShowInvoiceItems items={previewInfo.nextPeriodInvoice.lines} />
          )}

          {previewInfo !== null && (
            <SubtotalInfo
              iv={previewInfo.nextPeriodInvoice}
              hideDetail={true}
              showButton={true}
              // discount={previewInfo.discount}
            />
          )}

          <Divider plain style={{ margin: '12px 0', color: '#757575' }}>
            ↓ Current billing period invoice ↓
          </Divider>
          {previewInfo !== null && (
            <ShowInvoiceItems items={previewInfo.invoice.lines} />
          )}

          {previewInfo !== null && (
            <SubtotalInfo
              iv={previewInfo.invoice}
              // discount={previewInfo.discount}
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
          loading={loading}
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
      <Col span={9} className="pr-2">
        {i.description}{' '}
      </Col>
      <Col span={4}>
        {showAmount(i.unitAmountExcludingTax as number, i.currency)}
      </Col>
      <Col span={1}></Col>
      <Col span={3}>{i.quantity}</Col>
      <Col span={4}>
        {showAmount(i.tax as number, i.currency)}
        <span className="text-xs text-gray-500">{` (${(i.taxPercentage as number) / 100}%)`}</span>
      </Col>
      <Col span={3}>{showAmount(i.amount as number, i.currency)}</Col>
    </Row>
  ))

const SubtotalInfo = ({
  iv,
  hideDetail,
  showButton
}: {
  iv: Invoice
  hideDetail?: boolean
  showButton?: boolean
}) => {
  const [hide, setHide] = useState(!!hideDetail)
  return (
    <>
      <div className="flex w-full justify-end">
        <div style={{ width: '260px' }}>
          <Divider
            plain
            style={{ margin: '8px 0', color: '#757575' }}
          ></Divider>
        </div>
      </div>

      {
        <div
          style={{
            height: hide ? '0px' : '66px',
            visibility: hide ? 'hidden' : 'visible'
          }}
        >
          <Row>
            <Col span={17}></Col>
            <Col span={4}>Subtotal</Col>
            <Col span={3} style={{ fontWeight: 'bold' }}>
              {showAmount(iv.subscriptionAmountExcludingTax, iv.currency)}
            </Col>
          </Row>
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
        </div>
      }
      <Row>
        <Col span={17}></Col>
        <Col span={4}>
          Total{' '}
          {showButton && (
            <span
              className="text-xs text-blue-500 hover:cursor-pointer"
              onClick={() => setHide(!hide)}
            >
              {hide ? 'more' : 'less'}
            </span>
          )}
        </Col>
        <Col span={3} style={{ fontWeight: 'bold' }}>
          {showAmount(iv.totalAmount, iv.currency)}
        </Col>
      </Row>
    </>
  )
}

{
  /* <Button type="link" onClick={() => setHide(!hide)}>
              push
            </Button> */
}
