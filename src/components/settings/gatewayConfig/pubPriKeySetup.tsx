import { Form, Input, message, Select } from 'antd'

import { saveGatewayConfigReq, TGatewayConfigBody } from '@/requests/index'
import { GatewayPaymentType, TGateway } from '@/shared.types'
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
  const [paymentTypes, setPaymentTypes] = useState<
    GatewayPaymentType[] | undefined
  >(gatewayConfig.gatewayPaymentTypes)

  const paymentTypesNeeded =
    gatewayConfig.setupGatewayPaymentTypes != null &&
    gatewayConfig.setupGatewayPaymentTypes.length > 0

  const paymentTypesErr =
    paymentTypesNeeded &&
    (paymentTypes == undefined || paymentTypes.length == 0)

  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    const pubKey = form.getFieldValue('gatewayKey')
    const privateKey = form.getFieldValue('gatewaySecret')
    const body: TGatewayConfigBody = {}
    if (!pubKey.includes('**')) {
      // after submit, the key will be desensitized with many '***' inside it,
      // there are many other fields in this form, if key/secret are desensitized, we don't submit them.
      body.gatewayKey = pubKey
    }
    if (!privateKey.includes('**')) {
      body.gatewaySecret = privateKey
    }

    if (paymentTypesNeeded) {
      if (paymentTypesErr) return
      body.gatewayPaymentTypes = paymentTypes!.map((p) => p.paymentType)
    }

    const isNew = gatewayConfig.gatewayId == 0
    if (isNew) {
      body.gatewayName = gatewayConfig.gatewayName
    } else {
      body.gatewayId = gatewayConfig.gatewayId
    }

    if (gatewayConfig.subGatewayName != '') {
      body.subGateway = form.getFieldValue('subGateway')
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

        {gatewayConfig.subGatewayName != '' && (
          <Form.Item label={gatewayConfig.subGatewayName} name="subGateway">
            <Input />
          </Form.Item>
        )}

        {/*
        select values of "gatewayPaymentTypes" returned from BE is not string[], but {paymentType, name, autoCharge, category, countryName}[],
        cannot let form handle its change.
        */}

        {paymentTypesNeeded && (
          <Form.Item
            label="Payment Types"
            // name="gatewayPaymentTypes"
            extra={
              paymentTypesErr ? (
                <div className="text-sm text-red-500">
                  Please select your payment types!
                </div>
              ) : null
            }
          >
            <Select
              mode="multiple"
              status={paymentTypesErr ? 'error' : undefined}
              value={
                paymentTypes == undefined
                  ? []
                  : paymentTypes.map((p) => p.paymentType)
              }
              onChange={(value) =>
                setPaymentTypes(
                  value.map((v) =>
                    gatewayConfig.setupGatewayPaymentTypes!.find(
                      (p) => p.paymentType === v
                    )
                  ) as GatewayPaymentType[]
                )
              }
              options={gatewayConfig.setupGatewayPaymentTypes!.map((p) => ({
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
                if (value == undefined || value.trim() == '') {
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
                if (value == undefined || value.trim() == '') {
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
