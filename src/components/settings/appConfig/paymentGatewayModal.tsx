import { Button, Col, Input, Modal, Row, message } from 'antd'
import { useState } from 'react'
import { saveGatewayKeyReq } from '../../../requests'
import { TGateway } from '../../../shared.types'
const { TextArea } = Input

interface IProps {
  closeModal: () => void
  refresh: () => void
  gatewayDetail: TGateway | undefined
}
const Index = ({ closeModal, gatewayDetail, refresh }: IProps) => {
  const isNew = gatewayDetail?.gatewayId == 0
  const [loading, setLoading] = useState(false)
  const [pubKey, setPubKey] = useState(
    isNew ? '' : (gatewayDetail?.gatewayKey as string)
  )
  const [privateKey, setPrivateKey] = useState('')
  const onKeyChange =
    (which: 'public' | 'private') =>
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (which == 'public') {
        setPubKey(evt.target.value)
      } else {
        setPrivateKey(evt.target.value)
      }
    }
  const onSaveKey = async () => {
    if (pubKey.trim() == '') {
      message.error('Public Key is empty')
      return
    }
    if (privateKey.trim() == '') {
      message.error('Private Key is empty')
      return
    }
    const body = {
      gatewayKey: pubKey,
      gatewaySecret: privateKey,
      gatewayName: gatewayDetail!.gatewayName
      // gatewayName: isNew ? gatewayDetail!.gatewayName : undefined,
      // gatewayId: isNew ? undefined : gatewayDetail.gatewayId
    }

    setLoading(true)
    const [_, err] = await saveGatewayKeyReq(body, isNew)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`${gatewayDetail?.gatewayName} keys saved`)
    refresh()
    closeModal()
  }

  return (
    <div style={{ margin: '32px 0' }}>
      <Modal
        title={`${isNew ? 'New keys' : 'Editing keys'} for ${gatewayDetail?.gatewayName}`}
        width={'640px'}
        open={true}
        footer={null}
        closeIcon={null}
      >
        <div className="my-6 w-full">
          <Row gutter={[16, 32]} style={{ marginBottom: '12px' }}>
            <Col span={4}>
              {gatewayDetail?.gatewayName == 'paypal'
                ? 'Client Id'
                : 'Public Key'}
            </Col>
            <Col span={20}>
              <TextArea
                rows={4}
                value={pubKey}
                onChange={onKeyChange('public')}
              />
            </Col>
          </Row>
          <Row gutter={[16, 32]} style={{ marginBottom: '12px' }}>
            <Col span={4}>
              {gatewayDetail?.gatewayName == 'paypal'
                ? 'Secret'
                : 'Private Key'}
            </Col>
            <Col span={20}>
              <TextArea
                rows={4}
                value={privateKey}
                onChange={onKeyChange('private')}
              />
            </Col>
          </Row>
          <Row gutter={[16, 32]}>
            <Col span={4}></Col>
            <Col span={20}>
              <div className="text-xs text-gray-400">
                For security reason, your{' '}
                {gatewayDetail?.gatewayName == 'paypal'
                  ? 'Secret'
                  : 'Private Key'}{' '}
                won't show up here after submit.
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
