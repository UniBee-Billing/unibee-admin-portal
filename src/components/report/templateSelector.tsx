import { Button, Select, SelectProps, Skeleton } from 'antd'
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
  const handleTemplateChange = (templateId: number) => {
    const template = templates.find(
      (template) => template.templateId === templateId
    )
    if (template) {
      onChange(template)
    }
  }

  if (isLoadingTemplates) {
    return <Skeleton active paragraph={{ rows: 4 }} />
  }

  return (
    <div className="flex flex-col gap-y-2">
      {templates.map((template) => {
        const isSelected = selectedTemplateName === template.name
        return (
          <Button
            key={template.templateId}
            onClick={() => handleTemplateChange(template.templateId)}
            className={`w-full text-left justify-start h-auto py-2 px-3 whitespace-normal ${
              isSelected
                ? 'border-blue-400 bg-white text-blue-500'
                : 'border-gray-300'
            }`}
            style={{
              borderColor: isSelected ? '#3B82F6' : '#D1D5DB',
              color: isSelected ? '#3B82F6' : 'inherit'
            }}
          >
            {template.name}
          </Button>
        )
      })}
    </div>
  )
}
