import { showAmount } from '@/helpers'
import { refundReq } from '@/requests'
import { SplitPayment } from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import { Button, Card, Form, Input, InputNumber, Modal, message } from 'antd'
import { useEffect, useState } from 'react'

interface SplitPaymentRefundModalProps {
  payment: SplitPayment | null
  invoiceId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const SplitPaymentRefundModal = ({
  payment,
  invoiceId,
  open,
  onClose,
  onSuccess
}: SplitPaymentRefundModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const supportCurrency = useAppConfigStore((state) => state.supportCurrency)
  const currencySymbol =
    supportCurrency.find((c) => c.Currency === payment?.currency)?.Symbol || '$'

  // Update form values when payment changes or modal opens
  useEffect(() => {
    if (open && payment) {
      form.setFieldsValue({
        refundAmount: payment.totalAmount / 100,
        reason: undefined
      })
    }
  }, [open, payment, form])

  const handleConfirm = async () => {
    if (!payment) return

    try {
      const values = await form.validateFields()
      setLoading(true)

      const [_, err] = await refundReq({
        invoiceId: invoiceId,
        paymentId: payment.paymentId,
        refundAmount: Math.round(values.refundAmount * 100), // Convert to cents
        reason: values.reason
      })

      setLoading(false)

      if (err) {
        message.error(err.message)
        return
      }

      message.success('Refund initiated successfully')
      form.resetFields()
      onSuccess()
      onClose()
    } catch {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  if (!payment) return null

  // Convert amount from cents to display value
  const originalAmount = payment.totalAmount / 100

  return (
    <Modal
      title="Confirm Refund"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
      centered
    >
      {/* Transaction Info Card */}
      <Card
        style={{
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          marginBottom: 24
        }}
        bodyStyle={{ padding: 16 }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-500 text-sm">Transaction ID:</div>
            <div className="font-medium">{payment.paymentId}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Gateway:</div>
            <div className="font-medium">{payment.gatewayName}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Original Amount:</div>
            <div className="font-medium">
              {showAmount(payment.totalAmount, payment.currency)}
            </div>
          </div>
        </div>
      </Card>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          refundAmount: originalAmount
        }}
      >
        <Form.Item
          label="Refund Amount"
          name="refundAmount"
          rules={[
            { required: true, message: 'Please enter refund amount' },
            {
              type: 'number',
              min: 0.01,
              max: originalAmount,
              message: `Amount must be between 0.01 and ${originalAmount}`
            }
          ]}
        >
          <InputNumber
            prefix={currencySymbol}
            style={{ width: '100%' }}
            precision={2}
            min={0.01}
            max={originalAmount}
          />
        </Form.Item>

        <Form.Item
          label="Refund Reason"
          name="reason"
          rules={[
            { required: true, message: 'Please enter refund reason' },
            { max: 64, message: 'Max 64 characters' }
          ]}
        >
          <Input.TextArea
            placeholder="Enter Refund Reason..."
            rows={3}
            maxLength={64}
            showCount
          />
        </Form.Item>
      </Form>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <Button onClick={handleClose} style={{ minWidth: 100 }}>
          Close
        </Button>
        <Button
          type="primary"
          onClick={handleConfirm}
          loading={loading}
          style={{ minWidth: 100 }}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  )
}

export default SplitPaymentRefundModal
