import { DeleteOutlined } from '@ant-design/icons'
import { Button, message, Modal } from 'antd'
// import { omit } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useExportColumnList, useFetch, useLoading } from '../../hooks'
import {
  exportDataReq,
  removeExportTmplReq,
  // saveExportColumnsReq,
  saveExportTmplReq
} from '../../requests'
import { request } from '../../requests/client'
import { useAppConfigStore } from '../../stores'
import { mapObjectKeys } from '../../utils'
import { getSystemTimezone } from '../../utils'
import { AddNewTemplateButton } from './addNewTemplateButton'
import { FieldsSelector } from './fieldsSelector'
import { Preview, PreviewRef } from './preview'
import { ExportType } from './preview/settings'
import {
  DEFAULT_TEMPLATE_NAME,
  Template,
  TemplateSelector
} from './templateSelector'
import { debounce } from 'lodash'

const findCategoryByValue = (
  columns: Record<string, string[]> | undefined,
  value: string
) => {
  const [category] =
    Object.entries(columns ?? []).find(([_, fields]) =>
      fields.map((field) => field.toLowerCase()).includes(value.toLowerCase())
    ) ?? []

  return category
}

const getTemplates = async (url: string) => {
  const { data } = await request.post(url, { task: 'InvoiceExport' })
  const { templates = [] } = data.data ?? {}

  if (templates?.length) {
    return templates
  }

  // If no templates are found, create a default template
  const [newTemplateData, err] = await saveExportTmplReq({
    task: 'InvoiceExport',
    name: DEFAULT_TEMPLATE_NAME,
    format: 'xlsx',
    payload: {
      timezone: getSystemTimezone(),
      isIncludePaidInvoices: false
    }
  })

  if (err) {
    throw err
  }

  return [newTemplateData.template]
}

export const ReportPage = () => {
  const appConfigStore = useAppConfigStore()
  const [selectedTemplate, setSelectedTemplate] = useState<
    Template | undefined
  >()
  const [selectedFields, setSelectedFields] = useState<string[][]>([])
  const currentTemplateIdRef = useRef<number | null>(null);
  const {
    data,
    loading: isLoadingTemplates,
    setData
  } = useFetch<Template[]>(
    '/merchant/task/export_template_list',
    getTemplates,
    {
      onError: (err) => message.error(err.message)
    }
  )
  const { isLoading, withLoading } = useLoading()
  const { isLoading: isDeleteLoading, withLoading: withDeleteLoading } =
    useLoading()
  const previewRef = useRef<PreviewRef | null>(null)
  const { groupColumns } =
    useExportColumnList('InvoiceExport')

  // Helper function to convert selected fields (2D array) to export columns (1D array)
  const getExportColumnsFromFields = useCallback(
    (fields: string[][]) => {
      return fields
        .map((cascadedFields) => {
          if (!cascadedFields.length) {
            return []
          }

          return cascadedFields.length === 1
            ? groupColumns[cascadedFields[0]]
            : [cascadedFields[cascadedFields.length - 1]]
        })
        .flat()
    },
    [groupColumns]
  )

  // The value of AntD CascadedSelector is a 2D array, the value format is like this:
  // if the selected fields are ['a', 'b'], which means the user selected the 'b' field under the 'a' field
  // if the selected fields are ['a'], which means the user selected all fields under the 'a' field
  // so we need to convert the 2D array to a 1D array to get the selected fields
  const selectedFieldsList = useMemo(
    () => getExportColumnsFromFields(selectedFields),
    [selectedFields, getExportColumnsFromFields]
  )

  const updateSelectedTemplate = useCallback(
    (template: Template) => {
      // Skip if the same template is already selected
      if (selectedTemplate?.templateId === template.templateId) {
        return;
      }

      // Update the current template ID reference
      currentTemplateIdRef.current = template.templateId;

      // 更新当前选中的模板
      setSelectedTemplate(template)

      // 填充导出字段列表
      const fieldsToSet = (template.exportColumns ?? [])
        .map((fieldName) => {
          const category = findCategoryByValue(groupColumns, fieldName)
          return [category, fieldName]
        })
        .filter(([category]) => !!category) as string[][];
      
      setSelectedFields(fieldsToSet);

      // 提取模板中的payload数据
      const payload = template.payload || {};
        // console.log('Updating template in UI, template data:', {
        //   format: template.format,
        //   payload,
        //   exportColumns: template.exportColumns
        // });
      
      // 先重置表单
      if (previewRef.current) {
        previewRef.current.reinitialize();
      }
      
      // 延迟一点设置表单值，确保组件已经渲染完成
      setTimeout(() => {
        // 填充导出设置
        previewRef.current!.setValue({
          exportType: template.format as ExportType,
          timezone: payload.timezone || getSystemTimezone(),
          reportTimeStart: payload.reportTimeStart,
          reportTimeEnd: payload.reportTimeEnd,
          isIncludePaidInvoices: payload.isIncludePaidInvoices !== undefined ? 
            payload.isIncludePaidInvoices : false
        });
      }, 100);
    },
    [groupColumns, selectedTemplate]
  )
  const templates = data ?? []

  // Update template in local state after changes
  const updateTemplateInLocalState = useCallback((templateId: number, exportColumns: string[]) => {
    const updatedTemplates = (templates || []).map((template: Template) => 
      template.templateId === templateId 
        ? { ...template, exportColumns } 
        : template
    );
    
    setData(updatedTemplates);
    
    if (selectedTemplate?.templateId === templateId) {
      setSelectedTemplate(prev => prev ? { ...prev, exportColumns } : prev)
    }
  }, [setData, templates, selectedTemplate])

  const saveExportColumns = useCallback(
    debounce(async (templateId: number, columns: string[]) => {
      try {
        // Find the current template from the existing templates data
        const currentTemplate = templates.find((t: Template) => t.templateId === templateId);
        
        let requestData: any = {
          templateId,
          exportColumns: columns
        };
        
        if (currentTemplate) {
          // Include existing format and payload to ensure they're not lost
          requestData = {
            ...requestData,
            format: currentTemplate.format,
            payload: currentTemplate.payload
          };
        }
        
        // Call the API with merged data
        const res = await request.post('/merchant/task/edit_export_template', requestData);
        
        if (res.data.code !== 0) {
          message.error(`Failed to save export columns: ${res.data.message}`)
        } else {
          // Update the local templates data with the new columns
          updateTemplateInLocalState(templateId, columns)
        }
      } catch (err) {
        message.error('Failed to save export columns')
      }
    }, 500),
    [updateTemplateInLocalState, templates]
  )

  // Update selectedFields and save to backend
  const handleFieldsChange = (fields: string[][]) => {
    setSelectedFields(fields)
    
    if (selectedTemplate?.templateId) {
      const exportColumns = getExportColumnsFromFields(fields)
      saveExportColumns(selectedTemplate.templateId, exportColumns)
    }
  }

  const handleFieldDelete = (fieldName: string) => {
    const flatFields = selectedFields
      .map((field) => {
        const [category] = field

        // If fields length is 1, it means the user selected all fields under the category
        return field.length === 1
          ? groupColumns[category].map((childFieldName) => [
              category,
              childFieldName
            ])
          : [field]
      })
      .flat()

    const updatedFields = flatFields.filter((fields) => fields[1] !== fieldName)
    setSelectedFields(updatedFields)
    
    // Save changes after deletion
    if (selectedTemplate?.templateId) {
      const exportColumns = getExportColumnsFromFields(updatedFields)
      saveExportColumns(selectedTemplate.templateId, exportColumns)
    }
  }

  const handleDeleteButtonClick = async () => {
    if (templates.length === 1) {
      message.error('Cannot delete the only template')
      return
    }

    if (!selectedTemplate) {
      message.error('No template selected')
      return
    }

    Modal.confirm({
      title: `Delete ${selectedTemplate.name} template?`,
      content:
        'Are you sure to delete this report template? Deleted template cannot be restored.',
      onOk: async () => {
        const [_, err] = await withDeleteLoading(
          () =>
            removeExportTmplReq({ templateId: selectedTemplate.templateId }),
          false
        )

        if (err) {
          message.error(err.message)
          return
        }

        const deletedTemplates = (data ?? []).filter(
          (template) => template.templateId !== selectedTemplate.templateId
        )

        message.success('Template deleted successfully')
        setData(deletedTemplates)
        updateSelectedTemplate(deletedTemplates[0])
      }
    })
  }

  const handleExportButtonClick = async () => {
    try {
      const {
        exportType,
        exportColumns,
        reportTimeEnd,
        reportTimeStart,
        timezone,
        isIncludePaidInvoices
      } = await previewRef.current!.getValue(true)

      if (!exportColumns.length) {
        message.error('Please select at least one category to export')
        return
      }

      if (!reportTimeEnd || !reportTimeStart) {
        message.error('Please select a date range for your report')
        return
      }

      if (reportTimeEnd < reportTimeStart) {
        message.error('End date must be after start date')
        return
      }

      const payloadValue = {
        reportTimeEnd,
        reportTimeStart,
        timeZone: timezone,
        isIncludePaidInvoices
      }

      // If the Include paid invoices checkbox is not checked, the "reportTimeStart" and
      // "reportTimeEnd" fields should be renamed to "createTimeStart" and "createTimeEnd"
      const payload = !isIncludePaidInvoices
        ? mapObjectKeys(payloadValue, 'report', 'create')
        : payloadValue

      // Also update the template with the current format and payload
      if (selectedTemplate?.templateId) {
        // Update template with the current format and payload
        try {
          // Find the current template from the existing templates data
          const currentTemplate = templates.find((t: Template) => t.templateId === selectedTemplate.templateId);
          
          if (currentTemplate) {
            // Merge the existing payload with new values
            const mergedPayload = {
              ...(currentTemplate.payload || {}),
              ...payload
            };
            
            await request.post('/merchant/task/edit_export_template', {
              templateId: selectedTemplate.templateId,
              format: exportType,
              payload: mergedPayload
            });
            
            // Update local template state
            setSelectedTemplate(prev => prev ? {
              ...prev,
              format: exportType,
              payload: {
                ...(prev.payload || {}),
                ...payload
              }
            } : prev);
          }
        } catch (_err) {
          // console.error('Failed to save template settings:', err);
        }
      }

      const [_, err] = await withLoading(
        () =>
          exportDataReq({
            task: 'InvoiceExport',
            payload,
            format: exportType,
            exportColumns
          }),
        false
      )

      if (err) {
        message.error(err.message)
        return
      }

      message.success(
        'Report is being exported, please check task list for progress.'
      )
      appConfigStore.setTaskListOpen(true)
    } catch (error: any) {
      // Display the validation error message to the user
      message.error(error.message || 'Failed to export report')
    }
  }

  const handleClearButtonClick = () => {
    setSelectedFields([])
    
    // Save empty fields when cleared
    if (selectedTemplate?.templateId) {
      saveExportColumns(selectedTemplate.templateId, [])
    }
  }

  useEffect(() => {
    // When first time loading templates, select the first template by default
    // When create a new template, select the new template by default
    if (templates.length && !selectedTemplate && !isLoadingTemplates) {
      // Set the current template ID reference
      currentTemplateIdRef.current = templates[0].templateId;
      updateSelectedTemplate(templates[0])
    }
  }, [templates, selectedTemplate, updateSelectedTemplate, isLoadingTemplates])

  return (
    <div className="flex flex-col min-h-[calc(100vh-190px)]">
      <div className="px-6 py-4 bg-white">
        <h2 className="text-xl font-bold">Report</h2>
      </div>
      <div className="w-full h-px bg-[#e5e5e5]"></div>
      <div className="flex flex-grow gap-x-6 pb-8">
        {/* Left Column */}
        <div className="w-[280px] bg-white p-4 rounded-lg border border-[#e5e5e5] flex flex-col" style={{ minHeight: '600px' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base">All templates</h3>
            {/* Search functionality not implemented yet */}
          </div>
          <AddNewTemplateButton
            templates={templates}
            onTemplateCreate={(template) => {
              setData([template].concat(templates ?? []))
              updateSelectedTemplate(template)
            }}
          />
          <div className="flex-grow my-4 overflow-y-auto" style={{ minHeight: '500px' }}>
            <TemplateSelector
              templates={templates}
              selectedTemplateName={selectedTemplate?.name}
              onChange={updateSelectedTemplate}
              isLoadingTemplates={isLoadingTemplates}
            />
          </div>
          <div className="mt-auto pt-4">
            <Button
              danger
              loading={isDeleteLoading}
              onClick={handleDeleteButtonClick}
              icon={<DeleteOutlined />}
              className="w-full flex items-center justify-center"
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-[#e5e5e5] self-stretch"></div>

        {/* Right Column */}
        <div className="flex-1 bg-white p-6 rounded-lg border border-[#e5e5e5] overflow-auto">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base">Preview</h3>
          </div>
          <div className="mt-4">
            <FieldsSelector
              value={selectedFields}
              groupColumns={groupColumns}
              onChange={handleFieldsChange}
              onClearButtonClick={handleClearButtonClick}
              selectedFields={selectedFieldsList}
              onFieldDelete={handleFieldDelete}
            />
            <div className="border-t border-gray-200 mt-4 pt-4">
              <Preview
                ref={previewRef}
                selectedFields={selectedFieldsList}
                onExportButtonClick={handleExportButtonClick}
                isExporting={isLoading}
                templateId={selectedTemplate?.templateId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
