import { CopyOutlined } from '@ant-design/icons'
import { Button, Col, Input, Modal, Row, message } from 'antd'
import { useState } from 'react'
import { useCopyContent } from '../../../hooks'
import { saveChangellyPubKeyReq } from '../../../requests'
import { TGateway } from '../../../shared.types'
const { TextArea } = Input

interface IProps {
  gateway: TGateway
  closeModal: () => void
  refresh: () => void
}
const Index = ({ gateway, closeModal, refresh }: IProps) => {
  const [loading, setLoading] = useState(false)
  const [webhookSecret, setWebhookSecret] = useState(
    gateway.webhookSecret || ''
  )
  const onKeyChange: React.ChangeEventHandler<HTMLTextAreaElement> = (evt) => {
    setWebhookSecret(evt.target.value)
  }
  const copyContent = async () => {
    const err = await useCopyContent(gateway.webhookEndpointUrl)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Copied')
  }

  const onSaveKey = async () => {
    if (webhookSecret.trim() == '') {
      message.error('Key is empty')
      return
    }
    setLoading(true)
    const [res, err] = await saveChangellyPubKeyReq(
      gateway.gatewayId as number,
      webhookSecret
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`Changelly callback key saved`)
    refresh()
    closeModal()
  }

  return (
    <div style={{ margin: '32px 0' }}>
      <Modal
        title={`Changelly callback public key setup`}
        width={'720px'}
        open={true}
        footer={null}
        closeIcon={null}
      >
        <div className="my-6 w-full">
          <Row gutter={[16, 32]} style={{ marginBottom: '12px' }}>
            <Col span={6} className="text-gray-600">
              Callback URL
            </Col>
            <Col span={18} className="text-gray-800">
              <div className="flex justify-between">
                <div
                  style={{
                    maxWidth: '460px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {gateway.webhookEndpointUrl}
                </div>
                <Button
                  type="link"
                  onClick={copyContent}
                  size="small"
                  icon={<CopyOutlined />}
                ></Button>
              </div>
            </Col>
          </Row>
          <Row>
            <Col span={6} className="text-gray-600">
              Callback public key
            </Col>
            <Col span={18}>
              <TextArea
                rows={6}
                value={webhookSecret}
                onChange={onKeyChange}
              ></TextArea>
              <div className="mt-2 text-sm">
                <Button
                  type="link"
                  onClick={copyContent}
                  style={{ padding: 0 }}
                  size="small"
                  // icon={<CopyOutlined />}
                >
                  Copy
                </Button>
                &nbsp;
                <span className="text-sm text-gray-400">
                  the above URL, use this URL to generate your public key
                  on&nbsp;&nbsp;
                </span>
                <a
                  href="https://app.pay.changelly.com/integrations"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://app.pay.changelly.com/integrations
                </a>
                <span className="text-sm text-gray-400">
                  , then paste it here.
                </span>
              </div>
            </Col>
          </Row>
        </div>
        <div className="flex justify-end gap-4">
          <Button onClick={closeModal} disabled={loading}>
            Close
          </Button>
          <Button
            type="primary"
            onClick={onSaveKey}
            disabled={loading}
            loading={loading}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Index
