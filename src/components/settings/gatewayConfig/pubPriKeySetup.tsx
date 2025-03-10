import { Form, Input, message, Select } from 'antd'

import { saveGatewayConfigReq, TGatewayConfigBody } from '@/requests/index'
import { TGateway } from '@/shared.types'
import { Button } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useState } from 'react'

const PubPriKeySetup = ({
  gatewayConfig,
  closeModal,
  refresh,
  updateGatewayInStore
}: {
  gatewayConfig: TGateway
  closeModal: () => void
  refresh: () => void
  updateGatewayInStore: () => void
}) => {
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    const pubKey = form.getFieldValue('gatewayKey')
    const privateKey = form.getFieldValue('gatewaySecret')
    const gatewayPaymentTypes = form.getFieldValue('gatewayPaymentTypes')
    const body: TGatewayConfigBody = {
      gatewayKey: pubKey,
      gatewaySecret: privateKey
    }
    if (gatewayPaymentTypes != null && gatewayPaymentTypes.length > 0) {
      body.gatewayPaymentTypes = gatewayPaymentTypes
    }

    const isNew = gatewayConfig.gatewayId == 0
    if (isNew) {
      body.gatewayName = gatewayConfig.gatewayName
    } else {
      body.gatewayId = gatewayConfig.gatewayId
    }

    setLoading(true)
    const [_, err] = await saveGatewayConfigReq(body, isNew)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`${gatewayConfig?.gatewayName} keys saved`)
    refresh()
    updateGatewayInStore()
  }

  useEffect(() => {
    // after save, refresh() call will fetch the latest config item list, passed down as gatewayConfig props,
    form.setFieldsValue(gatewayConfig)
  }, [gatewayConfig])

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        colon={false}
        disabled={loading}
        initialValues={gatewayConfig}
      >
        <Form.Item label="Gateway ID" name="gatewayId" hidden>
          <Input disabled />
        </Form.Item>
        <div className="h-2" />

        {gatewayConfig.setupGatewayPaymentTypes != null &&
          gatewayConfig.setupGatewayPaymentTypes.length > 0 && (
            <Form.Item
              label="Subgateways"
              name="gatewayPaymentTypes"
              rules={[
                {
                  required:
                    gatewayConfig.setupGatewayPaymentTypes != null &&
                    gatewayConfig.setupGatewayPaymentTypes.length > 0,
                  message: `Please select your subgateways!`
                },
                () => ({
                  validator(_, value) {
                    if (value == null || value.length == 0) {
                      return Promise.reject(`Please select your subgateways!`)
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            >
              <Select
                mode="multiple"
                options={gatewayConfig.setupGatewayPaymentTypes.map((p) => ({
                  label: (
                    <>
                      {p.name}{' '}
                      <span className="text-xs text-gray-400">
                        ({p.paymentType} - {p.countryName})
                      </span>
                    </>
                  ),
                  value: p.paymentType
                }))}
              />
            </Form.Item>
          )}

        <Form.Item
          label={gatewayConfig.publicKeyName}
          name="gatewayKey"
          extra={
            <div className="text-xs text-gray-400">
              For security reason, your {gatewayConfig.publicKeyName} will be
              desensitized after submit.
            </div>
          }
          rules={[
            {
              required: true,
              message: `Please input your ${gatewayConfig.publicKeyName}!`
            },
            () => ({
              validator(_, value) {
                if (value.trim() == '' || value.includes('**')) {
                  return Promise.reject(
                    `Invalid ${gatewayConfig.publicKeyName}.`
                  )
                }
                return Promise.resolve()
              }
            })
          ]}
        >
          <TextArea rows={4} />
        </Form.Item>
        <div className="h-2" />

        <Form.Item
          label={gatewayConfig.privateSecretName}
          name="gatewaySecret"
          rules={[
            {
              required: true,
              message: `Please input your ${gatewayConfig.privateSecretName}!`
            },
            () => ({
              validator(_, value) {
                if (value.trim() == '' || value.includes('**')) {
                  return Promise.reject(
                    `Invalid ${gatewayConfig.privateSecretName}.`
                  )
                }
                return Promise.resolve()
              }
            })
          ]}
          extra={
            <div className="text-xs text-gray-400">
              For security reason, your {gatewayConfig.privateSecretName} will
              be desensitized after submit.
            </div>
          }
        >
          <TextArea rows={4} />
        </Form.Item>
        <div className="h-2" />
      </Form>

      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading}>
          Close
        </Button>
        <Button
          type="primary"
          onClick={form.submit}
          loading={loading}
          disabled={loading}
        >
          Save
        </Button>
      </div>
    </div>
  )
}
export default PubPriKeySetup
