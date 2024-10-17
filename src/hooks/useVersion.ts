import { useMemo } from 'react'
import { request, Response } from '../requests/client'
import { useAxiosFetch } from './useFetch'

export const useVersion = () => useAxiosFetch<string>('/version', request)

export interface VersionData {
  startTime: number
  endTime: number
  expired: boolean
  isPaid: boolean
  name: string
}

export interface LicenseData {
  license: string
  ownerEmail: string
  version: VersionData
}

export const useLicense = () => {
  const response = useAxiosFetch<Response<LicenseData>>(
    '/license-api/merchant/license/get',
    request
  )

  return useMemo(() => {
    const { license, version, ownerEmail } = response.data?.data ?? {}

    return {
      license: license,
      isActivePremium: version?.isPaid && !version?.expired,
      isExpiredPremium: version?.isPaid && !!version?.expired,
      ownerEmail: ownerEmail,
      licenseName: version?.name ?? 'Loading...',
      ...response
    }
  }, [response])
}
