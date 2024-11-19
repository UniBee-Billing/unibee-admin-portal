import { LoadingOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Empty, message, Modal, Row, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { showAmount } from '../../../helpers'
import { createPreviewReq, updateSubscription } from '../../../requests'
import { IPreview } from '../../../shared.types'

interface Props {
  subscriptionId?: string
  newPlanId: number
  addons: { quantity: number; addonPlanId: number }[]
  // previewInfo: IPreview | null
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
    console.log('subId/code: ', subscriptionId, '//', discountCode)
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
    console.log('previewRes: ', previewRes)
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
      previewInfo.prorationDate
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
      title="Subscription Update Preview"
      open={true}
      width={'820px'}
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
            <Col span={10}>
              <span style={{ fontWeight: 'bold' }}>Item description</span>
            </Col>
            <Col span={4}>
              <div style={{ fontWeight: 'bold' }}>Amount</div>
            </Col>
            <Col span={1}></Col>
            <Col span={3}>
              <span style={{ fontWeight: 'bold' }}>Quantity</span>
            </Col>
            <Col span={2}>
              <span style={{ fontWeight: 'bold' }}>Tax</span>
            </Col>
            <Col span={3}>
              <span style={{ fontWeight: 'bold' }}>Total</span>
            </Col>
          </Row>
          <Divider plain style={{ margin: '8px 0', color: '#757575' }}>
            ↓ Next billing period invoices ↓
          </Divider>
          {previewInfo !== null &&
            previewInfo.nextPeriodInvoice.lines.map((i, idx) => (
              <Row key={idx}>
                <Col span={10}>{i.description} </Col>
                <Col span={4}>
                  {showAmount(i.unitAmountExcludingTax as number, i.currency)}
                </Col>
                <Col span={1}></Col>
                <Col span={3}>{i.quantity}</Col>
                <Col span={2}>{showAmount(i.tax as number, i.currency)}</Col>
                <Col span={3}>{showAmount(i.amount as number, i.currency)}</Col>
              </Row>
            ))}
          <Row>
            <Col span={20}></Col>
            <Col span={2} style={{ fontWeight: 'bold' }}>
              {previewInfo !== null &&
                showAmount(
                  previewInfo.nextPeriodInvoice.totalAmount,
                  previewInfo.nextPeriodInvoice.currency
                )}
            </Col>
          </Row>

          <Divider plain style={{ margin: '8px 0', color: '#757575' }}>
            ↓ Current billing period invoices ↓
          </Divider>
          {previewInfo !== null &&
            previewInfo.invoice.lines.map((i, idx) => (
              <Row key={idx}>
                <Col span={10}>{i.description} </Col>
                <Col span={4}>
                  {showAmount(i.unitAmountExcludingTax as number, i.currency)}
                </Col>
                <Col span={1}></Col>
                <Col span={3}>{i.quantity}</Col>
                <Col span={2}>{showAmount(i.tax as number, i.currency)}</Col>
                <Col span={3}>{showAmount(i.amount as number, i.currency)}</Col>
              </Row>
            ))}
          <Row>
            <Col span={20}></Col>
            <Col span={2} style={{ fontWeight: 'bold' }}>
              {previewInfo !== null &&
                showAmount(
                  previewInfo.invoice.totalAmount,
                  previewInfo.invoice.currency
                )}
            </Col>
          </Row>
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
