import { Button, Form, Input, Modal, Select, message } from 'antd'
import { useState } from 'react'
import { CURRENCY } from '../../../constants'
import { currencyDecimalValidate } from '../../../helpers'
import {
  createWireTransferAccountReq,
  updateWireTransferAccountReq
} from '../../../requests'
import { TGateway } from '../../../shared.types'
import { useAppConfigStore } from '../../../stores'

export const NEW_WIRE_TRANSFER: TGateway = {
  IsSetupFinished: false,
  archive: false,
  name: 'Wire Transfer',
  gatewayId: 0,
  displayName: 'Wire Transfer',
  description: 'Use this method to receive payment from bank transfer',
  gatewayWebsiteLink: '',
  gatewayName: 'wire_transfer',
  gatewayLogo: '',
  gatewayIcons: [],
  gatewayType: 3,
  gatewayKey: '',
  gatewaySecret: '',
  subGateway: '',
  subGatewayName: '',
  publicKeyName: '',
  privateSecretName: '',
  webhookSecret: '',
  webhookEndpointUrl: '',
  gatewayWebhookIntegrationLink: '',
  // below are wire-transfer only
  minimumAmount: 0,
  currency: 'EUR',
  bank: {
    accountHolder: '',
    bic: '',
    iban: '',
    address: ''
  },
  createTime: 0,
  sort: 1,
  currencyExchangeEnabled: false,
  currencyExchange: []
}

interface IProps {
  closeModal: () => void
  gatewayConfig: TGateway
  refresh: () => void
  updateGatewayInStore: () => void
}
const Index = ({
  closeModal,
  gatewayConfig,
  refresh,
  updateGatewayInStore
}: IProps) => {
  // todo: scale down the amount value
  const appConfig = useAppConfigStore()
  const isNew = gatewayConfig.gatewayId == 0
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState('EUR')
  const onCurrencyChange = (value: string) => setCurrency(value)

  const selectAfter = (
    <Select
      value={currency}
      onChange={onCurrencyChange}
      disabled={true}
      style={{ width: 120 }}
      options={appConfig.supportCurrency.map((c) => ({
        value: c.Currency,
        label: c.Currency
      }))}
    />
  )

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
    const [_, err] = await method(accInfo)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`Wire Transfer account saved.`)
    closeModal()
    updateGatewayInStore()
    refresh()
  }

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
          style={{ marginTop: '28px' }}
          initialValues={gatewayConfig}
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
                validator(_, value) {
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
