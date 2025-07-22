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
  plan?: any // Added to match the new API structure
}

export interface LicenseInfo {
  license: string
  ownerEmail: string
  version: VersionData
  isPaid?: boolean // Added to match the new API structure
  plan?: any // Added to match the new API structure
  subscription?: any // Added to match the new API structure
}

export interface MerchantLicenseData {
  merchant: {
    id: number
    userId: number
    email: string
    name: string
    // other merchant fields
  }
  license: LicenseInfo
  APIRateLimit: number
  memberLimit: number
  currentMemberCount: number
}

export const useLicense = () => {
  const response = useAxiosFetch<Response<MerchantLicenseData>>(
    '/merchant/get_license',
    request
  )

  return useMemo(() => {
    const licenseData = response.data?.data?.license
    const version = licenseData?.version

    return {
      license: licenseData?.license,
      isActivePremium: (licenseData?.isPaid || version?.isPaid) && !version?.expired,
      isExpiredPremium: (licenseData?.isPaid || version?.isPaid) && !!version?.expired,
      ownerEmail: licenseData?.ownerEmail,
      licenseName: version?.name ?? 'Loading...',
      apiRateLimit: response.data?.data?.APIRateLimit,
      memberLimit: response.data?.data?.memberLimit,
      currentMemberCount: response.data?.data?.currentMemberCount,
      ...response
    }
  }, [response])
}
