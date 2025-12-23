import { request } from './client'

// Types
export interface BatchDiscountTemplate {
  id: number
  merchantId: number
  name: string
  code: string
  codePrefix: string
  //1-edit 2-active 3 stop 10 archive
  status: number
  quantity: number
  childCodeCount: number
  usedChildCodeCount: number
  billingType: number
  discountType: number
  discountAmount: number
  discountPercentage: number
  currency: string
  cycleLimit: number
  startTime: number
  endTime: number
  planApplyType: number
  planIds?: number[]
  userLimit: number
  userScope: number
  createTime: number
  type: number // 2 = template
}

export interface BatchDiscountChild {
  id: number
  merchantId: number
  name: string
  code: string
  status: number
  billingType: number
  discountType: number
  discountAmount: number
  discountPercentage: number
  currency: string
  cycleLimit: number
  startTime: number
  endTime: number
  createTime: number
  planApplyType: number
  planIds?: number[]
  quantity: number
  isDeleted: number
  advance: boolean
  userLimit: number
  userScope: number
  upgradeOnly: boolean
  upgradeLongerOnly: boolean
  codePrefix: string
  type: number
  parentTemplateCode: string
  isRedeemed: boolean
  redeemedByEmail?: string
  redeemedAt?: number
  invoiceId?: string
  subscriptionId?: string
  paymentId?: string
}

export interface BatchTemplateListParams {
  page?: number
  count?: number
  discountType?: number[]
  billingType?: number[]
  status?: number[]
  codePrefix?: string
  searchKey?: string
  currency?: string
  sortField?: string // gmt_create | gmt_modify
  sortType?: string // asc | desc
  createTimeStart?: number
  createTimeEnd?: number
}

export interface BatchTemplateListResponse {
  list: BatchDiscountTemplate[]
  total: number
  activeTemplateCount: number
  totalChildCodeCount: number
  usedChildCodeCount: number
  usageRate: number
}

export interface CreateBatchTemplateParams {
  name: string
  codePrefix: string
  quantity: number
  billingType: number
  discountType: number
  discountAmount?: number
  discountPercentage?: number
  currency?: string
  cycleLimit?: number
  startTime: number
  endTime: number
  planApplyType?: number
  planIds?: number[]
  userLimit?: number
  userScope?: number
}

export interface EditBatchTemplateParams extends CreateBatchTemplateParams {
  id: number
}

export interface BatchChildrenListParams {
  templateId: number
  page?: number
  count?: number
  code?: string
  sortField?: string // gmt_create | gmt_modify
  sortType?: string // asc | desc
  createTimeStart?: number
  createTimeEnd?: number
}

export interface BatchChildrenListResponse {
  list: BatchDiscountChild[]
  total: number
}

// Get batch template list
export const getBatchTemplateListReq = async (
  params: BatchTemplateListParams
): Promise<[BatchTemplateListResponse | null, Error | null]> => {
  try {
    const res = await request.get('/merchant/discount/batch/template/list', {
      params
    })
    const data = res.data.data
    return [{ 
      list: data.templates || [], 
      total: data.total || 0,
      activeTemplateCount: data.activeTemplateCount || 0,
      totalChildCodeCount: data.totalChildCodeCount || 0,
      usedChildCodeCount: data.usedChildCodeCount || 0,
      usageRate: data.usageRate || 0
    }, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Get batch template detail
export const getBatchTemplateDetailReq = async (
  id: number
): Promise<[BatchDiscountTemplate | null, Error | null]> => {
  try {
    const res = await request.post('/merchant/discount/batch/template/detail', { id })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Create batch template
export const createBatchTemplateReq = async (
  params: CreateBatchTemplateParams
): Promise<[BatchDiscountTemplate | null, Error | null]> => {
  try {
    const res = await request.post('/merchant/discount/batch/template/new', params)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Edit batch template
export const editBatchTemplateReq = async (
  params: EditBatchTemplateParams
): Promise<[BatchDiscountTemplate | null, Error | null]> => {
  try {
    const res = await request.post('/merchant/discount/batch/template/edit', params)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Activate batch template (reuse existing discount API)
export const activateBatchTemplateReq = async (
  id: number
): Promise<[unknown, Error | null]> => {
  try {
    const res = await request.post('/merchant/discount/activate', { id })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Deactivate batch template (reuse existing discount API)
export const deactivateBatchTemplateReq = async (
  id: number
): Promise<[unknown, Error | null]> => {
  try {
    const res = await request.post('/merchant/discount/deactivate', { id })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Generate batch children codes
export const generateBatchChildrenReq = async (
  templateCode: string,
  quantity?: number,
  codeLength?: number
): Promise<[{ generatedCount: number; successCount: number } | null, Error | null]> => {
  try {
    const res = await request.post('/merchant/discount/batch/children/generate', {
      templateCode,
      quantity,
      codeLength
    })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Get batch children list
export const getBatchChildrenListReq = async (
  params: BatchChildrenListParams
): Promise<[BatchChildrenListResponse | null, Error | null]> => {
  try {
    const res = await request.get('/merchant/discount/batch/children/list', { params })
    const data = res.data.data
    return [{ list: data.children || [], total: data.total || 0 }, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Archive batch template (reuse existing discount API)
export const archiveBatchTemplateReq = async (
  id: number
): Promise<[unknown, Error | null]> => {
  try {
    const res = await request.post('/merchant/discount/delete', { id })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Increment batch template quantity (for expansion)
export const incrementBatchQuantityReq = async (
  id: number,
  amount: number
): Promise<[unknown, Error | null]> => {
  try {
    const res = await request.post('/merchant/discount/batch/template/quantity_increment', {
      id,
      amount
    })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Import batch children codes via Task API
export const importBatchChildrenReq = async (
  file: File
): Promise<[{ taskId: number } | null, Error | null]> => {
  try {
    const res = await request.post(
      '/merchant/task/new_import',
      { file, task: 'BatchDiscountChildrenImport' },
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// Export batch children codes via Task API
export const exportBatchChildrenReq = async (
  templateId: number,
  format: 'xlsx' | 'csv' = 'xlsx'
): Promise<[{ taskId: number } | null, Error | null]> => {
  try {
    const res = await request.post('/merchant/task/new_export', {
      task: 'BatchDiscountChildrenExport',
      payload: { templateId },
      format
    })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}


