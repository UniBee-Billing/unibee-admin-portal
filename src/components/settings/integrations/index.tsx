import { CheckOutlined, ExclamationOutlined } from '@ant-design/icons'
import { Avatar, Button, List, Tag } from 'antd'
// import update from 'immutability-helper'
import { ReactNode, useState } from 'react'
import ExchangeRateLogo from '../../../assets/integrationsKeysIcon/ExchangeRateService.svg?react'
import SegmentLogo from '../../../assets/integrationsKeysIcon/Segment.svg?react'
import SendGridLogo from '../../../assets/integrationsKeysIcon/SendGrid.svg?react'
import UniBeeLogo from '../../../assets/integrationsKeysIcon/UniBeeKeys.svg?react'
import VATsenseLogo from '../../../assets/integrationsKeysIcon/VATsense.svg?react'
import { useAppConfigStore } from '../../../stores'
import UniBeeAPIKeyModal from './UniBeeAPIKeyModal'
import ExchangeRateModal from './exchangeRateKeyModal'
import SegmentModal from './segmentModal'
import SendGridModal from './sendGridKeyModal'
import VATModal from './vatKeyModal'

type TAPP_Integration = {
  IsSetupFinished: boolean
  name: string
  description: string
  logo: ReactNode
  gatewayWebsiteLink: string
  keyName: string | string[]
  keyValue: string | string[]
  compositeKey?: boolean
}

const Index = () => {
  const [itemIndex, setItemIndex] = useState(-1)
  const [openSetupModal, setOpenSetupModal] = useState(false)
  const toggleSetupModal = (itemIndex?: number) => {
    setOpenSetupModal(!openSetupModal)
    if (typeof itemIndex == 'number') {
      setItemIndex(itemIndex)
    }
  }

  const integration_items: TAPP_Integration[] = [
    {
      IsSetupFinished: false,
      name: 'UniBee API Key',
      description:
        'Use public and private keys to secure the bank card payment.',
      logo: <UniBeeLogo />,
      gatewayWebsiteLink: '',
      keyName: 'openApiKey',
      keyValue: ''
    },
    {
      IsSetupFinished: false,
      name: 'VAT Sense Key',
      description: 'Use this key to calculate VAT for your payment.',
      logo: <VATsenseLogo />,
      gatewayWebsiteLink: 'https://vatsense.com',
      keyName: 'vatSenseKey',
      keyValue: ''
    },
    {
      IsSetupFinished: false,
      name: 'SendGrid Email Key',
      description: 'Use this key to send email to your customers.',
      logo: <SendGridLogo />,
      gatewayWebsiteLink: 'https://sendgrid.com/',
      keyName: 'sendGridKey',
      keyValue: ''
    },
    {
      IsSetupFinished: false,
      name: 'Segment setup',
      description: 'Use these server/client keys to track user behavior.',
      logo: <SegmentLogo />,
      gatewayWebsiteLink: 'https://segment.com/',
      keyName: ['segmentServerSideKey', 'segmentUserPortalKey'],
      keyValue: ['', ''],
      compositeKey: true
    },
    {
      IsSetupFinished: false,
      name: 'Exchange API key',
      description:
        'Use it to access Exchange, allowing for secure ops and user behavior tracking.',
      logo: <ExchangeRateLogo />,
      gatewayWebsiteLink: '',
      keyName: 'exchangeRateApiKey',
      keyValue: ''
    }
  ]

  const initializeKeys = (keyName: string, keyValue: string) => {
    if (
      keyName == 'segmentServerSideKey' &&
      keyValue != '' &&
      keyValue != null
    ) {
      const keyIdx = integration_items.findIndex((i) => i.compositeKey)
      if (keyIdx >= 0) {
        integration_items[keyIdx].IsSetupFinished = true
        ;(integration_items[keyIdx].keyValue as string[])[0] = keyValue
      }
      return
    }

    if (
      keyName == 'segmentUserPortalKey' &&
      keyValue != '' &&
      keyValue != null
    ) {
      const keyIdx = integration_items.findIndex((i) => i.compositeKey)
      if (keyIdx >= 0) {
        integration_items[keyIdx].IsSetupFinished = true
        ;(integration_items[keyIdx].keyValue as string[])[1] = keyValue
      }
      return
    }

    if (keyValue != '' && keyValue != null) {
      const keyIdx = integration_items.findIndex((i) => i.keyName == keyName)
      integration_items[keyIdx].IsSetupFinished = true
      integration_items[keyIdx].keyValue = keyValue
    }
  }

  const appConfigStore = useAppConfigStore()
  const {
    openApiKey,
    sendGridKey,
    vatSenseKey,
    segmentServerSideKey,
    segmentUserPortalKey,
    exchangeRateApiKey
  } = appConfigStore.integrationKeys

  initializeKeys('openApiKey', openApiKey)
  initializeKeys('sendGridKey', sendGridKey)
  initializeKeys('vatSenseKey', vatSenseKey)
  initializeKeys('exchangeRateApiKey', exchangeRateApiKey)
  initializeKeys('segmentServerSideKey', segmentServerSideKey)
  initializeKeys('segmentUserPortalKey', segmentUserPortalKey)

  const [integrationList] = useState<TAPP_Integration[]>(integration_items)

  return (
    <div>
      {openSetupModal && integrationList[itemIndex].keyName == 'openApiKey' && (
        <UniBeeAPIKeyModal closeModal={toggleSetupModal} />
      )}
      {openSetupModal &&
        integrationList[itemIndex].keyName == 'vatSenseKey' && (
          <VATModal closeModal={toggleSetupModal} />
        )}
      {openSetupModal && integrationList[itemIndex].compositeKey && (
        <SegmentModal
          serverSideKey=""
          refresh={() => {}}
          closeModal={toggleSetupModal}
        />
      )}

      {openSetupModal &&
        integrationList[itemIndex].keyName == 'sendGridKey' && (
          <SendGridModal closeModal={toggleSetupModal} />
        )}

      {openSetupModal &&
        integrationList[itemIndex].keyName == 'exchangeRateApiKey' && (
          <ExchangeRateModal closeModal={toggleSetupModal} />
        )}

      <List
        itemLayout="horizontal"
        dataSource={integrationList}
        renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                item.gatewayWebsiteLink == '' ? (
                  <Avatar shape="square" src={item.logo} className="ml-3" />
                ) : (
                  <a href={item.gatewayWebsiteLink} target="_blank">
                    <Avatar shape="square" src={item.logo} className="ml-3" />
                  </a>
                )
              }
              title={
                item.gatewayWebsiteLink == '' ? (
                  item.name
                ) : (
                  <a href={item.gatewayWebsiteLink} target="_blank">
                    {item.name}
                  </a>
                )
              }
              description={item.description}
            />
            <div className="mr-3 flex w-[180px] items-center justify-between">
              {item.IsSetupFinished ? (
                <Tag icon={<CheckOutlined />} color="#34C759">
                  Ready
                </Tag>
              ) : (
                <Tag icon={<ExclamationOutlined />} color="#AEAEB2">
                  Not Set
                </Tag>
              )}
              <Button
                onClick={() => toggleSetupModal(index)}
                type={item.IsSetupFinished ? 'default' : 'primary'}
              >
                {item.IsSetupFinished ? 'Edit' : 'Set up'}
              </Button>
            </div>
          </List.Item>
        )}
      />
    </div>
  )
}
export default Index

/*
const PaymentGatewaySetupModal = ({
  gatewayConfig,
  closeModal
}: {
  gatewayConfig: TGatewayConfig
  closeModal: () => void
}) => {
  const [form] = Form.useForm()
  const [loading, _] = useState(false)
  const onSave = () => {}
  const copyContent = async () => {
    const err = await useCopyContent(gatewayConfig.webhookEndpointUrl)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Copied')
  }
  return (
    <Modal
      title={
        gatewayConfig.IsSetupFinished
          ? `Editing keys for ${gatewayConfig.name}`
          : `New keys for ${gatewayConfig.name}`
      }
      width={'720px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        colon={false}
        initialValues={gatewayConfig}
      >
        <Form.Item label="Gateway ID" name="gatewayId" hidden>
          <Input disabled />
        </Form.Item>
        <div className="h-2" />

        <Form.Item
          label={
            gatewayConfig.gatewayName == 'paypal' ? 'Client Id' : 'Public Key'
          }
          name="gatewayKey"
        >
          <TextArea rows={4} />
        </Form.Item>
        <div className="h-2" />

        <Form.Item
          label={
            gatewayConfig.gatewayName == 'paypal' ? 'Secret' : 'Private Key'
          }
          name="gatewaySecret"
          help={
            <div className="text-xs text-gray-400">
              For security reason, your{' '}
              {gatewayConfig.gatewayName == 'paypal' ? 'Secret' : 'Private Key'}{' '}
              won't show up here after submit.
            </div>
          }
        >
          <TextArea rows={4} />
        </Form.Item>
        <div className="h-2" />

        <Form.Item
          label="Callback URL"
          name="webhookEndpointUrl"
          hidden={gatewayConfig.gatewayName !== 'changelly'}
        >
          <Input
            disabled
            suffix={
              <CopyToClipboard content={gatewayConfig.webhookEndpointUrl} />
            }
          />
        </Form.Item>
        <div className="h-2" />
        <Form.Item
          label="Callback Key"
          name="webhookSecret"
          hidden={gatewayConfig.gatewayName !== 'changelly'}
          help={
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
                the above URL, use this URL to generate your public key
                on&nbsp;&nbsp;
              </span>
              <a
                href="https://app.pay.changelly.com/integrations"
                target="_blank"
                rel="noreferrer"
                className="text-xs"
              >
                https://app.pay.changelly.com/integrations
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
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onSave}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

*/
