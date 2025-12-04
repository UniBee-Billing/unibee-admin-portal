import { Button, Checkbox, DatePicker, Form, Radio, Select, message } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { WithStyle } from '../../../shared.types'
import { getSystemTimezone } from '../../../utils'
import { TimezoneSelector } from '../../timezone'
import { useCallback, useEffect, useState, useRef } from 'react'
import { convertMillisecondsToSeconds } from '../../../utils'
import { debounce } from 'lodash'
import { request } from '../../../requests/client'
import { RangePickerProps } from 'antd/es/date-picker'

export type ExportType = 'xlsx' | 'csv'

export interface ExportSettingsValue {
  exportType: ExportType
  timezone: string
  reportDateRange: [Dayjs, Dayjs] | undefined
  isIncludePaidInvoices: boolean
}

interface ExportSettingsProps {
  form: FormInstance<ExportSettingsValue>
  onExportButtonClick: () => void
  isExporting: boolean
  templateId?: number
}

export const ExportSettings = ({
  className,
  form,
  onExportButtonClick,
  isExporting,
  templateId
}: WithStyle<ExportSettingsProps>) => {
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const previousTemplateId = useRef<number | undefined>(undefined);
  
  // update from template
  const updateFormFromTemplate = useCallback((template: any) => {
    if (!template) return;
    
    const payload = template.payload || {};
    const exportType = template.format as ExportType || 'xlsx';
    const timezone = payload.timezone || getSystemTimezone();
    const isIncludePaidInvoices = payload.isIncludePaidInvoices ?? false;
    
    // set form value
    const formValues: any = {
      exportType,
      timezone,
      isIncludePaidInvoices
    };
    
  
    // only it has time date range can set
    if (payload.reportTimeStart && payload.reportTimeEnd) {
      try {
        // Import dayjs for date handling
        formValues.reportDateRange = [
          dayjs.unix(payload.reportTimeStart), 
          dayjs.unix(payload.reportTimeEnd)
        ];
      } catch (_err) {
        // console.error('Failed to set date range:', err);
      }
    }
    
    // console.log('Setting form values in ExportSettings:', formValues);
    
    // Delay setting form values to ensure component is rendered
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue(formValues);
    }, 100);
  }, [form]);
  
  // Fetch the complete data of the current template
  const fetchCurrentTemplate = useCallback(async () => {
    if (!templateId) return;
    
    try {
      const res = await request.post('/merchant/task/export_template_list', {
        task: 'InvoiceExport'
      });
      
      if (res.data.code === 0) {
        const { templates = [] } = res.data.data || {};
        const template = templates.find((t: any) => t.templateId === templateId);
        if (template) {
          setCurrentTemplate(template);
          // Refresh form values
          updateFormFromTemplate(template);
        }
      }
    } catch (_err) {
      // console.error('Failed to fetch template:', err);
    }
  }, [templateId, updateFormFromTemplate]);
  
  // Refetch template data when template ID changes
  useEffect(() => {
    if (templateId && templateId !== previousTemplateId.current) {
      // console.log(`Template ID changed from ${previousTemplateId.current} to ${templateId}`);
      previousTemplateId.current = templateId;
      fetchCurrentTemplate();
    }
  }, [templateId, fetchCurrentTemplate]);

  // Debounced function to save template settings
  const saveTemplateSettings = useCallback(
    debounce(async (updateData: any) => {
      if (!templateId) return;

      try {
        // Get current payload from the template
        let payload = {};
        let format = updateData.format;
        
        if (currentTemplate?.payload) {
          payload = {...currentTemplate.payload};
        }
        
        if (currentTemplate?.format && !format) {
          format = currentTemplate.format;
        }
        
        // If updateData contains payload fields, merge them
        if (updateData.timezone !== undefined) {
          payload = { ...payload, timezone: updateData.timezone };
        }
        
        if (updateData.reportTimeStart !== undefined) {
          payload = { ...payload, reportTimeStart: updateData.reportTimeStart };
        }
        
        if (updateData.reportTimeEnd !== undefined) {
          payload = { ...payload, reportTimeEnd: updateData.reportTimeEnd };
        }
        
        if (updateData.isIncludePaidInvoices !== undefined) {
          payload = { ...payload, isIncludePaidInvoices: updateData.isIncludePaidInvoices };
        }
        
        // Prepare the request data
        const requestData: any = {
          templateId,
          payload
        };
        
        // Only add format if it's specified
        if (format) {
          requestData.format = format;
        }

        const res = await request.post('/merchant/task/edit_export_template', requestData);

        if (res.data.code !== 0) {
          message.error(`Failed to save settings: ${res.data.message}`);
        } else {
          // Update local template state
          setCurrentTemplate((prev: any) => ({
            ...prev,
            payload,
            format: format || prev.format
          }));
        }
      } catch (err) {
        console.error('Failed to save template settings:', err);
      }
    }, 500),
    [templateId, currentTemplate]
  );

  // Handler for timezone change
  const handleTimezoneChange = (value: string) => {
    if (templateId) {
      saveTemplateSettings({ timezone: value });
    }
  };

  // Handler for date range change
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
    if (templateId && dates && dates[0] && dates[1]) {
      saveTemplateSettings({ 
        reportTimeStart: convertMillisecondsToSeconds(dates[0].valueOf()),
        reportTimeEnd: convertMillisecondsToSeconds(dates[1].valueOf())
      });
    }
  };

  // Handler for export format change
  const handleExportFormatChange = (value: ExportType) => {
    if (templateId) {
      saveTemplateSettings({ format: value });
    }
  };

  // Handler for include paid invoices change
  const handleIncludePaidInvoicesChange = (e: any) => {
    if (templateId) {
      saveTemplateSettings({ isIncludePaidInvoices: e.target.checked });
    }
  };

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
      <div className="flex gap-x-8">
        <Form.Item
          name="timezone"
          label="Time Zone"
          rules={[{ required: true }]}
        >
          <TimezoneSelector 
            style={{ width: '320px' }} 
            onChange={handleTimezoneChange}
          />
        </Form.Item>
        
        <Form.Item
          name="reportDateRange"
          label="Report from/to"
        >
          <DatePicker.RangePicker 
            className="w-full" 
            style={{ width: '320px' }} 
            onChange={handleDateRangeChange}
          />
        </Form.Item>
      </div>
      
      <Form.Item
        name="isIncludePaidInvoices"
        valuePropName="checked"
      >
        <Checkbox onChange={handleIncludePaidInvoicesChange}>
          Include invoices that were paid within the selected time range,
          even if they were created outside of it.
        </Checkbox>
      </Form.Item>
      
      <Form.Item
        name="exportType"
        label="Export format"
        rules={[{ required: true }]}
      >
        <Select
          options={[
            { value: 'xlsx', label: 'Excel xlsx' },
            { value: 'csv', label: 'CSV' }
          ]}
          style={{ width: '320px' }}
          onChange={handleExportFormatChange}
        />
      </Form.Item>
      
      <Form.Item>
        <Button
          disabled={isExporting}
          loading={isExporting}
          onClick={onExportButtonClick}
          type="primary"
          className="w-[120px] h-9"
        >
          Export
        </Button>
      </Form.Item>
    </Form>
  )
}
