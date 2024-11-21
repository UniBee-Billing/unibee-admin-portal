import { Select, SelectProps } from 'antd'
import { useMemo } from 'react'
import { ignoreCaseLabelFilter } from '../../utils'

interface TemplatePayload {
  reportTimeEnd: number
  reportTimeStart: number
  isIncludePaidInvoices: boolean
  timezone: string
}

export interface Template {
  createTime: number
  exportColumns: string[]
  format: string
  memberId: number
  merchantId: number
  payload: TemplatePayload
  task: string
  templateId: number
  name: string
}

export interface ExportTemplateRes {
  templates: Template[]
}

interface TemplateSelectorProps extends SelectProps {
  isLoadingTemplates: boolean
  templates: Template[]
  selectedTemplateName?: string
  onChange(template: Template): void
}

export const DEFAULT_TEMPLATE_NAME = 'Default template'

export const TemplateSelector = ({
  isLoadingTemplates,
  onChange,
  selectedTemplateName,
  templates,
  ...selectProps
}: TemplateSelectorProps) => {
  const options = useMemo(
    () =>
      templates.map((template) => ({
        label: template.name,
        value: template.templateId
      })),
    [templates]
  )

  const handleTemplateChange = (templateId: number) => {
    const template = templates.find(
      (template) => template.templateId === templateId
    )

    onChange(template!)
  }

  return (
    <Select
      value={isLoadingTemplates ? '' : selectedTemplateName}
      loading={isLoadingTemplates}
      disabled={isLoadingTemplates}
      className="w-[360px]"
      showSearch
      onChange={handleTemplateChange}
      filterOption={ignoreCaseLabelFilter}
      placeholder="Select a template"
      options={options}
      {...selectProps}
    />
  )
}
