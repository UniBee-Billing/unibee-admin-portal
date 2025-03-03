import { IPlan } from '@/shared.types'

export const TIME_UNITS = [
  // in seconds
  { label: 'hours', value: 60 * 60 },
  { label: 'days', value: 60 * 60 * 24 },
  { label: 'weeks', value: 60 * 60 * 24 * 7 },
  { label: 'months(30days)', value: 60 * 60 * 24 * 30 }
]

export type TrialSummary = {
  trialEnabled: boolean
  price: string | undefined
  durationTime: string | undefined
  requireBankInfo: boolean | undefined
  AutoRenew: boolean | undefined
}

export type TNewPlan = Omit<
  IPlan,
  | 'id'
  | 'amount'
  | 'createTime'
  | 'companyId'
  | 'merchantId'
  | 'productId'
  | 'product'
> // might need to omit more, like trial related fields.
