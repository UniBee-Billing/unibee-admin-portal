import { Button, Col, Modal, Row } from 'antd'
import dayjs from 'dayjs'
import { daysBetweenDate, showAmount } from '../../../helpers'
import { ISubscriptionType } from '../../../shared.types'

interface Props {
  isOpen: boolean
  loading: boolean
  subInfo: ISubscriptionType | null
  newDueDate: string
  onCancel: () => void
  onConfirm: () => void
}

const ExtendSub = ({
  isOpen,
  loading,
  subInfo,
  newDueDate,
  onCancel,
  onConfirm
}: Props) => {
  return (
    <Modal
      title="Extend due date"
      open={isOpen}
      width={'640px'}
      footer={null}
      closeIcon={null}
    >
      <div style={{ margin: '16px 0' }}>
        Are you sure you want to extend the due date?
      </div>
      <Row className="mb-2">
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>First name</span>
        </Col>
        <Col span={6}>{subInfo?.user?.firstName}</Col>
        <Col span={5}>
          <span style={{ fontWeight: 'bold' }}> Lastname</span>
        </Col>
        <Col span={6}>{subInfo?.user?.lastName}</Col>
      </Row>
      <Row className="mb-2">
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
      <Row className="mb-6">
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>Current due date</span>
        </Col>
        <Col span={6}>
          {dayjs((subInfo?.currentPeriodEnd as number) * 1000).format(
            'YYYY-MMM-DD'
          )}
        </Col>
        <Col span={5}>
          <span style={{ fontWeight: 'bold' }}>New due date</span>
        </Col>
        <Col span={7}>
          {newDueDate}
          <span style={{ color: 'red' }}>
            {` (+ ${daysBetweenDate(
              newDueDate,
              (subInfo?.currentPeriodEnd as number) * 1000
            )} days)`}
          </span>
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

export default ExtendSub
