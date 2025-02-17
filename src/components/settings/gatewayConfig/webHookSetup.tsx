import { Button } from 'antd'

import { Form, Input } from 'antd'

import { message } from 'antd'
import { useForm } from 'antd/es/form/Form'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useState } from 'react'
import { useCopyContent } from '../../../hooks'
import { saveWebhookKeyReq } from '../../../requests'
import { TGateway } from '../../../shared.types'
import CopyToClipboard from '../../ui/copyToClipboard'

const Index = ({
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
  const [form] = useForm()
  const [loading, setLoading] = useState(false)
  // configure pub/private keys first, then configure webhook
  const notSubmitable = gatewayConfig.gatewayKey == ''

  const onSave = async () => {
    if (gatewayConfig.gatewayId == 0) {
      message.error('Input your public/private keys first.')
      return
    }

    const webHookSecret = form.getFieldValue('webhookSecret')
    setLoading(true)
    const [_, err] = await saveWebhookKeyReq(
      gatewayConfig.gatewayId,
      webHookSecret
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`${gatewayConfig.gatewayName} webhook key saved.`)
    updateGatewayInStore()
    refresh()
  }

  const copyContent = async () => {
    const err = await useCopyContent(gatewayConfig.webhookEndpointUrl)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Copied')
  }

  useEffect(() => {
    // after save, refresh() call will fetch the latest config item list, passed down as gatewayConfig props,
    form.setFieldsValue(gatewayConfig)
  }, [gatewayConfig])

  return (
    <div>
      {notSubmitable && (
        <span className="text-xs text-red-500">
          Please create your Public/Private keys first, then configure the
          Webhook.
        </span>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        colon={false}
        disabled={notSubmitable || loading}
        initialValues={gatewayConfig}
      >
        <Form.Item label="Gateway ID" name="gatewayId" hidden>
          <Input disabled />
        </Form.Item>
        <div className="h-2" />
        <Form.Item label="Callback URL" name="webhookEndpointUrl">
          <Input
            disabled
            suffix={
              <CopyToClipboard
                content={gatewayConfig.webhookEndpointUrl}
                disabled={notSubmitable}
              />
            }
          />
        </Form.Item>
        <div className="h-2" />
        <Form.Item
          label="Webhook Key"
          name="webhookSecret"
          rules={[
            {
              required: true,
              message: `Please input your webhook key!`
            },
            () => ({
              validator(_, value) {
                if (value.trim() == '' || value.includes('**')) {
                  return Promise.reject(`Invalid webhook key.`)
                }
                return Promise.resolve()
              }
            })
          ]}
          extra={
            <div className="mt-2 text-sm">
              <Button
                type="link"
                onClick={copyContent}
                style={{ padding: 0 }}
                size="small"
              >
                Copy
              </Button>
              &nbsp;
              <span className="text-xs text-gray-400">
                the above URL, use that URL to generate your public key
                on&nbsp;&nbsp;
              </span>
              <a
                href={gatewayConfig.gatewayWebhookIntegrationLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs"
              >
                {gatewayConfig.gatewayWebhookIntegrationLink}
              </a>
              <span className="text-xs text-gray-400">
                , then paste it here.
              </span>
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
          disabled={loading || notSubmitable}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export default Index
