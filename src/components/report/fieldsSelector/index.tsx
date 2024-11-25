import { PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Cascader, Input } from 'antd'
import { CascaderRef } from 'antd/es/cascader'
import { useMemo, useRef, useState } from 'react'
import { WithStyle } from '../../../shared.types'
import { safeConvertPascalCaseToSentence } from '../../../utils'
import { FieldsSearchInput } from './fieldsSearchInput'

interface FieldsSelectorProps {
  searchContent: string
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
  saveLoading,
  searchContent
}: WithStyle<FieldsSelectorProps>) => {
  const [isOpenCascader, setIsOpenCascader] = useState(false)
  const cascaderRef = useRef<CascaderRef | null>(null)

  const categories = useMemo(
    () => Object.keys(groupColumns ?? []),
    [groupColumns]
  )

  const options = useMemo(
    () =>
      categories.map((category) => ({
        ...mapOptionWithSameValue(category),
        children: groupColumns[category].map((value) => ({
          label: safeConvertPascalCaseToSentence(value),
          value
        }))
      })),
    [categories, groupColumns]
  )

  const handleAddMatrixButtonClick = () => {
    setIsOpenCascader(true)
    cascaderRef.current!.focus()
  }

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
            searchContent={searchContent}
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
        <div className="flex w-[60%]">
          <Button
            color="default"
            variant="filled"
            icon={<PlusOutlined />}
            onClick={handleAddMatrixButtonClick}
          >
            Add Matrix
          </Button>
          <Cascader
            ref={cascaderRef}
            open={isOpenCascader}
            value={value}
            onFocus={() => setIsOpenCascader(true)}
            onBlur={() => setIsOpenCascader(false)}
            className="ml-3 grow"
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
