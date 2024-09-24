import { Button, Form, Input, Modal, Select, message } from 'antd'
import { useEffect, useState } from 'react'
import { TGateway } from '../../../@types/shared.types'
import { CURRENCY } from '../../../constants'
import { currencyDecimalValidate } from '../../../helpers'
import {
  createWireTransferAccountReq,
  updateWireTransferAccountReq
} from '../../../requests'

const NEW_WIRE_TRANSFER_ACC: TGateway = {
  // gatewayId?: number
  // gatewayKey?: string
  gatewayName: 'wire_transfer',
  webhookEndpointUrl: '',
  webhookSecret: '',
  // gatewayLogo: string
  // gatewayType?: number
  // createTime?: number
  minimumAmount: 0,
  currency: 'EUR',
  bank: {
    accountHolder: '',
    bic: '',
    iban: '',
    address: ''
  }
}

interface IProps {
  closeModal: () => void
  detail: TGateway | undefined
  refresh: () => void
}
const Index = ({ closeModal, detail, refresh }: IProps) => {
  const isNew = detail == null
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState('EUR')
  const gateway: TGateway = isNew ? NEW_WIRE_TRANSFER_ACC : detail
  const onCurrencyChange = (value: string) => setCurrency(value)

  const selectAfter = (
    <Select
      value={currency}
      onChange={onCurrencyChange}
      disabled={true}
      style={{ width: 120 }}
      options={[
        { value: 'EUR', label: 'EUR' },
        { value: 'USD', label: 'USD', disabled: true },
        { value: 'JPY', label: 'JPY', disabled: true }
      ]}
    />
  )
  /*
      f.trialAmount = Number(f.trialAmount)
      f.trialAmount *= CURRENCY[f.currency].stripe_factor
      f.trialAmount = toFixedNumber(f.trialAmount, 2)
*/
  const onSave = async () => {
    const accInfo = JSON.parse(JSON.stringify(form.getFieldsValue()))
    accInfo.currency = currency
    accInfo.minimumAmount = Number(accInfo.minimumAmount)
    accInfo.minimumAmount *= CURRENCY[currency].stripe_factor

    // return
    setLoading(true)
    const method = isNew
      ? createWireTransferAccountReq
      : updateWireTransferAccountReq
    const [res, err] = await method(accInfo)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`Wire Transfer account saved.`)
    refresh()
    closeModal()
  }

  useEffect(() => {}, [])

  return (
    <>
      <Modal
        title={`Wire Transfer setup`}
        width={'720px'}
        open={true}
        footer={null}
        closeIcon={null}
      >
        <Form
          form={form}
          onFinish={onSave}
          // labelCol={{ span: 4 }}
          labelCol={{ flex: '160px' }}
          // wrapperCol={{ span: 20 }}
          wrapperCol={{ flex: 1 }}
          colon={false}
          // layout="horizontal"
          // disabled={componentDisabled}
          style={{ marginTop: '28px' }}
          initialValues={gateway}
        >
          {!isNew && (
            <Form.Item label="Account Holder" name={'gatewayId'} hidden>
              <Input />
            </Form.Item>
          )}
          <Form.Item
            label="Minimum Amount"
            name="minimumAmount"
            rules={[
              {
                required: true,
                message: 'Please input the minimum amount!'
              },
              () => ({
                validator(value) {
                  const num = Number(value)
                  if (isNaN(num) || num <= 0) {
                    return Promise.reject(`Please input a valid price (> 0).`)
                  }
                  if (!currencyDecimalValidate(num, currency)) {
                    return Promise.reject('Please input a valid amount')
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input
              addonAfter={selectAfter}
              prefix={CURRENCY[currency].symbol}
            />
          </Form.Item>
          <Form.Item
            label="Account Holder"
            name={['bank', 'accountHolder']}
            rules={[
              {
                required: true,
                message: 'Please input the account holder!'
              }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="BIC"
            name={['bank', 'bic']}
            rules={[
              {
                required: true,
                message: 'Please input the BIC!'
              }
            ]}
          >
            <Input placeholder="8 or 11 characters long" />
          </Form.Item>

          <Form.Item
            label="IBAN"
            name={['bank', 'iban']}
            rules={[
              {
                required: true,
                message: 'Please input the IBAN'
              }
            ]}
          >
            <Input placeholder="34 characters long" />
          </Form.Item>
          <Form.Item
            label="Address"
            name={['bank', 'address']}
            rules={[
              {
                required: true,
                message: 'Please input the address!'
              }
            ]}
          >
            <Input />
          </Form.Item>
        </Form>

        <div className="flex justify-end gap-4">
          <Button onClick={closeModal} disabled={loading}>
            Close
          </Button>
          <Button
            type="primary"
            onClick={form.submit}
            disabled={loading}
            loading={loading}
          >
            Save
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default Index
