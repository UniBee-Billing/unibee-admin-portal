import { PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Cascader, Input } from 'antd'
import { useMemo, useState } from 'react'
import { WithStyle } from '../../../shared.types'
import { FieldsSearchInput } from './fieldsSearchInput'

interface FieldsSelectorProps {
  value: string[][]
  saveLoading?: boolean
  templateName?: string
  columns: string[]
  loadingTemplates: boolean
  groupColumns: Record<string, string[]>
  loading: boolean
  onClearButtonClick: () => void
  onSaveButtonClick: () => void
  onChange: (value: string[][]) => void
  onTemplateNameChange: (templateName: string) => void
  onSearchFieldNameSelected: (value: string) => void
}

const mapOptionWithSameValue = (value: string) => ({ label: value, value })

const mapOptionsWithSameValue = (values: string[]) =>
  values.map(mapOptionWithSameValue)

export const FieldsSelector = ({
  templateName,
  onTemplateNameChange,
  className,
  value,
  onChange,
  loading,
  columns,
  groupColumns,
  onSearchFieldNameSelected,
  onClearButtonClick,
  onSaveButtonClick,
  saveLoading
}: WithStyle<FieldsSelectorProps>) => {
  const [isOpenCascader, setIsOpenCascader] = useState(false)

  const categories = useMemo(
    () => Object.keys(groupColumns ?? []),
    [groupColumns]
  )

  const options = useMemo(
    () =>
      categories.map((category) => ({
        ...mapOptionWithSameValue(category),
        children: mapOptionsWithSameValue(groupColumns[category])
      })),
    [categories]
  )

  return (
    <div className={`rounded-xl bg-[#f5f5f5] p-5 ${className}`}>
      <div className="flex justify-between">
        <div className="flex">
          <Input
            className="mr-3 w-[270px]"
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
          />
          <FieldsSearchInput
            onChange={onSearchFieldNameSelected}
            loadingColumns={loading}
            columns={columns}
          />
        </div>
        <Button
          icon={<SaveOutlined />}
          onClick={onSaveButtonClick}
          loading={saveLoading}
          disabled={saveLoading}
        >
          Save
        </Button>
      </div>
      <div className="mt-4 flex justify-between">
        <div>
          <Button
            color="default"
            variant="filled"
            icon={<PlusOutlined />}
            onClick={() => setIsOpenCascader(true)}
          >
            Add Matrix
          </Button>
          <Cascader
            open={isOpenCascader}
            value={value}
            onFocus={() => setIsOpenCascader(true)}
            onBlur={() => setIsOpenCascader(false)}
            className="ml-3 w-[320px]"
            options={options}
            multiple
            showCheckedStrategy={Cascader.SHOW_CHILD}
            onChange={onChange}
            maxTagCount="responsive"
          />
        </div>
        <Button color="primary" variant="text" onClick={onClearButtonClick}>
          Clear Filters
        </Button>
      </div>
    </div>
  )
}
