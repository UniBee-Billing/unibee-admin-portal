import { Form, Skeleton } from 'antd'
import { unix } from 'dayjs'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { convertMillisecondsToSeconds, getSystemTimezone } from '../../../utils'
import { FieldsPreview } from './fieldsPreview'
import { ExportSettings, ExportSettingsValue, ExportType } from './settings'

interface PreviewProps {
  loadingSettings?: boolean
  selectedFields: string[]
  onFieldDelete: (field: string) => void
}

interface PreviewValue {
  exportColumns: string[]
  exportType: ExportType
  reportTimeEnd: number | undefined
  reportTimeStart: number | undefined
  isIncludePaidInvoices: boolean
  timezone: string
}

export interface PreviewRef {
  getValue: (validate?: boolean) => Promise<PreviewValue>
  setValue: (value: Omit<PreviewValue, 'exportColumns'>) => void
}

export const Preview = forwardRef<PreviewRef, PreviewProps>(
  ({ selectedFields, loadingSettings, onFieldDelete }, ref) => {
    const [form] = Form.useForm<ExportSettingsValue>()
    const [fields, setFields] = useState(selectedFields)
    const [previousFields, setPreviousFields] = useState(selectedFields)

    if (previousFields !== selectedFields) {
      setPreviousFields(selectedFields)
      setFields(
        selectedFields.sort(
          (prev, next) => fields.indexOf(prev) - fields.indexOf(next)
        )
      )
    }

    useImperativeHandle(ref, () => ({
      getValue: async (validate?: boolean) => {
        if (validate) {
          await form.validateFields()
        }

        const { timezone, reportDateRange, exportType, isIncludePaidInvoices } =
          form.getFieldsValue()
        const [start, end] = reportDateRange ?? []

        if (!start || !end) {
          throw new Error('Report date range is required')
        }

        return {
          reportTimeEnd: convertMillisecondsToSeconds(end.valueOf()),
          reportTimeStart: convertMillisecondsToSeconds(start.valueOf()),
          isIncludePaidInvoices,
          exportColumns: fields,
          timezone,
          exportType
        }
      },
      setValue: ({
        timezone,
        exportType,
        isIncludePaidInvoices,
        reportTimeStart,
        reportTimeEnd
      }) => {
        const formValue = {
          timezone: timezone ?? getSystemTimezone(),
          reportDateRange:
            !reportTimeStart || !reportTimeEnd
              ? []
              : [
                  unix(convertMillisecondsToSeconds(reportTimeStart)),
                  unix(convertMillisecondsToSeconds(reportTimeEnd))
                ],
          exportType: exportType || 'xlsx',
          isIncludePaidInvoices: isIncludePaidInvoices ?? false
        }

        form.setFieldsValue(formValue)
      }
    }))

    return loadingSettings ? (
      <Skeleton active />
    ) : (
      <div>
        <div className="mb-4 flex items-center">
          <div className="w-[330px] font-bold">Preview</div>
          <div className="font-bold">Settings</div>
        </div>
        <div className="flex rounded-xl border border-solid border-[#D7D5D6]">
          <FieldsPreview
            onFieldsChange={setFields}
            onDeleteButtonClick={onFieldDelete}
            className="m-1 w-80 rounded-lg bg-[#F5F5F5]"
            fields={fields}
          />
          <ExportSettings form={form} className="m-2 mt-3"></ExportSettings>
        </div>
      </div>
    )
  }
)
