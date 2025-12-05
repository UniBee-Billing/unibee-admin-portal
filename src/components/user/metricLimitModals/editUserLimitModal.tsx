import { metricLimitAdjustReq } from '@/requests'
import { LimitMetricUsage } from '@/shared.types'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Input, InputNumber, message, Modal } from 'antd'
import { useState } from 'react'

type Props = {
  userId: number
  productId: number
  subscriptionId: string
  metricLimit: LimitMetricUsage['metricLimit']
  onClose: () => void
  onSuccess: () => void
}

const EditUserLimitModal = ({
  userId,
  productId,
  subscriptionId,
  metricLimit,
  onClose,
  onSuccess
}: Props) => {
  const [amount, setAmount] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleIncrement = () => setAmount((prev) => prev + 1)
  const handleDecrement = () => setAmount((prev) => prev - 1)

  const getAmountHint = () => {
    if (amount === 0) {
      return (
        <span className="text-sm text-gray-400">
          Credit Amount hasn&apos;t changed
        </span>
      )
    }
    if (amount > 0) {
      return (
        <span className="text-sm text-green-600">
          Credit amount will be increased by {amount}
        </span>
      )
    }
    return (
      <span className="text-sm text-red-600">
        Credit amount will be decreased by {Math.abs(amount)}
      </span>
    )
  }

  const handleSubmit = async () => {
    if (amount === 0) {
      message.warning('Please enter a non-zero amount')
      return
    }
    if (!notes.trim()) {
      message.warning('Please enter notes for this adjustment')
      return
    }

    setLoading(true)
    const [, err] = await metricLimitAdjustReq({
      userId,
      subscriptionId,
      productId,
      metricCode: metricLimit.code,
      amount,
      reason: notes
    })
    setLoading(false)

    if (err != null) {
      message.error(err.message)
      return
    }

    message.success('Limit adjusted successfully')
    onSuccess()
    onClose()
  }

  return (
    <Modal
      title="Edit User's Limit"
      open={true}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <div className="py-4">
        <div className="mb-4 text-gray-600">
          Adjust the inventory of total credits
        </div>

        <div className="mb-2 flex items-center gap-2">
          <Button
            icon={<MinusOutlined />}
            onClick={handleDecrement}
            disabled={loading}
            type="text"
            style={{ color: '#f5222d' }}
          />
          <InputNumber
            value={amount}
            onChange={(val) => setAmount(val ?? 0)}
            disabled={loading}
            style={{ width: 80 }}
            controls={false}
          />
          <Button
            icon={<PlusOutlined />}
            onClick={handleIncrement}
            disabled={loading}
            type="text"
            style={{ color: '#52c41a' }}
          />
        </div>
        <div className="mb-6">{getAmountHint()}</div>

        <div className="mb-2 text-gray-600">Notes</div>
        <Input.TextArea
          placeholder="Enter Notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          showCount
          rows={3}
          disabled={loading}
        />

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Edit
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EditUserLimitModal
