import { PlusOutlined } from '@ant-design/icons'
import { Button, Cascader } from 'antd'
import { CascaderRef } from 'antd/es/cascader'
import { useMemo, useRef, useState } from 'react'
import { WithStyle } from '../../../shared.types'
import { safeConvertPascalCaseToSentence } from '../../../utils'
import { FieldItem } from '../preview/fieldItem'

interface FieldsSelectorProps {
  value: string[][]
  groupColumns: Record<string, string[]>
  selectedFields: string[]
  onChange: (value: string[][]) => void
  onFieldDelete: (field: string) => void
  onClearButtonClick: () => void
}

export const FieldsSelector = ({
  className,
  value,
  onChange,
  groupColumns,
  selectedFields,
  onFieldDelete,
  onClearButtonClick
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
        label: safeConvertPascalCaseToSentence(category),
        value: category,
        children: groupColumns[category].map((value) => ({
          label: safeConvertPascalCaseToSentence(value),
          value
        }))
      })),
    [categories, groupColumns]
  )

  const handleAddCategoryClick = () => {
    setIsOpenCascader(true)
    cascaderRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-medium">Export header categories</h3>
        <Button type="link" onClick={onClearButtonClick} className="text-blue-500 hover:text-blue-600">
          clear all
        </Button>
      </div>
      <div className="w-full ring-1 ring-[#D7D5D6] bg-white rounded-lg p-4 min-h-[110px] flex flex-wrap gap-2 items-start">
        {selectedFields.map((field) => (
          <FieldItem
            key={field}
            value={field}
            onDeleteButtonClick={onFieldDelete}
            isDeletable
          />
        ))}
        <div className="relative">
          <Button
            className="bg-blue-50 border-blue-400 rounded-md flex items-center text-sm px-3 py-1 text-blue-600 hover:bg-blue-100"
            onClick={handleAddCategoryClick}
            icon={<PlusOutlined />}
          >
            Add Category
          </Button>
          <Cascader
            ref={cascaderRef}
            open={isOpenCascader}
            value={value}
            onFocus={() => setIsOpenCascader(true)}
            onBlur={() => setIsOpenCascader(false)}
            className="absolute opacity-0 pointer-events-none"
            options={options}
            multiple
            showCheckedStrategy={Cascader.SHOW_CHILD}
            onChange={onChange}
            maxTagCount="responsive"
          />
        </div>
      </div>
    </div>
  )
}
