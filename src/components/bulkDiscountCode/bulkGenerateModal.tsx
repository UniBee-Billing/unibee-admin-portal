import { useState, useEffect } from 'react'
import { Modal, Form, InputNumber, Button, message } from 'antd'
import { DiscountRule, TemplateStatus } from './types'
import { generateBatchChildrenReq } from '../../requests/batchDiscountService'

interface BulkGenerateModalProps {
  open: boolean
  rule: DiscountRule | null
  onCancel: () => void
  onSuccess: () => void
}

const MAX_QUANTITY_PER_BATCH = 1000
const MAX_CODE_LENGTH = 200

export const BulkGenerateModal = ({
  open,
  rule,
  onCancel,
  onSuccess
}: BulkGenerateModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [quantityError, setQuantityError] = useState(false)
  const [codeLengthError, setCodeLengthError] = useState<string | null>(null)

  const quantity = Form.useWatch('quantity', form)
  const codeLength = Form.useWatch('codeLength', form)

  // Min code length = master code length + 2
  const minCodeLength = (rule?.code?.length || 0) + 2

  useEffect(() => {
    if (open && rule) {
      form.resetFields()
      setQuantityError(false)
      setCodeLengthError(null)
    }
  }, [open, rule, form])

  useEffect(() => {
    setQuantityError(quantity > MAX_QUANTITY_PER_BATCH)
  }, [quantity])

  useEffect(() => {
    if (codeLength > MAX_CODE_LENGTH) {
      setCodeLengthError(`Max: ${MAX_CODE_LENGTH} symbols`)
    } else if (codeLength < minCodeLength) {
      setCodeLengthError(`Min: ${minCodeLength} (master code length + 2)`)
    } else {
      setCodeLengthError(null)
    }
  }, [codeLength, minCodeLength])

  const handleSubmit = async () => {
    if (!rule) return

    if (quantityError || codeLengthError) return

    // Check if template is activated
    if (rule.status !== TemplateStatus.ACTIVE) {
      message.error('Template must be activated before generating codes')
      return
    }

    const values = form.getFieldsValue()

    setLoading(true)
    const [result, err] = await generateBatchChildrenReq(rule.code, values.quantity, values.codeLength)
    setLoading(false)

    if (err) {
      message.error(err.message || 'Failed to generate codes')
      return
    }

    if (result) {
      message.success(`Successfully generated ${result.successCount || values.quantity} codes`)
      onSuccess()
    }
  }

  const isNotActivated = rule && rule.status !== TemplateStatus.ACTIVE
  const hasError = quantityError || !!codeLengthError

  return (
    <Modal
      title={
        <div className="text-center pt-2 pb-2">
          <h2 className="text-xl font-semibold mb-2">
            Generate Bulk Codes for {rule?.code || 'Code'}
          </h2>
          <p className="text-gray-500 font-normal text-sm">
            Create multiple unique child codes under this master rule
          </p>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={480}
      centered
      styles={{ 
        header: { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 },
        body: { paddingTop: 16 } 
      }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="quantity"
          label={<span className="text-gray-600">Quantity to generate</span>}
          validateStatus={quantityError ? 'error' : ''}
          help={
            <span style={{ color: quantityError ? '#ff4d4f' : '#8c8c8c' }}>
              Max {MAX_QUANTITY_PER_BATCH.toLocaleString()} per batch
            </span>
          }
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            status={quantityError ? 'error' : undefined}
          />
        </Form.Item>

        <Form.Item
          name="codeLength"
          label={<span className="text-gray-600">Code length</span>}
          validateStatus={codeLengthError ? 'error' : ''}
          help={
            <span style={{ color: codeLengthError ? '#ff4d4f' : '#8c8c8c' }}>
              {codeLengthError || `Range: ${minCodeLength} - ${MAX_CODE_LENGTH}`}
            </span>
          }
        >
          <InputNumber
            style={{ width: '100%' }}
            min={minCodeLength}
            max={MAX_CODE_LENGTH}
            status={codeLengthError ? 'error' : undefined}
          />
        </Form.Item>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onCancel}
            style={{ flex: 1, height: 40 }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={isNotActivated || hasError}
            loading={loading}
            style={{ flex: 1, height: 40 }}
          >
            Generate
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
