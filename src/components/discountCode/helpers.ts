import { message } from 'antd'
import { DiscountCodeUsageStatus } from '../../shared.types'
import { useAppConfigStore } from '../../stores'

export const formatNumberByZeroUnLimitedRule = (
  num: number,
  unlimitedText: string | undefined = 'Unlimited'
) => (num === 0 ? unlimitedText : num)

// When quantity is 0, it means the quantity is unlimited.
export const formatQuantity = (quantity: number) =>
  formatNumberByZeroUnLimitedRule(quantity)

enum RECURRING_STATUS {
  NO,
  YES
}

export enum DISCOUNT_CODE_UPGRADE_SCOPE {
  ALL,
  UPGRADE_ONLY,
  LONGER_ONLY
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

export const useWithExportAction = () => {
  const appConfigStore = useAppConfigStore()

  return <T extends unknown[]>(exportAction: () => Promise<T>) =>
    async () => {
      const [_, err] = await exportAction()

      if (err) {
        message.error('Failed to export, Please try again later.')
        return
      }

      message.success(
        'Report is being exported, please check task list for progress.'
      )
      appConfigStore.setTaskListOpen(true)
    }
}
