import { request } from './client'

export interface SystemInformation {
  serverVersion: string
  buildTime: string
  [key: string]: unknown
}

export interface SystemInformationResponse {
  code: number
  message: string
  data: SystemInformation
  redirect?: string
  requestId?: string
}

/**
 * Get system information
 */
export const getSystemInformationReq = async (): Promise<
  [SystemInformation | null, Error | null]
> => {
  try {
    const res = await request.get<SystemInformationResponse>(
      '/system/information/get'
    )

    if (res.data.code !== 0) {
      return [null, new Error(res.data.message || 'API error')]
    }

    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

