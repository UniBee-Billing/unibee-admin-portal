import { useEffect, useState } from 'react'
import { Modal, Form, DatePicker, Button, Select } from 'antd'
import dayjs from 'dayjs'
import { UsageRecordsFilters } from './types'
import { getPlanList } from '../../requests'
import { IPlan, PlanStatus, PlanType } from '../../shared.types'
import { formatPlanPrice } from '../../helpers'

interface UsageRecordsFilterModalProps {
  open: boolean
  filters: UsageRecordsFilters
  onClose: () => void
  onSubmit: (filters: UsageRecordsFilters) => void
}

const STATUS_OPTIONS = [
  { label: 'Finished', value: 1 },
  { label: 'Rollback', value: 2 }
]

export const UsageRecordsFilterModal = ({
  open,
  filters,
  onClose,
  onSubmit
}: UsageRecordsFilterModalProps) => {
  const [form] = Form.useForm()
  const [planList, setPlanList] = useState<IPlan[]>([])
  const [planLoading, setPlanLoading] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      setPlanLoading(true)
      const [res, err] = await getPlanList({
        type: [PlanType.MAIN, PlanType.ONE_TIME_ADD_ON],
        status: [PlanStatus.ACTIVE],
        page: 0,
        count: 500
      })
      setPlanLoading(false)
      if (!err && res?.plans) {
        const plans = res.plans.map((p: { plan: IPlan }) => p.plan)
        setPlanList(plans)
      }
    }
    if (open) {
      fetchPlans()
    }
  }, [open])

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        createTimeStart: filters.createTimeStart ? dayjs(filters.createTimeStart) : undefined,
        createTimeEnd: filters.createTimeEnd ? dayjs(filters.createTimeEnd) : undefined,
        status: filters.status,
        planIds: filters.planIds
      })
    }
  }, [open, filters, form])

  const getPlanLabel = (plan: IPlan) => {
    const priceStr = formatPlanPrice(plan)
    return `#${plan.id} ${plan.planName} (${priceStr})`
  }

  const handleSubmit = () => {
    const values = form.getFieldsValue()
    const cleanFilters: UsageRecordsFilters = {}

    if (values.createTimeStart) {
      cleanFilters.createTimeStart = values.createTimeStart.format('YYYY-MM-DD')
    }
    if (values.createTimeEnd) {
      cleanFilters.createTimeEnd = values.createTimeEnd.format('YYYY-MM-DD')
    }
    if (values.status && values.status.length > 0) {
      cleanFilters.status = values.status
    }
    if (values.planIds && values.planIds.length > 0) {
      cleanFilters.planIds = values.planIds
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
        <Form.Item label="Used at">
          <div className="flex items-center gap-2">
            <Form.Item name="createTimeStart" noStyle>
              <DatePicker placeholder="From" style={{ flex: 1 }} />
            </Form.Item>
            <span>-</span>
            <Form.Item name="createTimeEnd" noStyle>
              <DatePicker placeholder="To" style={{ flex: 1 }} />
            </Form.Item>
          </div>
        </Form.Item>

        <Form.Item name="status" label="Status">
          <Select
            mode="multiple"
            allowClear
            placeholder="Select status"
            options={STATUS_OPTIONS}
          />
        </Form.Item>

        <Form.Item name="planIds" label="Plan">
          <Select
            mode="multiple"
            allowClear
            showSearch
            placeholder="Select plans"
            loading={planLoading}
            filterOption={(input, option) => {
              const plan = planList.find(p => p.id === option?.value)
              if (!plan) return false
              return plan.planName.toLowerCase().includes(input.toLowerCase()) ||
                     plan.id.toString().includes(input)
            }}
            options={planList.map(plan => ({
              label: getPlanLabel(plan),
              value: plan.id
            }))}
          />
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
