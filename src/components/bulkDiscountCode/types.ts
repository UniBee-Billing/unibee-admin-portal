import { Dayjs } from 'dayjs'

// API Status codes
export enum TemplateStatus {
  EDITING = 1,
  ACTIVE = 2,
  INACTIVE = 3,
  ARCHIVED = 10
}

// Display status for UI
export enum DiscountRuleStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  EXPIRED = 'Expired',
  EDITING = 'Editing',
  ARCHIVED = 'Archived'
}

export enum ChildCodeStatus {
  ACTIVE = 'Active',
  REDEEMED = 'Redeemed',
  EXPIRED = 'Expired'
}

// Discount types from API
export enum DiscountTypeEnum {
  PERCENTAGE = 1,
  FIXED_AMOUNT = 2
}

// Billing types from API
export enum BillingTypeEnum {
  ONE_TIME = 1,
  RECURRING = 2
}

// Plan apply types from API
export enum PlanApplyTypeEnum {
  ALL = 0,
  SELECTED = 1,
  NOT_SELECTED = 2
}

export interface DiscountRule {
  id: number
  name: string
  code: string // codePrefix
  status: TemplateStatus
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
}

export interface ChildCode {
  id: number
  code: string
  status: number
  isRedeemed: boolean
  redeemedByEmail?: string
  redeemedAt?: number
  invoiceId?: string
  subscriptionId?: string
  paymentId?: string
  planName?: string
  createTime: number
}

export interface BulkGenerateFormData {
  quantity: number
  codeLength: number
}

export interface EditDiscountRuleFormData {
  name: string
  codePrefix: string
  quantity: number
  discountType: number
  discountAmount?: number
  discountPercentage?: number
  currency?: string
  billingType: number
  cycleLimit?: number
  validityRange: [Dayjs | null, Dayjs | null]
  planApplyType: number
  planIds?: number[]
  userLimit?: number
  userScope?: number
}

export interface ChildCodeFilters {
  createdDateStart?: string
  createdDateEnd?: string
}

export interface UsageRecordsFilters {
  createTimeStart?: string
  createTimeEnd?: string
  status?: number[]
  planIds?: number[]
}

export interface BulkDiscountStats {
  activeRules: number
  totalCodes: number
  redemptions: number
  redemptionRate: number
}

// Helper to convert API status to display status
export const getDisplayStatus = (status: TemplateStatus, endTime: number): DiscountRuleStatus => {
  const now = Math.floor(Date.now() / 1000)
  if (status === TemplateStatus.ARCHIVED) return DiscountRuleStatus.ARCHIVED
  if (status === TemplateStatus.EDITING) return DiscountRuleStatus.EDITING
  if (status === TemplateStatus.INACTIVE) return DiscountRuleStatus.INACTIVE
  if (endTime < now) return DiscountRuleStatus.EXPIRED
  return DiscountRuleStatus.ACTIVE
}

// Helper to format discount display
export const formatDiscount = (
  discountType: number,
  discountAmount: number,
  discountPercentage: number,
  currency: string
): string => {
  if (discountType === DiscountTypeEnum.PERCENTAGE) {
    return `${discountPercentage / 100}% off`
  }
  return `${currency} ${(discountAmount / 100).toFixed(2)} off`
}
