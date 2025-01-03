import {
  Button,
  Input,
  InputNumber,
  InputNumberProps,
  message,
  Modal
} from 'antd'
import { useState } from 'react'
import { updateCreditAmtReq } from '../../requests'
import { TPromoAccount } from '../../shared.types'

const Index = ({
  promoCreditAccount,
  userId,
  currency,
  refreshUser,
  closeModal,
  updatePromoAccount,
  refreshTxList
}: {
  promoCreditAccount?: TPromoAccount
  userId: number
  currency: string
  refreshUser: () => void
  closeModal: () => void
  updatePromoAccount: (a: TPromoAccount) => void
  refreshTxList: (v: boolean) => void
}) => {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState<null | number>(null)
  const [description, setDescription] = useState('')

  const onAmtChange: InputNumberProps['onChange'] = (amt) => {
    setAmount(amt as number)
  }

  const showAmtNote = () => {
    const currentAmt =
      promoCreditAccount == undefined ? 0 : promoCreditAccount.amount
    if (amount == 0 || amount == null) {
      return (
        <div className="text-sm text-gray-500">
          Promo credit amount hasn't changed
        </div>
      )
    }
    if (currentAmt + amount < 0) {
      return (
        <div className="text-sm text-red-500">Invalid promo credit amount</div>
      )
    }
    if (amount > 0) {
      return (
        <div className="text-sm text-green-600">
          Promo credit amount will be increased by {amount} to{' '}
          {amount + currentAmt}
        </div>
      )
    } else {
      return (
        <div className="text-sm text-orange-600">
          Promo credit amount will be decreased by {amount} to{' '}
          {amount + currentAmt}
        </div>
      )
    }
  }

  const validationCheck = () => {
    const currentAmt =
      promoCreditAccount == undefined ? 0 : promoCreditAccount.amount
    const amt = Number(amount)
    if (amount == null || isNaN(amt) || amt === 0) {
      return false
    }
    if (currentAmt + amount < 0) {
      return false
    }
    if (description.trim() == '') {
      return false
    }
    return true
  }

  const onOK = async () => {
    if (!validationCheck()) {
      return
    }
    const amt = Number(amount)
    if (isNaN(amt)) {
      return
    }
    setLoading(true)
    const [newPromoAcc, err] = await updateCreditAmtReq({
      action: amt > 0 ? 'increment' : 'decrement',
      userId,
      currency,
      amount: Math.abs(amt),
      description
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Credit amount updated.')
    newPromoAcc.payoutEnable = newPromoAcc.payoutEnable == 1 ? true : false
    newPromoAcc.rechargeEnable = newPromoAcc.rechargeEnable == 1 ? true : false
    updatePromoAccount(newPromoAcc)
    refreshTxList(true)
    closeModal()
    refreshUser()
  }

  return (
    <Modal
      title="Update promo credits quantity"
      open={true}
      width={'640px'}
      footer={null}
      closeIcon={null}
    >
      <div className="mb-2 mt-4">
        Increase or decrease the inventory of promo credits
      </div>
      <InputNumber
        value={amount}
        onChange={onAmtChange}
        disabled={loading}
        status={amount == 0 || amount == null ? 'error' : ''}
      />
      <div>{showAmtNote()}</div>

      <div className="mb-2 mt-5">Note</div>
      <Input.TextArea
        disabled={loading}
        status={description == '' ? 'error' : ''}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div
        className="flex items-center justify-end gap-4"
        style={{
          marginTop: '24px'
        }}
      >
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onOK}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default Index
