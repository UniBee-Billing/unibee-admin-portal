import { currencyDecimalValidate } from '@/helpers'
import {
  createWireTransferAccountReq,
  updateWireTransferAccountReq
} from '@/requests/index'
import { GatewayType, TGateway } from '@/shared.types'

// Extended bank type for wire transfers with additional fields
interface ExtendedBankInfo {
  accountHolder: string
  address: string
  iban: string
  bic: string
  accountNumber?: string
  bankName?: string
  swiftCode?: string
  transitNumber?: string
  institutionNumber?: string
  bsbCode?: string
  ABARoutingNumber?: string
  CNAPS?: string
  Remarks?: string
}

interface ExtendedTGateway extends Omit<TGateway, 'bank'> {
  bank: ExtendedBankInfo
}
import { useAppConfigStore } from '@/stores'
import { Button, Form, Input, InputNumber, Modal, Select, message } from 'antd'
import { Currency } from 'dinero.js'
import { useState, useEffect, useCallback } from 'react'

export const NEW_WIRE_TRANSFER: ExtendedTGateway = {
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
  gatewayType: GatewayType.WIRE_TRANSFER,
  gatewayKey: '',
  gatewaySecret: '',
  publicKeyName: '',
  privateSecretName: '',
  subGateway: '',
  subGatewayName: '',
  webhookSecret: '',
  webhookEndpointUrl: '',
  gatewayWebhookIntegrationLink: '',
  // below are wire-transfer only
  minimumAmount: 0,
  currency: 'EUR',
  bank: {
    accountHolder: '',
    address: '',
    iban: '',
    bic: '',
    accountNumber: '',
    bankName: '',
    swiftCode: '',
    transitNumber: '',
    institutionNumber: '',
    bsbCode: '',
    ABARoutingNumber: '',
    CNAPS: '',
    Remarks: ''
  },
  createTime: 0,
  sort: 1,
  currencyExchangeEnabled: false,
  currencyExchange: []
}

interface IProps {
  closeModal: () => void
  gatewayConfig: ExtendedTGateway | TGateway
  refresh: () => void
  updateGatewayInStore: () => void
}
const Index = ({
  closeModal,
  gatewayConfig,
  refresh,
  updateGatewayInStore
}: IProps) => {
  const appConfig = useAppConfigStore()
  const isNew = gatewayConfig.gatewayId == 0
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState<Currency>(gatewayConfig.currency as Currency || 'EUR')
  const onCurrencyChange = (value: Currency) => {
    setCurrency(value)
    // Clear all bank-related form fields when currency changes
    form.setFieldsValue({
      bank: {
        accountHolder: '',
        address: '',
        iban: '',
        bic: '',
        accountNumber: '',
        bankName: '',
        swiftCode: '',
        transitNumber: '',
        institutionNumber: '',
        bsbCode: '',
        ABARoutingNumber: '',
        CNAPS: '',
        Remarks: ''
      }
    })
  }

  // Currency options from system configuration
  const currencyOptions = appConfig.supportCurrency.map((c) => ({
    value: c.Currency,
    label: c.Currency
  }))

  // Get currency-specific field configuration
  const getCurrencyFieldsConfig = (currency: Currency) => {
    switch (currency) {
      case 'EUR':
        return {
          showIban: true,
          showBic: true,
          showAccountNumber: false,
          showBankName: false,
          showSwiftCode: false,
          showTransitNumber: false,
          showInstitutionNumber: false,
          showBsbCode: false,
          showABARoutingNumber: false,
          showCNAPS: false,
          showRemarks: true,
          requiredFields: []
        }
      case 'USD':
        return {
          showIban: false,
          showBic: false,
          showAccountNumber: true,
          showBankName: false,
          showSwiftCode: true,
          showTransitNumber: false,
          showInstitutionNumber: false,
          showBsbCode: false,
          showABARoutingNumber: true,
          showCNAPS: false,
          showRemarks: true,
          requiredFields: ['accountNumber', 'swiftCode']
        }
      case 'GBP':
        return {
          showIban: true,
          showBic: true,
          showAccountNumber: false,
          showBankName: false,
          showSwiftCode: false,
          showTransitNumber: false,
          showInstitutionNumber: false,
          showBsbCode: false,
          showABARoutingNumber: false,
          showCNAPS: false,
          showRemarks: true,
          requiredFields: ['bic']
        }
      case 'CNY':
        return {
          showIban: false,
          showBic: false,
          showAccountNumber: true,
          showBankName: true,
          showSwiftCode: true,
          showTransitNumber: false,
          showInstitutionNumber: false,
          showBsbCode: false,
          showABARoutingNumber: false,
          showCNAPS: true,
          showRemarks: true,
          requiredFields: ['accountNumber', 'bankName']
        }
      case 'SGD':
        return {
          showIban: false,
          showBic: false,
          showAccountNumber: true,
          showBankName: true,
          showSwiftCode: true,
          showTransitNumber: false,
          showInstitutionNumber: false,
          showBsbCode: false,
          showABARoutingNumber: false,
          showCNAPS: false,
          showRemarks: true,
          requiredFields: ['swiftCode']
        }
      case 'JPY':
        return {
          showIban: false,
          showBic: false,
          showAccountNumber: true,
          showBankName: true,
          showSwiftCode: true,
          showTransitNumber: false,
          showInstitutionNumber: false,
          showBsbCode: false,
          showABARoutingNumber: false,
          showCNAPS: false,
          showRemarks: true,
          requiredFields: ['swiftCode']
        }
      case 'AUD':
        return {
          showIban: false,
          showBic: false,
          showAccountNumber: true,
          showBankName: true,
          showSwiftCode: true,
          showTransitNumber: false,
          showInstitutionNumber: false,
          showBsbCode: true,
          showABARoutingNumber: false,
          showCNAPS: false,
          showRemarks: true,
          requiredFields: ['accountNumber', 'bankName', 'bsbCode']
        }
      case 'CAD':
        return {
          showIban: false,
          showBic: false,
          showAccountNumber: true,
          showBankName: false,
          showSwiftCode: true,
          showTransitNumber: true,
          showInstitutionNumber: true,
          showBsbCode: false,
          showABARoutingNumber: false,
          showCNAPS: false,
          showRemarks: true,
          requiredFields: ['accountNumber', 'transitNumber', 'institutionNumber']
        }
      case 'HKD':
        return {
          showIban: false,
          showBic: false,
          showAccountNumber: true,
          showBankName: true,
          showSwiftCode: true,
          showTransitNumber: false,
          showInstitutionNumber: false,
          showBsbCode: false,
          showABARoutingNumber: false,
          showCNAPS: false,
          showRemarks: true,
          requiredFields: ['swiftCode']
        }
      default:
        return {
          showIban: true,
          showBic: true,
          showAccountNumber: true,
          showBankName: true,
          showSwiftCode: true,
          showTransitNumber: false,
          showInstitutionNumber: false,
          showBsbCode: false,
          showABARoutingNumber: false,
          showCNAPS: false,
          showRemarks: true,
          requiredFields: []
        }
    }
  }

  const fieldsConfig = getCurrencyFieldsConfig(currency)

  // Calculate display amount correctly
  const getDisplayAmount = useCallback(() => {
    // Return the minimum amount as-is since it's already in display format
    return gatewayConfig.minimumAmount || 0
  }, [gatewayConfig.minimumAmount])

  // Set currency from gatewayConfig when component mounts
  useEffect(() => {
    if (gatewayConfig.currency && gatewayConfig.currency !== currency) {
      setCurrency(gatewayConfig.currency as Currency)
    }
  }, [gatewayConfig.currency])

  // Update form when currency changes to ensure correct amount display
  useEffect(() => {
    if (gatewayConfig.currency && form) {
      const displayAmount = getDisplayAmount()
      form.setFieldsValue({
        minimumAmount: displayAmount
      })
    }
  }, [currency, gatewayConfig, form, getDisplayAmount])

  const onSave = async () => {
    const accInfo = JSON.parse(JSON.stringify(form.getFieldsValue()))
    accInfo.currency = currency
    accInfo.minimumAmount = Number(accInfo.minimumAmount)
    // Multiply by scale to restore original value for storage
    accInfo.minimumAmount *= appConfig.currency[currency]!.Scale

    setLoading(true)
    const method = isNew
      ? createWireTransferAccountReq
      : updateWireTransferAccountReq
    const [gateway, err] = await method(accInfo)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    // Mark the payment gateway step as completed
    if (gateway && gateway.IsSetupFinished) {
      message.success('Wire Transfer account saved and setup completed')
    } else {
      message.success('Wire Transfer account saved')
    }

    closeModal()
    updateGatewayInStore()
    refresh()
  }


  return (
    <>
      <Modal
        title="Wire Transfer Setup"
        width={560}
        open={true}
        footer={null}
        onCancel={closeModal}
        closeIcon={<div className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">✕</div>}
        styles={{
          content: { padding: '32px' },
          header: { paddingBottom: '0', marginBottom: '24px', borderBottom: 'none' }
        }}
      >
        <Form
          form={form}
          onFinish={onSave}
          layout="vertical"
          initialValues={{
            ...gatewayConfig,
            minimumAmount: getDisplayAmount()
          }}
          disabled={loading}
        >
          {!isNew && (
            <Form.Item name={'gatewayId'} hidden>
              <Input />
            </Form.Item>
          )}

          {/* Minimum Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Amount</label>
            <div className="flex">
              <Select
                value={currency}
                onChange={onCurrencyChange}
                style={{ width: 100 }}
                options={currencyOptions}
                className="rounded-r-none"
                placeholder="Select"
              />
          <Form.Item
            name="minimumAmount"
                className="flex-1 mb-0"
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
            <InputNumber
              min={0}
                  placeholder="120"
                  className="w-full rounded-l-none"
              prefix={appConfig.currency[currency]?.Symbol}
            />
          </Form.Item>
            </div>
          </div>

          {/* Account Holder */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder <span className="text-red-500">*</span>
            </label>
          <Form.Item
            name={['bank', 'accountHolder']}
              className="mb-0"
            rules={[
              {
                required: true,
                message: 'Please input the account holder!'
              }
            ]}
          >
              <Input placeholder="Enter Account Holder" />
          </Form.Item>
          </div>

          {/* Address */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
          <Form.Item
              name={['bank', 'address']}
              className="mb-0"
            rules={[
              {
                required: true,
                  message: 'Please input the address!'
                }
              ]}
            >
              <Input placeholder="Enter Address" />
            </Form.Item>
          </div>

          {/* Bank Info */}
          <div className="mb-6">
            <div className="space-y-4">
                {/* IBAN */}
                {fieldsConfig.showIban && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      IBAN
                      {fieldsConfig.requiredFields.includes('iban') && <span className="text-red-500"> *</span>}
                      {currency === 'GBP' && <span className="text-red-500 text-xs ml-2">(Fixed 22 characters starting with GB)</span>}
                    </label>
                    <Form.Item
                      name={['bank', 'iban']}
                      className="mb-0"
                      rules={[
                        {
                          required: fieldsConfig.requiredFields.includes('iban'),
                          message: 'Please input the IBAN!'
                        },
                        ...(currency === 'EUR' ? [() => ({
                          validator(_: any, value: any) {
                            if (value && value.length !== 16) {
                              return Promise.reject('IBAN must be 16 characters for EU accounts')
                            }
                            return Promise.resolve()
                          }
                        })] : []),
                        ...(currency === 'GBP' ? [() => ({
                          validator(_: any, value: any) {
                            if (value && (value.length !== 22 || !value.startsWith('GB'))) {
                              return Promise.reject('IBAN must be 22 characters starting with GB for UK accounts')
                            }
                            return Promise.resolve()
                          }
                        })] : [])
                      ]}
                    >
                      <Input placeholder={
                        currency === 'EUR' ? '1111 2222 3333 4444' :
                        currency === 'GBP' ? '22 characters starting with GB' :
                        'Enter IBAN'
                      } />
                    </Form.Item>
                  </div>
                )}

                {/* BIC */}
                {fieldsConfig.showBic && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      BIC
                      {fieldsConfig.requiredFields.includes('bic') && <span className="text-red-500"> *</span>}
                    </label>
                    <Form.Item
                      name={['bank', 'bic']}
                      className="mb-0"
                      rules={[
                        {
                          required: fieldsConfig.requiredFields.includes('bic'),
                message: 'Please input the BIC!'
                        },
                        () => ({
                          validator(_: any, value: any) {
                            if (value && value.length !== 8 && value.length !== 11) {
                              return Promise.reject('BIC must be 8 or 11 characters long')
                            }
                            return Promise.resolve()
                          }
                        })
                      ]}
                    >
                      <Input placeholder="Enter BIC" />
                    </Form.Item>
                  </div>
                )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mb-6">
            <div className="space-y-4">
                {/* Account Number */}
                {fieldsConfig.showAccountNumber && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Account Number
                      {fieldsConfig.requiredFields.includes('accountNumber') && <span className="text-red-500"> *</span>}
                    </label>
                    <Form.Item
                      name={['bank', 'accountNumber']}
                      className="mb-0"
                      rules={[
                        {
                          required: fieldsConfig.requiredFields.includes('accountNumber'),
                          message: 'Please input the account number!'
                        }
                      ]}
                    >
                      <Input placeholder="Enter Account Number" />
                    </Form.Item>
                  </div>
                )}

                {/* Bank Name */}
                {fieldsConfig.showBankName && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Bank Name
                      {fieldsConfig.requiredFields.includes('bankName') && <span className="text-red-500"> *</span>}
                    </label>
                    <Form.Item
                      name={['bank', 'bankName']}
                      className="mb-0"
                      rules={[
                        {
                          required: fieldsConfig.requiredFields.includes('bankName'),
                          message: 'Please input the bank name!'
                        }
                      ]}
                    >
                      <Input placeholder="Enter Bank Name" />
                    </Form.Item>
                  </div>
                )}

                {/* SWIFT Code */}
                {fieldsConfig.showSwiftCode && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      SWIFT Code
                      {fieldsConfig.requiredFields.includes('swiftCode') && <span className="text-red-500"> *</span>}
                    </label>
                    <Form.Item
                      name={['bank', 'swiftCode']}
                      className="mb-0"
                      rules={[
                        {
                          required: fieldsConfig.requiredFields.includes('swiftCode'),
                          message: 'Please input the SWIFT code!'
                        },
                        () => ({
                          validator(_: any, value: any) {
                            if (value && value.length !== 8 && value.length !== 11) {
                              return Promise.reject('SWIFT code must be 8 or 11 characters long')
                            }
                            return Promise.resolve()
                          }
                        })
                      ]}
                    >
                      <Input placeholder="Enter SWIFT Code" />
          </Form.Item>
                  </div>
                )}

                {/* Transit Number (Canada) */}
                {fieldsConfig.showTransitNumber && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Transit Number
                      {fieldsConfig.requiredFields.includes('transitNumber') && <span className="text-red-500"> *</span>}
                    </label>
          <Form.Item
                      name={['bank', 'transitNumber']}
                      className="mb-0"
            rules={[
              {
                          required: fieldsConfig.requiredFields.includes('transitNumber'),
                          message: 'Please input the transit number!'
              }
            ]}
          >
                      <Input placeholder="Enter Transit Number" />
          </Form.Item>
                  </div>
                )}

                {/* Institution Number (Canada) */}
                {fieldsConfig.showInstitutionNumber && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Institution Number
                      {fieldsConfig.requiredFields.includes('institutionNumber') && <span className="text-red-500"> *</span>}
                    </label>
          <Form.Item
                      name={['bank', 'institutionNumber']}
                      className="mb-0"
            rules={[
              {
                          required: fieldsConfig.requiredFields.includes('institutionNumber'),
                          message: 'Please input the institution number!'
                        }
                      ]}
                    >
                      <Input placeholder="Enter Institution Number" />
                    </Form.Item>
                  </div>
                )}

                {/* BSB Code (Australia) */}
                {fieldsConfig.showBsbCode && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      BSB Code
                      {fieldsConfig.requiredFields.includes('bsbCode') && <span className="text-red-500"> *</span>}
                    </label>
                    <Form.Item
                      name={['bank', 'bsbCode']}
                      className="mb-0"
                      rules={[
                        {
                          required: fieldsConfig.requiredFields.includes('bsbCode'),
                          message: 'Please input the BSB code!'
                        },
                        () => ({
                          validator(_: any, value: any) {
                            if (value && value.length !== 6) {
                              return Promise.reject('BSB code must be 6 characters long')
                            }
                            return Promise.resolve()
                          }
                        })
                      ]}
                    >
                      <Input placeholder="Enter BSB Code" />
          </Form.Item>
                  </div>
                )}

                {/* ABA Routing Number (USA) */}
                {fieldsConfig.showABARoutingNumber && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      ABA Routing Number
                      {fieldsConfig.requiredFields.includes('ABARoutingNumber') && <span className="text-red-500"> *</span>}
                    </label>
                    <Form.Item
                      name={['bank', 'ABARoutingNumber']}
                      className="mb-0"
                      rules={[
                        {
                          required: fieldsConfig.requiredFields.includes('ABARoutingNumber'),
                          message: 'Please input the ABA routing number!'
                        },
                        () => ({
                          validator(_: any, value: any) {
                            if (value && value.length !== 9) {
                              return Promise.reject('ABA routing number must be 9 digits long')
                            }
                            return Promise.resolve()
                          }
                        })
                      ]}
                    >
                      <Input placeholder="Enter ABA Routing Number" />
                    </Form.Item>
                  </div>
                )}

                {/* CNAPS (China) */}
                {fieldsConfig.showCNAPS && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      CNAPS
                      {fieldsConfig.requiredFields.includes('CNAPS') && <span className="text-red-500"> *</span>}
                    </label>
                    <Form.Item
                      name={['bank', 'CNAPS']}
                      className="mb-0"
                      rules={[
                        {
                          required: fieldsConfig.requiredFields.includes('CNAPS'),
                          message: 'Please input the CNAPS code!'
                        }
                      ]}
                    >
                      <Input placeholder="Enter CNAPS Code" />
                    </Form.Item>
                  </div>
                )}

                {/* Remarks */}
                {fieldsConfig.showRemarks && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Remarks
                      {fieldsConfig.requiredFields.includes('Remarks') && <span className="text-red-500"> *</span>}
                    </label>
                    <Form.Item
                      name={['bank', 'Remarks']}
                      className="mb-0"
                      rules={[
                        {
                          required: fieldsConfig.requiredFields.includes('Remarks'),
                          message: 'Please input remarks!'
                        }
                      ]}
                    >
                      <Input.TextArea 
                        placeholder="Additional information or remarks" 
                        rows={3}
                      />
                    </Form.Item>
                  </div>
                )}

            </div>
          </div>
        </Form>

        {/* Footer buttons */}
        <div className="flex justify-between pt-6 mt-8 border-t">
          <Button 
            size="large"
            onClick={closeModal} 
            disabled={loading}
            className="px-8"
          >
            Close
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={form.submit}
            disabled={loading}
            loading={loading}
            className="px-8"
          >
            Save
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default Index

