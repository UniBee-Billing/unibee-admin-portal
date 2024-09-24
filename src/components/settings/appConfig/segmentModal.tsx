import { Button, Col, Input, Modal, Row, message } from 'antd'
import { useState } from 'react'
import { segmentSetupReq } from '../../../requests'
const { TextArea } = Input

interface IProps {
  closeModal: () => void
  serverSideKey: string
  refresh: () => void
}
const Index = ({ closeModal, serverSideKey, refresh }: IProps) => {
  const [loading, setLoading] = useState(false)
  const [serverKey, setServerKey] = useState(serverSideKey)
  const [clientKey, setClientKey] = useState('')

  const onKeyChange =
    (keyType: 'serverKey' | 'clientKey') =>
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (keyType == 'serverKey') {
        setServerKey(evt.target.value)
      } else {
        setClientKey(evt.target.value)
      }
    }

  const onConfirm = async () => {
    if (serverKey == '' || serverKey == null) {
      message.error('Server key must not be empty')
      return
    }
    if (clientKey == '' || clientKey == null) {
      message.error('User portal key must not be empty')
      return
    }
    setLoading(true)
    const [_, err] = await segmentSetupReq(serverKey, clientKey)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`Segment keys saved`)
    refresh()
    closeModal()
  }

  return (
    <div style={{ margin: '32px 0' }}>
      <Modal
        title="Segment server/client keys"
        width={'640px'}
        open={true}
        footer={null}
        closeIcon={null}
      >
        <div className="my-6 w-full">
          <Row gutter={[16, 32]} style={{ marginBottom: '12px' }}>
            <Col span={5}>Server side key</Col>
            <Col span={19}>
              <TextArea
                rows={4}
                value={serverKey}
                onChange={onKeyChange('serverKey')}
              />
            </Col>
          </Row>
          <Row gutter={[16, 32]} style={{ marginBottom: '12px' }}>
            <Col span={5}>User portal key</Col>
            <Col span={19}>
              <TextArea
                rows={4}
                value={clientKey}
                onChange={onKeyChange('clientKey')}
              />
            </Col>
          </Row>
          <Row gutter={[16, 32]}>
            <Col span={5}></Col>
            <Col span={19}>
              <div className="text-xs text-gray-400">
                For security reason, your user portal key won't show up here
                after submit.
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
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
          >
            OK
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Index
