import { Button, Col, Input, Modal, Row, message } from 'antd'
// import dayjs from 'dayjs'
import { useState } from 'react'
// import { useCopyContent } from '../../hooks'
import { saveSendGridKeyReq } from '../../../requests'
const { TextArea } = Input

interface IProps {
  closeModal: () => void
  // gatewayDetail: TGateway | undefined
}
const Index = ({ closeModal }: IProps) => {
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const onKeyChange: React.ChangeEventHandler<HTMLTextAreaElement> = (evt) => {
    setApiKey(evt.target.value)
  }
  const onSaveKey = async () => {
    if (apiKey.trim() == '') {
      message.error('Key is empty')
      return
    }
    setLoading(true)
    const [_, err] = await saveSendGridKeyReq(apiKey)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`Sendgrid API key saved`)
    closeModal()
  }

  return (
    <div style={{ margin: '32px 0' }}>
      <Modal
        title={`Sendgrid API key setup`}
        width={'640px'}
        open={true}
        footer={null}
        closeIcon={null}
      >
        <div className="my-6 w-full">
          <Row gutter={[16, 32]} style={{ marginBottom: '12px' }}>
            <Col span={4}>Your API key</Col>
            <Col span={20}>
              <TextArea rows={4} value={apiKey} onChange={onKeyChange} />
            </Col>
          </Row>
          <Row>
            <Col span={4}></Col>
            <Col span={20}>
              <div className="text-xs text-gray-400">
                For security reason, your key won't show up here after submit.
              </div>
              <div>
                Apply your key on&nbsp;&nbsp;
                <a href="https://sendgrid.com" target="_blank" rel="noreferrer">
                  https://sendgrid.com
                </a>
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
