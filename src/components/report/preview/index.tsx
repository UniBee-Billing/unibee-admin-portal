import { Form, Skeleton } from 'antd'
import dayjs, { unix } from 'dayjs'
import { forwardRef, useImperativeHandle, useEffect } from 'react'
import { convertMillisecondsToSeconds, getSystemTimezone } from '../../../utils'
import { ExportSettings, ExportSettingsValue, ExportType } from './settings'

interface PreviewProps {
  loadingSettings?: boolean
  selectedFields: string[]
  onExportButtonClick: () => void
  isExporting: boolean
  templateId?: number
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
  reinitialize: () => void
}

export const Preview = forwardRef<PreviewRef, PreviewProps>(
  ({ selectedFields, loadingSettings, onExportButtonClick, isExporting, templateId }, ref) => {
    const [form] = Form.useForm<ExportSettingsValue>()

    useImperativeHandle(ref, () => ({
      getValue: async (validate?: boolean) => {
        if (validate) {
          // When validating for export, we need to check the date range
          try {
            await form.validateFields(['timezone', 'exportType'])
            
            // Manually validate reportDateRange
            const values = form.getFieldsValue()
            if (!values.reportDateRange || !values.reportDateRange[0] || !values.reportDateRange[1]) {
              // Create a proper error object that will be caught by the try-catch in handleExportButtonClick
              throw new Error('Please select a date range for your report')
            }
          } catch (error) {
            // Re-throw the error to be caught by the caller
            throw error
          }
        }

        const {
          timezone,
          reportDateRange,
          exportType,
          isIncludePaidInvoices
        } = form.getFieldsValue()

        return {
          reportTimeEnd: reportDateRange?.[1]
            ? convertMillisecondsToSeconds(reportDateRange[1].valueOf())
            : undefined,
          reportTimeStart: reportDateRange?.[0]
            ? convertMillisecondsToSeconds(reportDateRange[0].valueOf())
            : undefined,
          isIncludePaidInvoices,
          exportColumns: selectedFields,
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
        // console.log('Setting form values:', {
        //   timezone,
        //   exportType,
        //   isIncludePaidInvoices,
        //   reportTimeStart,
        //   reportTimeEnd
        // });
        
        // Use setTimeout to ensure values are set in the next event loop to avoid race conditions
        setTimeout(() => {
          const formValue: ExportSettingsValue = {
            timezone: timezone ?? getSystemTimezone(),
            exportType: exportType || 'xlsx',
            isIncludePaidInvoices: isIncludePaidInvoices ?? false,
            reportDateRange: reportTimeStart && reportTimeEnd 
              ? [dayjs.unix(reportTimeStart), dayjs.unix(reportTimeEnd)] 
              : undefined
          };
          
          // console.log('Form values to set:', formValue);
          
          // Reset form and set new values
          form.resetFields();
          form.setFieldsValue(formValue);
          
          // Force form update without validating reportDateRange
          form.validateFields(['timezone', 'exportType', 'isIncludePaidInvoices'])
            .catch(() => {}); // Ignore potential validation errors
        }, 0);
      },
      reinitialize: () => {
        form.resetFields();
        form.setFieldsValue({
          timezone: getSystemTimezone(),
          exportType: 'xlsx',
          isIncludePaidInvoices: false,
          reportDateRange: undefined
        });
      }
    }));

    // Force refresh form when templateId changes
    useEffect(() => {
      if (templateId) {
        // Simple delay to ensure form has time to load template data
        const timer = setTimeout(() => {
          // Only validate fields that are required regardless of exporting
          form.validateFields(['timezone', 'exportType', 'isIncludePaidInvoices'])
            .catch(() => {});
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [templateId, form]);

    if (loadingSettings) {
      return <Skeleton active />
    }

    return (
      <ExportSettings
        form={form}
        onExportButtonClick={onExportButtonClick}
        isExporting={isExporting}
        templateId={templateId}
      />
    )
  }
)
