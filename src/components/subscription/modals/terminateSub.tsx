import LongTextPopover from '@/components/ui/longTextPopover'
import { showAmount } from '@/helpers'
import { ISubscriptionType, SubscriptionEndMode } from '@/shared.types'
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd'
import dayjs from 'dayjs'

interface Props {
  isOpen: boolean
  loading: boolean
  terminateMode:
    | SubscriptionEndMode.END_NOW
    | SubscriptionEndMode.END_AT_END_OF_BILLING_CYCLE
    | null // null: not selected
  setTerminateMode: (
    mode:
      | SubscriptionEndMode.END_NOW
      | SubscriptionEndMode.END_AT_END_OF_BILLING_CYCLE
      | null
  ) => void
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
      width={'720px'}
      open={isOpen}
      footer={null}
      closeIcon={null}
    >
      <div style={{ margin: '16px 0' }}>
        Are you sure you want to end this subscription{' '}
        <span style={{ color: 'red' }}>
          {terminateMode == SubscriptionEndMode.END_NOW
            ? 'immediately'
            : terminateMode == SubscriptionEndMode.END_AT_END_OF_BILLING_CYCLE
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
      <div className="h-2" />
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>Plan</span>
        </Col>
        <Col span={7}>
          {subInfo?.plan?.planName && (
            <LongTextPopover text={subInfo?.plan?.planName} />
          )}
        </Col>
        <Col span={5}>
          <span style={{ fontWeight: 'bold' }}>Amount</span>
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
      </Row>
      <div className="h-2" />
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
          <Radio value={SubscriptionEndMode.END_NOW}>immediately</Radio>
          <Radio value={SubscriptionEndMode.END_AT_END_OF_BILLING_CYCLE}>
            end of this cycle
          </Radio>
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
