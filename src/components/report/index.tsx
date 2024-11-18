import { Button, message } from 'antd'
import { omit } from 'lodash'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useExportColumnList, useFetch, useLoading } from '../../hooks'
import { exportDataReq, saveExportTmplReq } from '../../requests'
import { request } from '../../requests/client'
import { useAppConfigStore } from '../../stores'
import { mapObjectKeys } from '../../utils'
import { AddNewTemplateButton } from './addNewTemplateButton'
import { FieldsSelector } from './fieldsSelector'
import { Preview, PreviewRef } from './preview'
import { ExportType } from './preview/settings'
import {
  DEFAULT_TEMPLATE_NAME,
  Template,
  TemplateSelector
} from './templateSelector'

const findCategoryByValue = (
  columns: Record<string, string[]>,
  value: string
) => {
  const [category] =
    Object.entries(columns).find(([_, fields]) =>
      fields.map((field) => field.toLowerCase()).includes(value.toLowerCase())
    ) ?? []

  return category
}

const getTemplates = async (url: string) => {
  const { data } = await request.post(url, { task: 'InvoiceExport' })
  const { templates } = data.data

  if (templates?.length) {
    return templates
  }

  // If no templates are found, create a default template
  const [newTemplateData, err] = await saveExportTmplReq({
    task: 'InvoiceExport',
    name: DEFAULT_TEMPLATE_NAME
  })

  if (err) {
    return err
  }

  return [newTemplateData.template]
}

export const ReportPage = () => {
  const appConfigStore = useAppConfigStore()
  const [selectedTemplate, setSelectedTemplate] = useState<
    Template | undefined
  >()
  const [selectedFields, setSelectedFields] = useState<string[][]>([])
  const [editSelectedTemplateName, setEditSelectedTemplateName] = useState(
    selectedTemplate?.name
  )
  const {
    data,
    loading: isLoadingTemplates,
    setData
  } = useFetch<Template[]>(
    '/merchant/task/export_template_list',
    getTemplates,
    { onSuccess: (data) => setEditSelectedTemplateName(data[0]?.name) }
  )
  const { isLoading, withLoading } = useLoading()
  const { isLoading: isSaveButtonLoading, withLoading: withSaveButtonLoading } =
    useLoading()
  const previewRef = useRef<PreviewRef | null>(null)
  const { groupColumns, loading: loadingColumnList } =
    useExportColumnList('InvoiceExport')

  const [stashTemplates, setStashTemplates] = useState<Template[]>([])

  const columns = useMemo(
    () => Object.values(groupColumns ?? {}).flat(),
    [groupColumns]
  )

  // The value of AntD CascadedSelector is a 2D array, the value format is like this:
  // if the selected fields are ['a', 'b'], which means the user selected the 'b' field under the 'a' field
  // if the selected fields are ['a'], which means the user selected all fields under the 'a' field
  // so we need to convert the 2D array to a 1D array to get the selected fields
  const selectedFieldsList = useMemo(
    () =>
      selectedFields
        .map((cascadedFields) => {
          if (!cascadedFields.length) {
            return []
          }

          return cascadedFields.length === 1
            ? groupColumns[cascadedFields[0]]
            : [cascadedFields[cascadedFields.length - 1]]
        })
        .flat(),
    [selectedFields]
  )

  const updateSelectedTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setEditSelectedTemplateName(template.name)

    // Fill invoice fields when selected template was changed
    setSelectedFields(
      (template.exportColumns ?? [])
        .map((fieldName) => {
          const category = findCategoryByValue(groupColumns, fieldName)

          return [category, fieldName]
        })
        .filter(([category]) => !!category) as string[][]
    )

    // Fill export settings when selected template was changed
    previewRef.current!.setValue({
      exportType: template.format as ExportType,
      ...(template.payload ?? {})
    })
  }

  const templates = useMemo(
    () => stashTemplates.concat(data ?? []),
    [data, stashTemplates]
  )

  const handleSearchFieldNameSelected = useCallback(
    (fieldName: string) => {
      const category = findCategoryByValue(groupColumns, fieldName)

      if (!category) {
        throw new Error('Category not found')
      }

      setSelectedFields((selectedFields) =>
        selectedFields.concat([[category, fieldName]])
      )
    },
    [groupColumns]
  )

  const handleSaveButtonClick = async () => {
    if (!selectedTemplate || !editSelectedTemplateName) {
      message.error('Please create a template first')
      return
    }

    const settingsValue = await previewRef.current!.getValue(false)
    const [editedData, err] = await withSaveButtonLoading(
      () =>
        saveExportTmplReq({
          task: 'InvoiceExport',
          templateId: selectedTemplate.templateId,
          name: editSelectedTemplateName,
          exportColumns: selectedFieldsList,
          payload: omit(settingsValue, 'exportType', 'exportColumns'),
          format: settingsValue.exportType
        }),
      false
    )

    if (err) {
      message.error(err.message)
      return
    }

    message.success('Template saved successfully')

    setData(
      (data ?? []).map((template: Template) =>
        template.templateId === editedData.template.templateId
          ? editedData.template
          : template
      )
    )
    setSelectedTemplate(editedData.template)
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

    setSelectedFields(flatFields.filter((fields) => fields[1] !== fieldName))
  }

  const handleExportButtonClick = async () => {
    const {
      exportType,
      exportColumns,
      reportTimeEnd,
      reportTimeStart,
      timezone,
      isIncludePaidInvoices
    } = await previewRef.current!.getValue()

    if (!exportColumns.length) {
      message.error('Please select at least one field to export')
      return
    }

    if (!reportTimeEnd || !reportTimeStart) {
      message.error('Please select report start and end date')
      return
    }

    if (reportTimeEnd < reportTimeStart) {
      message.error('Report end date should be later than start date')
      return
    }

    const payloadValue = {
      reportTimeEnd,
      reportTimeStart,
      timeZone: timezone
    }

    // If the Include paid invoices checkbox is not checked, the "reportTimeStart" and
    // "reportTimeEnd" fields should be renamed to "createTimeStart" and "createTimeEnd"
    const payload = !isIncludePaidInvoices
      ? mapObjectKeys(payloadValue, 'report', 'create')
      : payloadValue

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
  }

  return (
    <div>
      <div>
        <TemplateSelector
          selectedTemplateName={selectedTemplate?.name ?? templates[0]?.name}
          templates={templates}
          isLoadingTemplates={isLoadingTemplates}
          onChange={updateSelectedTemplate}
        />
        <AddNewTemplateButton
          onTemplateCreate={(template) => {
            setStashTemplates((stashTemplates) =>
              stashTemplates.concat(template)
            )
            updateSelectedTemplate(template)
          }}
        />
      </div>
      <FieldsSelector
        saveLoading={isSaveButtonLoading}
        onSaveButtonClick={handleSaveButtonClick}
        onClearButtonClick={() => setSelectedFields([])}
        onSearchFieldNameSelected={handleSearchFieldNameSelected}
        loading={loadingColumnList}
        columns={columns}
        value={selectedFields}
        groupColumns={groupColumns}
        onChange={setSelectedFields}
        className="mb-6"
        loadingTemplates={isLoadingTemplates}
        templateName={editSelectedTemplateName}
        onTemplateNameChange={setEditSelectedTemplateName}
      />
      <Preview
        onFieldDelete={handleFieldDelete}
        ref={previewRef}
        selectedFields={selectedFieldsList}
      />
      <div className="mt-12 flex justify-end">
        <Button
          disabled={isLoading}
          type="primary"
          loading={isLoading}
          onClick={handleExportButtonClick}
        >
          Export
        </Button>
      </div>
    </div>
  )
}
