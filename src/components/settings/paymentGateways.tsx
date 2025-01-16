import { CheckOutlined, ExclamationOutlined } from '@ant-design/icons'
import { Avatar, Button, Form, Input, List, message, Modal, Tag } from 'antd'
// import update from 'immutability-helper'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useState } from 'react'
import { useCopyContent } from '../../hooks'
import { getPaymentGatewayConfigListReq } from '../../requests'
import { TGateway } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import CopyToClipboard from '../ui/copyToClipboard'
import ModalWireTransfer from './appConfig/wireTransferModal'

const NEW_WIRE_TRANSFER: TGateway = {
  gatewayId: -1,
  gatewayKey: '',
  gatewayName: 'wire_transfer',
  webhookEndpointUrl: '',
  webhookSecret: '',
  gatewayLogo: '',
  gatewayType: 3,
  createTime: 0,
  minimumAmount: 0,
  currency: 'EUR',
  bank: {
    accountHolder: '',
    bic: '',
    iban: '',
    address: ''
  },
  IsSetupFinished: false,
  name: '',
  description: '',
  gatewaySecret: '',
  displayName: '',
  gatewayIcons: [],
  gatewayWebsiteLink: '',
  gatewayWebhookIntegrationLink: '',
  sort: 0
}
/*
export type TGatewayConfig = {
  IsSetupFinished: boolean
  gatewayId: number // 0: also means setup unfinished
  gatewayName: string // stripe
  gatewayType: number
  displayName: string // Bank Cards
  description: string
  name: string // Stripe
  gatewayIcons: string[]
  gatewayLogo: string
  gatewayWebsiteLink: string
  gatewayKey: string // public key(desensitized)
  gatewaySecret: string // private key(desensitized)
  gatewayWebhookIntegrationLink: string
  currency: string
  sort: number //
  webhookEndpointUrl: string
  webhookSecret: string // desensitized
  minimumAmount: number
  createTime: number
}
*/

const Index = () => {
  // prefill WireTransfer in this list
  const gatewayStore = useAppConfigStore()
  console.log('gatewaysotre: ', gatewayStore)
  const [gatewayConfigList, setGatewayConfigList] = useState<TGateway[]>([])
  // const [loading, setLoading] = useState(false)
  const [gatewayIndex, setGatewayIndex] = useState(-1)
  const [openSetupModal, setOpenSetupModal] = useState(false)
  const toggleSetupModal = (gatewayIdx?: number) => {
    setOpenSetupModal(!openSetupModal)
    if (gatewayIdx != undefined) {
      setGatewayIndex(gatewayIdx)
    }
  }

  const getPaymentGatewayConfigList = async () => {
    const [gateways, err] = await getPaymentGatewayConfigListReq()
    if (null != err) {
      message.error(err.message)
      return
    }
    const wiredTransfer = gatewayStore.gateway.find(
      (g) => g.gatewayName == 'wire_transfer'
    )

    setGatewayConfigList(gateways.concat(wiredTransfer ?? NEW_WIRE_TRANSFER))
    // console.log('gateways: ', gateways)
  }

  useEffect(() => {
    getPaymentGatewayConfigList()
  }, [])

  return (
    <div>
      {openSetupModal &&
        (gatewayConfigList[gatewayIndex].gatewayName != 'wire_transfer' ? (
          <PaymentGatewaySetupModal
            closeModal={toggleSetupModal}
            gatewayConfig={gatewayConfigList[gatewayIndex]}
          />
        ) : (
          <ModalWireTransfer
            closeModal={toggleSetupModal}
            detail={gatewayConfigList[gatewayIndex]}
            refresh={getPaymentGatewayConfigList}
          />
        ))}
      <List
        itemLayout="horizontal"
        dataSource={gatewayConfigList}
        renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                item.gatewayWebsiteLink == '' ? (
                  <Avatar src={<img src={item.gatewayLogo} />} />
                ) : (
                  <a href={item.gatewayWebsiteLink} target="_blank">
                    <Avatar src={<img src={item.gatewayLogo} />} />
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
            <div className="flex w-[180px] items-center justify-between">
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

const PaymentGatewaySetupModal = ({
  gatewayConfig,
  closeModal
}: {
  gatewayConfig: TGateway
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
