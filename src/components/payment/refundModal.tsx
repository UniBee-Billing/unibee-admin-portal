// import { EditFilled, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Modal, Row } from 'antd'
import dayjs from 'dayjs'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { TRefund } from '../../@types/shared.types'
import { REFUND_STATUS } from '../../constants'
import { showAmount } from '../../helpers'
import { useAppConfigStore } from '../../stores'

const APP_PATH = import.meta.env.BASE_URL

interface Props {
  detail: TRefund
  originalInvoiceId: string | undefined
  closeModal: () => void
  ignoreAmtFactor: boolean
}

const Index = ({
  detail,
  originalInvoiceId,
  closeModal,
  ignoreAmtFactor
}: Props) => {
  const appConfigStore = useAppConfigStore()
  const navigate = useNavigate()

  return (
    <Modal
      title="Refund Detail"
      open={true}
      width={'620px'}
      footer={null}
      closeIcon={null}
    >
      <div style={{ height: '12px' }}></div>
      <Row style={{ margin: '8px 0' }}>
        <Col span={10} style={{ fontWeight: 'bold' }} className="text-gray-600">
          Refund amount
        </Col>
        <Col span={14}>
          {showAmount(detail.refundAmount, detail.currency, ignoreAmtFactor)}
        </Col>
      </Row>
      <Row style={{ margin: '8px 0' }}>
        <Col span={10} style={{ fontWeight: 'bold' }} className="text-gray-600">
          Refund reason
        </Col>
        <Col span={14}>{detail.refundComment}</Col>
      </Row>
      <Row style={{ margin: '8px 0' }}>
        <Col span={10} style={{ fontWeight: 'bold' }} className="text-gray-600">
          Refund status
        </Col>
        <Col span={14}>{REFUND_STATUS[detail.status]}</Col>
      </Row>

      <Row style={{ margin: '8px 0' }}>
        <Col span={10} style={{ fontWeight: 'bold' }} className="text-gray-600">
          Payment gateway
        </Col>
        <Col span={14}>
          {
            appConfigStore.gateway.find((g) => g.gatewayId == detail.gatewayId)
              ?.gatewayName
          }
        </Col>
      </Row>
      <Row style={{ margin: '8px 0' }}>
        <Col span={10} style={{ fontWeight: 'bold' }} className="text-gray-600">
          Refund at
        </Col>
        <Col span={14}>
          {dayjs(detail.createTime * 1000).format('YYYY-MMM-DD')}
        </Col>
      </Row>
      {originalInvoiceId != null && originalInvoiceId != '' && (
        <Row style={{ margin: '8px 0' }}>
          <Col
            span={10}
            style={{ fontWeight: 'bold' }}
            className="text-gray-600"
          >
            Original Invoice
          </Col>
          <Col span={14}>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() =>
                navigate(`${APP_PATH}invoice/${originalInvoiceId}`)
              }
            >
              {originalInvoiceId}
            </Button>
          </Col>
        </Row>
      )}

      <div className="mt-6 flex items-center justify-end gap-4">
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button onClick={closeModal} type="primary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default Index
