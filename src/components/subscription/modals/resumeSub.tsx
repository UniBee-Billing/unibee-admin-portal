import { Button, Col, Modal, Row } from 'antd'
import dayjs from 'dayjs'
import { ISubscriptionType } from '../../../@types/shared.types'
import { showAmount } from '../../../helpers'

interface Props {
  isOpen: boolean
  loading: boolean
  subInfo: ISubscriptionType | null
  onCancel: () => void
  onConfirm: () => void
}
const ResumeSub = ({
  isOpen,
  loading,
  subInfo,
  onCancel,
  onConfirm
}: Props) => {
  return (
    <Modal
      title="Resume Subscription"
      width={'640px'}
      open={isOpen}
      footer={null}
      closeIcon={null}
    >
      <div style={{ margin: '16px 0' }}>
        Are you sure you want to resume this subscription?
      </div>
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>First name</span>
        </Col>
        <Col span={6}>{subInfo?.user?.firstName}</Col>
        <Col span={5}>
          <span style={{ fontWeight: 'bold' }}> Lastname</span>
        </Col>
        <Col span={6}>{subInfo?.user?.lastName}</Col>
      </Row>
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>Plan</span>
        </Col>
        <Col span={6}>{subInfo?.plan?.planName}</Col>
        <Col span={5}>
          <span style={{ fontWeight: 'bold' }}>Amount</span>
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
      </Row>
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>Current due date</span>
        </Col>
        <Col span={6}>
          {dayjs((subInfo?.currentPeriodEnd as number) * 1000).format(
            'YYYY-MMM-DD'
          )}
        </Col>
      </Row>
      <div
        className="flex items-center justify-end gap-4"
        style={{
          marginTop: '24px'
        }}
      >
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default ResumeSub
