import { Select, SelectProps } from 'antd'
import { getSystemTimezone, getTimezoneList } from '../utils'
import { ignoreCaseLabelFilter } from '../utils/filters'

interface TimezoneSelectorProps extends SelectProps {
  onTimezoneChange?: (timezone: string) => void
}

export const TimezoneSelector = ({
  onTimezoneChange,
  ...selectProps
}: TimezoneSelectorProps) => {
  const options = getTimezoneList().map((timezone) => ({
    label: timezone,
    value: timezone
  }))

  return (
    <Select
      showSearch
      defaultValue={getSystemTimezone()}
      filterOption={ignoreCaseLabelFilter}
      placeholder="Select a timezone"
      onChange={onTimezoneChange}
      options={options}
      {...selectProps}
    />
  )
}
