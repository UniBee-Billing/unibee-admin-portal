import Icon, {
  CheckOutlined,
  ExclamationOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Col,
  Form,
  Input,
  List,
  message,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip
} from 'antd'
// import update from 'immutability-helper'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useMemo, useState } from 'react'
import ExchangeIcon from '../../assets/exchange.svg?react'
import { numBoolConvert } from '../../helpers'
import {
  createCreditConfigReq,
  getCreditConfigListReq,
  getPaymentGatewayConfigListReq,
  saveCreditConfigReq
} from '../../requests'
import { CreditType, TCreditConfig, TGatewayConfig } from '../../shared.types'
import { useCreditConfigStore, useMerchantInfoStore } from '../../stores'

const Index = () => {
  // prefill WireTransfer in this list
  const [gatewayConfigList, setGatewayConfigList] = useState<TGatewayConfig[]>(
    []
  )
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
    const [gateways, err] = await getPaymentGatewayConfigListReq()
    if (null != err) {
      message.error(err.message)
      return
    }
    setGatewayConfigList(gateways)
    console.log('gateways: ', gateways)
  }

  useEffect(() => {
    getPaymentGatewayConfigList()
  }, [])

  return (
    <div>
      {openSetupModal && (
        <PaymentGatewaySetupModal
          closeModal={toggleSetupModal}
          gatewayConfig={gatewayConfigList[gatewayIndex]}
        />
      )}
      <List
        itemLayout="horizontal"
        dataSource={gatewayConfigList}
        renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar src={<img src={item.gatewayLogo} />} />}
              title={item.displayName}
              description={item.description}
            />
            <Space size={[8, 0]} wrap>
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
            </Space>
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
  gatewayConfig: TGatewayConfig
  closeModal: () => void
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const onSave = () => {}
  console.log('config: ', gatewayConfig)
  return (
    <Modal
      title={
        gatewayConfig.IsSetupFinished
          ? `Editing keys for ${gatewayConfig.name}`
          : `New keys for ${gatewayConfig.name}`
      }
      width={'600px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        // labelCol={{ flex: '180px' }}
        // wrapperCol={{ flex: 1 }}
        colon={false}
        initialValues={gatewayConfig}
      >
        <Form.Item label="Gateway ID" name="gatewayId" hidden>
          <Input disabled />
        </Form.Item>
      </Form>
      <div className="my-6 w-full">
        {/* gatewayConfig.gatewayName == 'paypal' ? 'Client Id' : 'Public Key' */}
        <div>Public Key</div>
        <Form.Item label="Public Key" name="gatewayPubKey">
          <TextArea
            rows={4}
            // value={pubKey}
            // onChange={onKeyChange('public')}
          />
        </Form.Item>

        {/* gatewayConfig.gatewayName == 'paypal' ? 'Secret' : 'Private Key' */}

        <Form.Item label="Private Key" name="gatewayKey">
          <TextArea
            rows={4}
            // value={privateKey}
            // onChange={onKeyChange('private')}
          />
        </Form.Item>

        <div className="text-xs text-gray-400">
          For security reason, your{' '}
          {gatewayConfig.gatewayName == 'paypal' ? 'Secret' : 'Private Key'}{' '}
          won't show up here after submit.
        </div>

        {/* <div>Callback URL</div> */}
        <Form.Item label="Callback URL" name="webhookEndpointUrl">
          <Input
          // value={privateKey}
          // onChange={onKeyChange('private')}
          />
        </Form.Item>
      </div>

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
