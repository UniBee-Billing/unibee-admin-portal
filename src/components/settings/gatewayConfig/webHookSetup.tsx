import { Button } from 'antd'

import { Form, Input } from 'antd'

import CopyToClipboard from '@/components/ui/copyToClipboard'
import { useCopyContent } from '@/hooks/index'
import { saveWebhookKeyReq, saveGatewayConfigReq, TGatewayConfigBody } from '@/requests/index'
import { TGateway } from '@/shared.types'
import { message } from 'antd'
import { useForm } from 'antd/es/form/Form'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useState } from 'react'

const WebHookSetup = ({
  gatewayConfig,
  closeModal,
  refresh,
  updateGatewayInStore,
  isDuplicateMode = false,
  sharedDisplayName
}: {
  gatewayConfig: TGateway
  closeModal: () => void
  refresh: () => void
  updateGatewayInStore: () => void
  isDuplicateMode?: boolean
  sharedDisplayName?: string
}) => {
  const [form] = useForm()
  const [loading, setLoading] = useState(false)
  // configure pub/private keys first, then configure webhook
  // In duplicate mode, allow webhook configuration even if original gateway has no keys
  const notSubmitable = gatewayConfig.gatewayKey == '' && !isDuplicateMode

  const onSave = async () => {
    if (gatewayConfig.gatewayId == 0 && !isDuplicateMode) {
      message.error('Input your public/private keys first.')
      return
    }

    const webHookSecret = form.getFieldValue('webhookSecret')
    setLoading(true)

    try {
      if (isDuplicateMode) {
        // In duplicate mode, first create the gateway with all necessary data
        const body: TGatewayConfigBody = {
          gatewayName: gatewayConfig.gatewayName,
          displayName: sharedDisplayName || `${gatewayConfig.displayName} (Copy)`,
          gatewayLogo: gatewayConfig.gatewayIcons || [],
        }

        // In duplicate mode, we need the user to provide new keys
        // Don't copy the original keys, user should input new ones
        // Don't copy subGateway - it's optional and should be cleared in duplicate mode
        // Don't copy payment types - user should select new ones for Payssion
        // Don't copy currencyExchange - it's optional and should be cleared in duplicate mode

        // Create the new gateway first
        const [newGateway, setupErr] = await saveGatewayConfigReq(body, true)
        if (setupErr != null) {
          message.error(setupErr.message)
          return
        }

        // Then save the webhook key for the new gateway
        const [_, webhookErr] = await saveWebhookKeyReq(newGateway.gatewayId, webHookSecret)
        if (webhookErr != null) {
          message.error(webhookErr.message)
          return
        }

        message.success(`${gatewayConfig.gatewayName} duplicated successfully with webhook configuration.`)
      } else {
        // Normal webhook save for existing gateway
        const [_, err] = await saveWebhookKeyReq(gatewayConfig.gatewayId, webHookSecret)
        if (err != null) {
          message.error(err.message)
          return
        }
        message.success(`${gatewayConfig.gatewayName} webhook key saved.`)
      }

      updateGatewayInStore()
      refresh()
      closeModal()
    } catch (error) {
      message.error('Failed to save webhook configuration.')
    } finally {
      setLoading(false)
    }
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
    if (isDuplicateMode) {
      // In duplicate mode, clear the webhook key so user can input new one
      const clearedConfig = {
        ...gatewayConfig,
        webhookSecret: ''
      }
      form.setFieldsValue(clearedConfig)
    } else {
      form.setFieldsValue(gatewayConfig)
    }
  }, [gatewayConfig, isDuplicateMode])

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
        initialValues={isDuplicateMode ? {
          ...gatewayConfig,
          webhookSecret: ''
        } : gatewayConfig}
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

export default WebHookSetup
