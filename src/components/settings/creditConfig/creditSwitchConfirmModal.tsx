import { Button, Modal } from 'antd'
// import { useState } from 'react'
import { TCreditConfig, TPromoAccount } from '../../../shared.types'

// used in 2 places:
// 1: config -> credit config (global setting), TCreditConfig as props
// 2: user list -> user detail -> promo credit tab (setting for specific user), TPromoAccount as props
const CreditSwitchConfirmModal = ({
  items,
  title,
  content,
  onSave,
  onCancel
}: {
  items: TCreditConfig | TPromoAccount
  title: string
  content: string
  onSave: () => void
  onCancel: () => void
}) => {
  const NoButton = () => (
    <Button
      onClick={onCancel}
      // disabled={loading}
      type={(items.payoutEnable as boolean) ? 'primary' : 'default'}
    >
      No
    </Button>
  )
  const YesButton = () => (
    <Button
      type={(items.payoutEnable as boolean) ? 'default' : 'primary'}
      onClick={onSave}
      // disabled={loading}
      // loading={loading}
    >
      Yes
    </Button>
  )

  /*
  const normalizeCreditConfig = (c: TCreditConfig): TCreditConfig => {
    if (typeof c.payoutEnable == 'number') {
      // when this field type is number, data is from BE directly
      // some fields from backend are 1 | 0 (bool like), I need to convert them to bool for FE use
      // but before submit, I need to convert them back to 0 | 1
      // exchange rate also need to be divided by 100 for FE use, before submit to BE, need to be multiplied by 100
      ;(c.exchangeRate as number) /= 100
      // discountCodeExclusive is used to denote "Allow both Promo Credit and Discount Code in one invoice?"
      // its meaning is totally opposite of what it means on UI, so flip its value.
      c.discountCodeExclusive = c.discountCodeExclusive == 1 ? 0 : 1
    } else {
      // data is from FE
      ;(c.exchangeRate as number) *= 100
      c.discountCodeExclusive = c.discountCodeExclusive ? false : true
    }
    c.payoutEnable = numBoolConvert(c.payoutEnable)
    c.discountCodeExclusive = numBoolConvert(c.discountCodeExclusive)
    c.recurring = numBoolConvert(c.recurring)
    return c
  }
    */

  return (
    <Modal
      title={title}
      width={'600px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div>{content}</div>

      <div className="mt-6 flex justify-end gap-4">
        {(items.payoutEnable as boolean) ? (
          <>
            {' '}
            <YesButton /> <NoButton />{' '}
          </>
        ) : (
          <>
            {' '}
            <NoButton /> <YesButton />{' '}
          </>
        )}
      </div>
    </Modal>
  )
}

export default CreditSwitchConfirmModal
