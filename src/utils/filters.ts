import { SelectProps } from 'antd'

export const ignoreCaseLabelFilter: SelectProps['filterOption'] = (
  input,
  option
) =>
  ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
