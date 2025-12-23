import { useEffect } from 'react'
import { Modal, Form, DatePicker, Button } from 'antd'
import { ChildCodeFilters } from './types'

interface ChildCodeFilterModalProps {
  open: boolean
  filters: ChildCodeFilters
  onClose: () => void
  onSubmit: (filters: ChildCodeFilters) => void
}

export const ChildCodeFilterModal = ({
  open,
  filters,
  onClose,
  onSubmit
}: ChildCodeFilterModalProps) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        createdDateStart: filters.createdDateStart,
        createdDateEnd: filters.createdDateEnd
      })
    }
  }, [open, filters, form])

  const handleSubmit = () => {
    const values = form.getFieldsValue()
    const cleanFilters: ChildCodeFilters = {}

    if (values.createdDateStart) {
      cleanFilters.createdDateStart = values.createdDateStart.format('YYYY-MM-DD')
    }
    if (values.createdDateEnd) {
      cleanFilters.createdDateEnd = values.createdDateEnd.format('YYYY-MM-DD')
    }

    onSubmit(cleanFilters)
  }

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={<span className="text-lg font-semibold">Filters</span>}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          label="Created Date"
        >
          <div className="flex items-center gap-2">
            <Form.Item name="createdDateStart" noStyle>
              <DatePicker placeholder="From" style={{ flex: 1 }} />
            </Form.Item>
            <span>-</span>
            <Form.Item name="createdDateEnd" noStyle>
              <DatePicker placeholder="To" style={{ flex: 1 }} />
            </Form.Item>
          </div>
        </Form.Item>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleClose}
            style={{ flex: 1 }}
          >
            Close
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            style={{ flex: 1 }}
          >
            Save Filters
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
