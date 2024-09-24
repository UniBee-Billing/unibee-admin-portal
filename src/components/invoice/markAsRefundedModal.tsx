import { Button, Form, Input, message, Modal } from 'antd'
import { useState } from 'react'
import { markRefundAsSucceedReq } from '../../requests'

const { TextArea } = Input

interface Props {
  invoiceId: string
  closeModal: () => void
  refresh: () => void
  setDelayingPreview?: (v: boolean) => void
}

const Index = ({
  closeModal,
  refresh,
  invoiceId,
  setDelayingPreview
}: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onConfirm = async () => {
    setLoading(true)
    const [_, err] = await markRefundAsSucceedReq(
      invoiceId,
      form.getFieldValue('reason')
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    if (setDelayingPreview) {
      setDelayingPreview(true)
    }
    refresh()
    closeModal()
  }

  return (
    <Modal
      title="Refunded Confirm"
      open={true}
      width={'682px'}
      footer={null}
      closeIcon={null}
    >
      <div style={{ height: '12px' }}></div>
      <p>
        Are you sure you have refunded user's payment, and want to mark refund
        status as <span className="text-red-600">SUCCEEDED</span> ?
      </p>
      <Form
        form={form}
        onFinish={onConfirm}
        labelCol={{ flex: '80px' }}
        wrapperCol={{ flex: 1 }}
        colon={false}
        disabled={loading}
        style={{ marginTop: '18px' }}
      >
        <Form.Item
          label="Comment"
          name="reason"
          rules={[
            {
              required: true,
              message: 'Please input your comment!'
            }
          ]}
        >
          <TextArea
            showCount
            maxLength={120}
            style={{ height: 120, resize: 'none' }}
          />
        </Form.Item>
      </Form>

      <div className="mt-6 flex items-center justify-end gap-4">
        <div style={{ display: 'flex', gap: '16px', margin: '16px 0' }}>
          <Button onClick={closeModal} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={form.submit}
            type="primary"
            disabled={loading}
            loading={loading}
          >
            Mark as Refunded
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default Index
