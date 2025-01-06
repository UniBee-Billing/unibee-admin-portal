import { Button, Form, Input, InputNumber, message, Modal } from 'antd'
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
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const watchAmount = Form.useWatch('amount', form)

  const showAmtNote = () => {
    const currentAmt =
      promoCreditAccount == undefined ? 0 : promoCreditAccount.amount
    if (watchAmount == 0 || watchAmount == null) {
      return (
        <div className="text-sm text-gray-500">
          Promo credit amount hasn't changed
        </div>
      )
    }
    if (currentAmt + watchAmount < 0) {
      return (
        <div className="text-sm text-red-500">Invalid promo credit amount</div>
      )
    }
    if (watchAmount > 0) {
      return (
        <div className="text-sm text-green-600">
          Promo credit amount will be increased by {watchAmount} to{' '}
          {watchAmount + currentAmt}
        </div>
      )
    } else {
      return (
        <div className="text-sm text-red-600">
          Promo credit amount will be decreased by {watchAmount} to{' '}
          {watchAmount + currentAmt}
        </div>
      )
    }
  }

  const validationCheck = () => {
    const currentAmt =
      promoCreditAccount == undefined ? 0 : promoCreditAccount.amount
    const amt = Number(watchAmount)
    if (watchAmount == null || isNaN(amt) || amt === 0) {
      return false
    }
    if (currentAmt + amt < 0) {
      return false
    }
    return true
  }

  const onSubmit = async () => {
    if (!validationCheck()) {
      return
    }
    const amt = Number(watchAmount)
    setLoading(true)
    const [newPromoAcc, err] = await updateCreditAmtReq({
      action: amt > 0 ? 'increment' : 'decrement',
      userId,
      currency,
      amount: Math.abs(amt),
      description: form.getFieldValue('description')
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
      <Form
        form={form}
        onFinish={onSubmit}
        initialValues={{ amount: null, description: null }}
      >
        <div className="mb-2 mt-4">
          Increase or decrease the inventory of promo credits&nbsp;(current
          amount:
          {promoCreditAccount == undefined ? 0 : promoCreditAccount.amount})
        </div>
        <Form.Item
          name="amount"
          label="Amount"
          noStyle={true}
          rules={[
            {
              required: true,
              message: 'Please input your change amount!'
            }
          ]}
        >
          <InputNumber disabled={loading} />
        </Form.Item>
        <div>{showAmtNote()}</div>

        <div className="mb-2 mt-5">Note</div>
        <Form.Item
          name="description"
          label="Description"
          noStyle={true}
          rules={[
            {
              required: true,
              message: 'Please input your note for this change!'
            }
          ]}
        >
          <Input.TextArea
            style={{ width: '100%' }}
            disabled={loading}
            maxLength={120}
            showCount
          />
        </Form.Item>
        <div className="mt-8 flex items-center justify-end gap-4">
          <Button onClick={closeModal} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={form.submit}
            loading={loading}
            disabled={loading}
          >
            OK
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default Index
