import { Button, Col, DatePicker, Modal, Row, message } from 'antd'
// import { showAmount } from "../helpers";
import { Dayjs } from 'dayjs'
import { useState } from 'react'
import { markAsIncompleteReq } from '../../../requests'
import { ISubscriptionType } from '../../../shared.types'
import { SubscriptionStatus } from '../../ui/statusTag'

interface Props {
  subInfo: ISubscriptionType | null
  closeModal: () => void
  refresh: () => void
}
const Index = ({ subInfo, closeModal, refresh }: Props) => {
  const [loading, setLoading] = useState(false)
  const [incompleteDate, setIncompleteDate] = useState<Dayjs | null>(null)

  const onDateChange = async (date: Dayjs | null) => {
    setIncompleteDate(date)
  }

  const onConfirm = async () => {
    if (subInfo == null) {
      return
    }
    if (incompleteDate == null) {
      message.error('Plese select a date later than today')
      return
    }

    // return
    setLoading(true)
    const [_, err] = await markAsIncompleteReq(
      subInfo.subscriptionId as string,
      incompleteDate.unix()
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(
      `Subscription marked as Incomplete until ${incompleteDate.format('YYYY-MMM-DD')} `
    )
    closeModal()
    refresh()
  }

  return (
    <Modal
      title={'Update Subscription Status'}
      width={'640px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div style={{ margin: '8px 0' }}>&nbsp;</div>
      <Row>
        <Col span={8}>
          <div className="flex h-full items-center justify-center">
            Mark as &nbsp; {SubscriptionStatus(7)} until
          </div>
        </Col>
        <Col span={16}>
          <DatePicker
            format="YYYY-MMM-DD"
            allowClear={false}
            onChange={onDateChange}
            value={incompleteDate}
            disabledDate={(d) => d.isBefore(new Date())}
          />{' '}
        </Col>
      </Row>

      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading}>
          Close
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          Yes
        </Button>
      </div>
    </Modal>
  )
}

export default Index
