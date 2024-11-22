import { Select } from 'antd'
import { useMemo } from 'react'
import {
  convertPascalCaseToSentence,
  ignoreCaseLabelFilter
} from '../../../utils'

interface FieldsSearchInputProps {
  columns: string[]
  loadingColumns: boolean
  onChange: (value: string) => void
}

export const FieldsSearchInput = ({
  columns,
  loadingColumns,
  onChange
}: FieldsSearchInputProps) => {
  const options = useMemo(
    () =>
      (columns ?? []).map((col) => ({
        value: col,
        label: convertPascalCaseToSentence(col)
      })),
    [columns]
  )

  return (
    <Select
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
