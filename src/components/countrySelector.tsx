import { Select, SelectProps } from 'antd'
import { useMemo } from 'react'
import { Country, useCountries } from '../hooks'
import { ignoreCaseLabelFilter } from '../utils/filters'

interface CountrySelectorProps extends SelectProps {
  onCountryChange?: (country: Country) => void
}

export const CountrySelector = ({
  onCountryChange,
  ...selectProps
}: CountrySelectorProps) => {
  const { countries, loading } = useCountries()
  const options = useMemo(
    () =>
      countries.map((countryData) => ({
        value: countryData.countryCode,
        label: countryData.countryName
      })),
    [countries]
  )

  const handleCountryChange = (countryCode: string) => {
    const countryData = countries.find((c) => c.countryCode === countryCode)

    onCountryChange?.(countryData!)
  }

  return (
    <Select
      loading={loading}
      showSearch
      filterOption={ignoreCaseLabelFilter}
      placeholder="Select a country"
      onChange={handleCountryChange}
      options={options}
      {...selectProps}
    />
  )
}
