import { DiscountCodeUsageStatus } from '../../shared.types'

export const formatNumberByZeroUnLimutedRule = (
  num: number,
  unlimitedText: string | undefined = 'Unlimited'
) => (num === 0 ? unlimitedText : num)

// When quantity is 0, it means the quantity is unlimited.
export const formatQuantity = (quantity: number) =>
  formatNumberByZeroUnLimutedRule(quantity)

enum RECURRING_STATUS {
  NO,
  YES
}

const FORMATTED_RECURRING_MAP = {
  [RECURRING_STATUS.NO]: 'No',
  [RECURRING_STATUS.YES]: 'Yes'
}

export const formatRecurringStatus = (recurring: RECURRING_STATUS) =>
  FORMATTED_RECURRING_MAP[recurring] ?? 'Unknown'

const FORMATTED_DISCOUNT_CODE_STATUS_MAP = {
  [DiscountCodeUsageStatus.FINISHED]: 'Finished',
  [DiscountCodeUsageStatus.ROLLBACK]: 'Rollback'
}

export const formatDiscountCodeStatus = (status: DiscountCodeUsageStatus) =>
  FORMATTED_DISCOUNT_CODE_STATUS_MAP[status] ?? 'Unknown'
