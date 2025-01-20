import {
  CheckOutlined,
  ExclamationOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { Button, Form, Input, List, message, Modal, Tag } from 'antd'
// import update from 'immutability-helper'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useState } from 'react'
import { useCopyContent } from '../../hooks'
import {
  getPaymentGatewayConfigListReq,
  saveGatewayKeyReq
} from '../../requests'
import { TGateway } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import CopyToClipboard from '../ui/copyToClipboard'
import ModalWireTransfer, {
  NEW_WIRE_TRANSFER
} from './appConfig/wireTransferModal'

const Index = () => {
  const gatewayStore = useAppConfigStore()
  const [gatewayConfigList, setGatewayConfigList] = useState<TGateway[]>([])
  const [loading, setLoading] = useState(false)
  const [gatewayIndex, setGatewayIndex] = useState(-1)
  const [openSetupModal, setOpenSetupModal] = useState(false)
  const toggleSetupModal = (gatewayIdx?: number) => {
    setOpenSetupModal(!openSetupModal)
    if (gatewayIdx != undefined) {
      setGatewayIndex(gatewayIdx)
    }
  }

  const getPaymentGatewayConfigList = async () => {
    setLoading(true)
    const [gateways, err] = await getPaymentGatewayConfigListReq({
      refreshCb: getPaymentGatewayConfigList
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const wiredTransfer = gatewayStore.gateway.find(
      (g) => g.gatewayName == 'wire_transfer'
    )

    setGatewayConfigList(gateways.concat(wiredTransfer ?? NEW_WIRE_TRANSFER))
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
            refresh={getPaymentGatewayConfigList}
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
        loading={{ indicator: <LoadingOutlined spin />, spinning: loading }}
        dataSource={gatewayConfigList}
        renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                item.gatewayWebsiteLink == '' ? (
                  <div
                    style={{
                      height: '36px',
                      width: '140px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      style={{ flexShrink: 0 }}
                      height={'100%'}
                      src={item.gatewayLogo}
                    />
                  </div>
                ) : (
                  <a href={item.gatewayWebsiteLink} target="_blank">
                    <div
                      style={{
                        height: '36px',
                        width: '140px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        style={{ flexShrink: 0 }}
                        height={'100%'}
                        src={item.gatewayLogo}
                      />
                    </div>
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
  refresh,
  closeModal
}: {
  gatewayConfig: TGateway
  refresh: () => void
  closeModal: () => void
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    return
    const pubKey = form.getFieldValue('gatewayKey')
    if (pubKey.trim() == '') {
      message.error('Public Key is empty')
      return
    }

    const privateKey = form.getFieldValue('gatewaySecret')
    if (privateKey.trim() == '') {
      message.error('Private Key is empty')
      return
    }
    const body = {
      gatewayKey: pubKey,
      gatewaySecret: privateKey,
      gatewayName: !gatewayConfig.IsSetupFinished
        ? gatewayConfig.gatewayName
        : undefined,
      gatewayId: !gatewayConfig.IsSetupFinished
        ? undefined
        : gatewayConfig.gatewayId
    }

    setLoading(true)
    const [_, err] = await saveGatewayKeyReq(
      body,
      !gatewayConfig.IsSetupFinished
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`${gatewayConfig?.gatewayName} keys saved`)
    refresh()
    closeModal()
  }
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
