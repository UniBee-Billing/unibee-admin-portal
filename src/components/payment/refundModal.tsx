// import { EditFilled, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Modal, Row } from 'antd'
import dayjs from 'dayjs'
import { showAmount } from '../../helpers'
import { TRefund } from '../../shared.types'
import { useAppConfigStore } from '../../stores'

interface Props {
  detail: TRefund
  closeModal: () => void
}

const Index = ({ detail, closeModal }: Props) => {
  const appConfigStore = useAppConfigStore()

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
        <Col
          span={10}
          style={{ fontWeight: 'bold' }}
          className=" text-gray-600"
        >
          Refund amount
        </Col>
        <Col span={14}>{showAmount(detail.refundAmount, detail.currency)}</Col>
      </Row>
      <Row style={{ margin: '8px 0' }}>
        <Col
          span={10}
          style={{ fontWeight: 'bold' }}
          className=" text-gray-600"
        >
          Refund reason
        </Col>
        <Col span={14}>{detail.refundComment}</Col>
      </Row>

      <Row style={{ margin: '8px 0' }}>
        <Col
          span={10}
          style={{ fontWeight: 'bold' }}
          className=" text-gray-600"
        >
          Payment Id
        </Col>
        <Col span={14}>{detail.paymentId}</Col>
      </Row>

      <Row style={{ margin: '8px 0' }}>
        <Col
          span={10}
          style={{ fontWeight: 'bold' }}
          className=" text-gray-600"
        >
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
        <Col
          span={10}
          style={{ fontWeight: 'bold' }}
          className=" text-gray-600"
        >
          Created at
        </Col>
        <Col span={14}>
          {dayjs(detail.refundTime * 1000).format('YYYY-MMM-DD')}
        </Col>
      </Row>

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