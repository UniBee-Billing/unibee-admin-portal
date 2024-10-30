import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd'
import dayjs from 'dayjs'
import { showAmount } from '../../../helpers'
import { ISubscriptionType } from '../../../shared.types'

interface Props {
  isOpen: boolean
  loading: boolean
  terminateMode: 1 | 2 | null // 1: immediate, 2: end of this billing cycle, null: not selected
  setTerminateMode: (mode: 1 | 2 | null) => void
  subInfo: ISubscriptionType | null
  onCancel: () => void
  onConfirm: () => void
}

const TerminateSub = ({
  isOpen,
  loading,
  terminateMode,
  setTerminateMode,
  subInfo,
  onCancel,
  onConfirm
}: Props) => {
  // select immediate or end of this billing cycle
  const onEndSubModeChange = (e: RadioChangeEvent) => {
    setTerminateMode(e.target.value)
  }
  return (
    <Modal
      title="Terminate Subscription"
      width={'640px'}
      open={isOpen}
      footer={null}
      closeIcon={null}
    >
      <div style={{ margin: '16px 0' }}>
        Are you sure you want to end this subscription{' '}
        <span style={{ color: 'red' }}>
          {terminateMode == 1
            ? 'immediately'
            : terminateMode == 2
              ? 'at the end of billing cycle'
              : ''}
        </span>
        ?
      </div>
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>First name</span>
        </Col>
        <Col span={7}>{subInfo?.user?.firstName}</Col>
        <Col span={5}>
          <span style={{ fontWeight: 'bold' }}> Lastname</span>
        </Col>
        <Col span={6}>{subInfo?.user?.lastName}</Col>
      </Row>
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>Plan</span>
        </Col>
        <Col span={7}>{subInfo?.plan?.planName}</Col>
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
        <Col span={7}>
          {dayjs((subInfo?.currentPeriodEnd as number) * 1000).format(
            'YYYY-MMM-DD'
          )}
        </Col>
      </Row>
      <Radio.Group
        onChange={onEndSubModeChange}
        value={terminateMode}
        style={{ margin: '18px 0' }}
      >
        <Space direction="vertical">
          <Radio value={1}>immediately</Radio>
          <Radio value={2}>end of this cycle</Radio>
        </Space>
      </Radio.Group>
      <div className="mt-6 flex items-center justify-end gap-4">
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

export default TerminateSub
