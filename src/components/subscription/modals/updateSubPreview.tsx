import { LoadingOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Modal, Row, Spin } from 'antd'
import { showAmount } from '../../../helpers'
import { IPreview } from '../../../shared.types'

interface Props {
  isOpen: boolean
  loading: boolean
  previewInfo: IPreview | null
  onCancel: () => void
  onConfirm: () => void
}

const updateSubPreview = ({
  isOpen,
  loading,
  previewInfo,
  onCancel,
  onConfirm
}: Props) => {
  return (
    <Modal
      title="Subscription Update Preview"
      open={isOpen}
      width={'820px'}
      footer={null}
      closeIcon={null}
    >
      {previewInfo == null ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spin
            spinning={true}
            indicator={<LoadingOutlined style={{ fontSize: '32px' }} spin />}
          />
        </div>
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
          {previewInfo.nextPeriodInvoice.lines.map((i, idx) => (
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
              {showAmount(
                previewInfo.nextPeriodInvoice.totalAmount,
                previewInfo.nextPeriodInvoice.currency
              )}
            </Col>
          </Row>

          <Divider plain style={{ margin: '8px 0', color: '#757575' }}>
            ↓ Current billing period invoices ↓
          </Divider>
          {previewInfo.invoice.lines.map((i, idx) => (
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
              {showAmount(
                previewInfo.invoice.totalAmount,
                previewInfo.invoice.currency
              )}
            </Col>
          </Row>
          <div className="mx-0 my-4 flex justify-end gap-4">
            <Button disabled={loading} onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={onConfirm}
              loading={loading}
              disabled={loading}
            >
              Confirm
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}

export default updateSubPreview
