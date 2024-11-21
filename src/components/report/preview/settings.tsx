import { Checkbox, DatePicker, Form, Radio } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import { Dayjs } from 'dayjs'
import { WithStyle } from '../../../shared.types'
import { getSystemTimezone } from '../../../utils'
import { TimezoneSelector } from '../../timezone'

export type ExportType = 'xlsx' | 'csv'

export interface ExportSettingsValue {
  exportType: ExportType
  timezone: string
  reportDateRange: [Dayjs, Dayjs] | undefined
  isIncludePaidInvoices: boolean
}

interface ExportSettingsProps {
  form: FormInstance<ExportSettingsValue>
}

export const ExportSettings = ({
  className,
  form
}: WithStyle<ExportSettingsProps>) => {
  return (
    <Form
      name="basic"
      form={form}
      className={className}
      layout="vertical"
      initialValues={{
        timezone: getSystemTimezone(),
        exportType: 'xlsx',
        isIncludePaidInvoices: false
      }}
    >
      <Form.Item
        name="timezone"
        label="Time Zone:"
        rules={[{ required: true }]}
      >
        <TimezoneSelector className="w-[337px]" />
      </Form.Item>

      <Form.Item
        name="reportDateRange"
        label="Report from/to:"
        rules={[{ required: true }]}
      >
        <DatePicker.RangePicker />
      </Form.Item>

      <Form.Item name="isIncludePaidInvoices" valuePropName="checked">
        <Checkbox className="text-gray-400">
          Include invoices that were paid within the selected time range, even
          if they were created outside of it.
        </Checkbox>
      </Form.Item>

      <Form.Item
        name="exportType"
        label="Export format:"
        rules={[{ required: true }]}
      >
        <Radio.Group>
          <Radio value="xlsx">Excel xlsx</Radio>
          <Radio value="csv">CSV</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  )
}
