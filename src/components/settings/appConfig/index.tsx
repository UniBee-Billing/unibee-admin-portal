import {
  CheckOutlined,
  ExclamationOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Button, Col, Row, Tag, message } from 'antd'
import React, { useEffect, useState } from 'react'
import 'react-quill/dist/quill.snow.css'
import { CURRENCY } from '../../../constants'
import { getAppKeysWithMore } from '../../../requests'
// import '../../shared.css'
import { TGateway } from '../../../shared.types.d'
import { useAppConfigStore } from '../../../stores'
import ModalApiKey from './apiKeyModal'
import ChangellyModal from './changellyModal'
import PaymentGatewayList from './paymentGatewayList'
import SegmentModal from './segmentModal'
import ModalSendgridKeyModal from './sendGridKeyModal'
import ModalVATsenseKeyModal from './vatKeyModal'
import ModalWireTransfer from './wireTransferModal'

const SetTag = () => (
  <Tag icon={<CheckOutlined />} color="#87d068">
    Ready
  </Tag>
)
const NotSetTag = () => (
  <Tag icon={<ExclamationOutlined />} color="#f50">
    Not Set
  </Tag>
)

const LoadingTag = () => (
  <Tag icon={<SyncOutlined spin />} color="#2db7f5"></Tag>
)

const Index = () => {
  const appConfigStore = useAppConfigStore()
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
  const [vatSenseKeyModalOpen, setVatSenseKeyModalOpen] = useState(false)
  const [sendgridKeyModalOpen, setSendgridKeyModalOpen] = useState(false)
  const [wireTransferModalOpen, setWireTransferModalOpen] = useState(false)
  const [changellyModalOpen, setChangellyModalOpen] = useState(false)
  const [segmentModalOpen, setSegmentModalOpen] = useState(false)

  const [keys, setKeys] = useState({
    openApiKey: '',
    sendGridKey: '',
    vatSenseKey: '',
    segmentServerSideKey: '',
    segmentUserPortalKey: ''
  })
  const [gatewayList, setGatewayList] = useState<TGateway[]>([])

  const toggleKeyModal = () => setApiKeyModalOpen(!apiKeyModalOpen)
  const toggleChangellyModal = () => setChangellyModalOpen(!changellyModalOpen)
  const toggleSendgridModal = () =>
    setSendgridKeyModalOpen(!sendgridKeyModalOpen)
  const toggleVatSenseKeyModal = () =>
    setVatSenseKeyModalOpen(!vatSenseKeyModalOpen)
  const toggleWireTransferModal = () =>
    setWireTransferModalOpen(!wireTransferModalOpen)
  const toggleSegmentModal = () => setSegmentModalOpen(!segmentModalOpen)

  const getAppKeys = async () => {
    setLoadingKeys(true)
    const [res, err] = await getAppKeysWithMore(getAppKeys)
    setLoadingKeys(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { merchantInfo, gateways } = res
    // these keys have been desensitized, their purposes is to show which keys have been set, which haven't
    const {
      openApiKey,
      sendGridKey,
      vatSenseKey,
      segmentServerSideKey,
      segmentUserPortalKey
    } = merchantInfo
    const k = {
      openApiKey: '',
      sendGridKey: '',
      vatSenseKey: '',
      segmentServerSideKey: '',
      segmentUserPortalKey: ''
    }
    if (openApiKey != null && openApiKey != '') {
      k.openApiKey = openApiKey
    }
    if (sendGridKey != null && sendGridKey != '') {
      k.sendGridKey = sendGridKey
    }
    if (vatSenseKey != null && vatSenseKey != '') {
      k.vatSenseKey = vatSenseKey
    }
    if (segmentServerSideKey != null && segmentServerSideKey != '') {
      k.segmentServerSideKey = segmentServerSideKey
    }
    if (segmentUserPortalKey != null && segmentUserPortalKey != '') {
      k.segmentUserPortalKey = segmentUserPortalKey
    }
    setKeys(k)
    if (gateways != null) {
      // after some gateway setup, local store need to be updated.
      appConfigStore.setGateway(gateways)
      const wireTransfer = gateways.find(
        (g: TGateway) => g.gatewayName == 'wire_transfer'
      )
      if (wireTransfer != null) {
        wireTransfer.minimumAmount /=
          CURRENCY[wireTransfer.currency].stripe_factor
      }
      const changelly = gateways.find(
        (g: TGateway) => g.gatewayName == 'changelly'
      )
      if (changelly != null) {
      }
    }
    setGatewayList(gateways ?? [])
  }

  useEffect(() => {
    getAppKeys()
  }, [])

  return (
    <div style={{ margin: '32px 0' }}>
      {apiKeyModalOpen && <ModalApiKey closeModal={toggleKeyModal} />}
      {sendgridKeyModalOpen && (
        <ModalSendgridKeyModal closeModal={toggleSendgridModal} />
      )}
      {vatSenseKeyModalOpen && (
        <ModalVATsenseKeyModal closeModal={toggleVatSenseKeyModal} />
      )}
      {wireTransferModalOpen && (
        <ModalWireTransfer
          closeModal={toggleWireTransferModal}
          detail={gatewayList.find((g) => g.gatewayName == 'wire_transfer')}
          refresh={getAppKeys}
        />
      )}
      {segmentModalOpen && (
        <SegmentModal
          closeModal={toggleSegmentModal}
          serverSideKey={keys.segmentServerSideKey}
          refresh={getAppKeys}
        />
      )}
      {changellyModalOpen &&
        gatewayList.find((g) => g.gatewayName == 'changelly') != null && (
          <ChangellyModal
            closeModal={toggleChangellyModal}
            refresh={getAppKeys}
            gateway={
              gatewayList.find((g) => g.gatewayName == 'changelly') as TGateway
            }
          />
        )}

      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>UniBee API Key</Col>
        <Col span={2}>
          {loadingKeys ? (
            <LoadingTag />
          ) : keys.openApiKey != '' ? (
            <SetTag />
          ) : (
            <NotSetTag />
          )}
        </Col>
        <Col span={10}>
          <div className="text-gray-500">
            Use this key to communicate safely with your App.
          </div>
        </Col>
        <Col span={2}>
          <Button onClick={toggleKeyModal} disabled={loadingKeys}>
            Generate
          </Button>
        </Col>
      </Row>
      <PaymentGatewayList
        loading={loadingKeys}
        gatewayList={gatewayList}
        refresh={getAppKeys}
      />
      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>
          <a
            href="https://app.pay.changelly.com/integrations"
            target="_blank"
            rel="noreferrer"
          >
            Changelly Webhook key
          </a>
        </Col>
        <Col span={2}>
          {loadingKeys ? (
            <LoadingTag />
          ) : gatewayList.find((g) => g.gatewayName == 'changelly')
              ?.webhookSecret != '' ? (
            <SetTag />
          ) : (
            <NotSetTag />
          )}
        </Col>
        <Col span={10}>
          <div className="text-gray-500">
            Use this key to secure communication between Changelly and WebHook
            endpoint.
          </div>
        </Col>
        <Col span={2}>
          <Button onClick={toggleChangellyModal} disabled={loadingKeys}>
            Edit
          </Button>
        </Col>
      </Row>
      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>Wire Transfer setup</Col>
        <Col span={2}>
          {loadingKeys ? (
            <LoadingTag />
          ) : gatewayList.find((g) => g.gatewayName == 'wire_transfer') !=
            null ? (
            <SetTag />
          ) : (
            <NotSetTag />
          )}
        </Col>
        <Col span={10}>
          <div className="text-gray-500">
            Use this method to receive payment from bank transfer
          </div>
        </Col>
        <Col span={2}>
          <Button onClick={toggleWireTransferModal} disabled={loadingKeys}>
            Edit
          </Button>
        </Col>
      </Row>
      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>
          <a href="https://vatsense.com" target="_blank" rel="noreferrer">
            VAT Sense Key
          </a>
        </Col>
        <Col span={2}>
          {loadingKeys ? (
            <LoadingTag />
          ) : keys.vatSenseKey != '' ? (
            <SetTag />
          ) : (
            <NotSetTag />
          )}
        </Col>
        <Col span={10}>
          <div className="text-gray-500">
            Use this key to calculate VAT for your payment.{' '}
          </div>
        </Col>
        <Col span={2}>
          <Button onClick={toggleVatSenseKeyModal} disabled={loadingKeys}>
            Edit
          </Button>
        </Col>
      </Row>
      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>
          <a href="https://sendgrid.com" target="_blank" rel="noreferrer">
            SendGrid Email Key
          </a>
        </Col>
        <Col span={2}>
          {loadingKeys ? (
            <LoadingTag />
          ) : keys.sendGridKey != '' ? (
            <SetTag />
          ) : (
            <NotSetTag />
          )}
        </Col>
        <Col span={10}>
          <div className="text-gray-500">
            Use this key to send email to your customers.
          </div>
        </Col>
        <Col span={2}>
          <Button onClick={toggleSendgridModal} disabled={loadingKeys}>
            Edit
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>
          <a href="https://segment.com" target="_blank" rel="noreferrer">
            Segment setup
          </a>
        </Col>
        <Col span={2}>
          {loadingKeys ? (
            <LoadingTag />
          ) : keys.segmentServerSideKey != '' ? (
            <SetTag />
          ) : (
            <NotSetTag />
          )}
        </Col>
        <Col span={10}>
          <div className="text-gray-500">
            Use these server/client keys to track user behavior.
          </div>
        </Col>
        <Col span={2}>
          <Button onClick={toggleSegmentModal} disabled={loadingKeys}>
            Edit
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default Index
