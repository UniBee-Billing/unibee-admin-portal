import { Select } from 'antd'
import { useMemo } from 'react'
import {
  ignoreCaseLabelFilter,
  safeConvertPascalCaseToSentence
} from '../../../utils'

interface FieldsSearchInputProps {
  searchContent: string
  columns: string[]
  loadingColumns: boolean
  onChange: (value: string) => void
}

export const FieldsSearchInput = ({
  columns,
  loadingColumns,
  onChange,
  searchContent
}: FieldsSearchInputProps) => {
  const options = useMemo(
    () =>
      (columns ?? []).map((col) => ({
        value: col,
        label: safeConvertPascalCaseToSentence(col)
      })),
    [columns]
  )

  return (
    <Select
      value={searchContent}
      showSearch
      className="w-[270px]"
      onChange={onChange}
      placeholder="Search matrix"
      filterOption={ignoreCaseLabelFilter}
      options={options}
      loading={loadingColumns}
    />
  )
}
