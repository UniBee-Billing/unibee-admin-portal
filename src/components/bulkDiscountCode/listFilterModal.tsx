import { useEffect } from 'react'
import { Modal, Form, Select, Button } from 'antd'
import { TemplateStatus } from './types'

interface ListFilterModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (filters: { status?: number[] }) => void
}

export const ListFilterModal = ({
  open,
  onClose,
  onSubmit
}: ListFilterModalProps) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.resetFields()
    }
  }, [open, form])

  const handleSubmit = () => {
    const values = form.getFieldsValue()
    onSubmit(values)
  }

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={<span className="text-lg font-semibold">Filters</span>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          name="status"
          label="Status"
        >
          <Select
            allowClear
            mode="multiple"
            placeholder="Choose a Status"
            options={[
              { label: 'Editing', value: TemplateStatus.EDITING },
              { label: 'Active', value: TemplateStatus.ACTIVE },
              { label: 'Inactive', value: TemplateStatus.INACTIVE },
              { label: 'Archived', value: TemplateStatus.ARCHIVED }
            ]}
          />
        </Form.Item>

        <div className="flex gap-3 mt-6 justify-end">
          <Button onClick={handleClose}>
            Close
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Save Filters
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
