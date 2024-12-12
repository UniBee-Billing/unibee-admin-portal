import { useMemo } from 'react'
import type { Response } from '../requests/client'
import { request } from '../requests/client'
import { useMerchantInfoStore } from '../stores'
import { useAxiosFetch } from './useFetch'

export interface Country {
  countryCode: string
  countryName: string
  id: number
  isEU: number
  standardTaxPercentage: number
  vatSupport: boolean
}

export interface CountryData {
  vatCountryList: Country[]
}

export const useCountries = () => {
  const merchantStore = useMerchantInfoStore.getState()
  const { data, ...restStates } = useAxiosFetch<Response<CountryData>>(
    '/merchant/vat/country_list',
    (url) =>
      request.post(url, {
        merchantId: merchantStore.id
      })
  )
  const countries = useMemo(() => data?.data?.vatCountryList ?? [], [data])

  return { countries, ...restStates }
}
