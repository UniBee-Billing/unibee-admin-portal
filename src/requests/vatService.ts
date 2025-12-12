import { request } from './client'

// VAT Number Validation History Types
export interface VATNumberValidateHistory {
  id: number
  merchantId: number
  vatNumber: string
  status: number // 0-Invalid, 1-Valid
  validateGateway: string
  countryCode: string
  companyName: string
  companyAddress: string
  validateMessage: string
  createTime: number
  manualValidate: boolean
}

export interface VATNumberValidateHistoryListData {
  numberValidateHistoryList: VATNumberValidateHistory[]
  total: number
}

export interface VATNumberValidateHistoryResponse {
  code: number
  message: string
  data: VATNumberValidateHistoryListData
  redirect?: string
  requestId?: string
}

// Request params for VAT validation history list
export interface VATValidationHistoryParams {
  searchKey?: string // Search Key, vatNumber, validateGateway, company, company address, message
  vatNumber?: string // Filter Vat Number
  countryCode?: string // CountryCode
  validateGateway?: string // Filter Validate Gateway, vatsense
  status?: number[] // status, 0-Invalid, 1-Valid
  sortField?: string // Sort Field, gmt_create|gmt_modify, Default gmt_modify
  sortType?: string // Sort Type, asc|desc, Default desc
  page?: number // Page, Start 0
  count?: number // Count Of Per Page
  createTimeStart?: number // CreateTimeStart, UTC timestamp, seconds
  createTimeEnd?: number // CreateTimeEnd, UTC timestamp, seconds
}

/**
 * Get VAT number validation history list
 * Reference: https://api.unibee.top/swagger#tag/Vat-Gateway/paths/~1merchant~1vat~1vat_number_validate_history/post
 */
export const getVATValidationHistoryReq = async (
  params: VATValidationHistoryParams
): Promise<[VATNumberValidateHistoryListData | null, Error | null]> => {
  try {
    const res = await request.post<VATNumberValidateHistoryResponse>(
      '/merchant/vat/vat_number_validate_history',
      params
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

// Request params for VAT validation correction
export interface VATValidationCorrectParams {
  historyId: number
  countryCode: string
  companyName: string
  companyAddress: string
}

// Response type for VAT validation correction
export interface VATValidationCorrectResponse {
  code: number
  message: string
  data: Record<string, unknown>
  redirect?: string
  requestId?: string
}

/**
 * Activate VAT number validation (manual override to mark as valid)
 * Reference: https://api.unibee.top/swagger#tag/Vat-Gateway/paths/~1merchant~1vat~1vat_number_validate_history_activate/post
 */
export const correctVATValidationReq = async (
  params: VATValidationCorrectParams
): Promise<[Record<string, unknown> | null, Error | null]> => {
  try {
    const res = await request.post<VATValidationCorrectResponse>(
      '/merchant/vat/vat_number_validate_history_activate',
      params
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

// Request params for VAT validation deactivation
export interface VATValidationDeactivateParams {
  historyId: number
}

/**
 * Deactivate VAT number validation (mark as invalid)
 * Reference: https://api.unibee.top/swagger#tag/Vat-Gateway/paths/~1merchant~1vat~1vat_number_validate_history_deactivate/post
 */
export const deactivateVATValidationReq = async (
  params: VATValidationDeactivateParams
): Promise<[Record<string, unknown> | null, Error | null]> => {
  try {
    const res = await request.post<VATValidationCorrectResponse>(
      '/merchant/vat/vat_number_validate_history_deactivate',
      params
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

