import { Button, Form, Input, message, Modal } from 'antd'
import { useState } from 'react'
import { request } from '../../../requests/client'
import { safeRun } from '../../../utils'

interface PaymentCallbackLinkEditModalProps {
  isOpen: boolean
  defaultValue: string
  hide: () => void
}

export const PaymentCallbackLinkEditModal = ({
  isOpen,
  defaultValue,
  hide
}: PaymentCallbackLinkEditModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue)
  const [value, setValue] = useState(prevDefaultValue)

  if (prevDefaultValue !== defaultValue) {
    setPrevDefaultValue(defaultValue)
    setValue(defaultValue)
  }

  const handleOkButtonClick = async () => {
    setLoading(true)

    const [_, err] = await safeRun(() =>
      request.post('/merchant/update', { host: value })
    )

    if (!err) {
      message.success('Payment callback link updated successfully')
    }

    setLoading(false)
    hide()
  }

  return (
    <Modal
      title="Payment callback link"
      width="640px"
      open={isOpen}
      onCancel={hide}
      footer={[
        <Button key="cancel" loading={loading} onClick={hide}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleOkButtonClick}
        >
          Submit
        </Button>
      ]}
    >
      <Form
        form={form}
        name="validateOnly"
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item rules={[{ required: true }]}>
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
