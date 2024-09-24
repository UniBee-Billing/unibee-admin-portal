import {
  CheckOutlined,
  ExclamationOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Button, Col, Row, Tag } from 'antd'
import React, { useState } from 'react'
import { TGateway } from '../../../shared.types'
// import { useAppConfigStore } from '../../stores';
import GatewayModal from './paymentGatewayModal'

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

const GATEWAYS: {
  name: 'stripe' | 'paypal' | 'changelly'
  url: string
  description: string
}[] = [
  {
    name: 'stripe',
    url: 'http://www.stripe.com',
    description: 'Use public and private keys to secure the bank card payment.'
  },
  {
    name: 'paypal',
    url: 'https://developer.paypal.com/dashboard/applications',
    description: 'Use ClientId and Secret to secure the payment.'
  },
  {
    name: 'changelly',
    url: 'http://www.changelly.com',
    description: 'Use public and private keys to secure the crypto payment.'
  }
]
const Index = ({
  loading,
  gatewayList,
  refresh
}: {
  loading: boolean
  gatewayList: TGateway[]
  refresh: () => void
}) => {
  // const appConfigStore = useAppConfigStore();
  // const [gatewayList, setGatewayList] = useState<TGateway[]>([])
  const [gatewayEdit, setGatewayEdit] = useState<TGateway | undefined>(
    undefined
  )
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false)
  const toggleModal = () => setGatewayModalOpen(!gatewayModalOpen)
  const gatewayDetail = (name: string) =>
    gatewayList.find((g) => g.gatewayName.toLowerCase() == name.toLowerCase())

  const onGatewayClick =
    (gatewayName: 'changelly' | 'stripe' | 'paypal') => () => {
      const g = gatewayList.find(
        (g) => g.gatewayName.toLowerCase() == gatewayName.toLowerCase()
      )
      setGatewayEdit(
        g ?? {
          gatewayName,
          webhookEndpointUrl: '',
          webhookSecret: '',
          displayName: ''
        }
      )
      toggleModal()
    }

  return (
    <div>
      {gatewayModalOpen && (
        <GatewayModal
          closeModal={toggleModal}
          gatewayDetail={gatewayEdit}
          refresh={refresh}
        />
      )}
      {GATEWAYS.map((g) => (
        <Row key={g.name} gutter={[16, 32]} style={{ marginBottom: '16px' }}>
          <Col span={4}>
            <a href={g.url} target="_blank" rel="noreferrer">
              {g.name.charAt(0).toUpperCase() + g.name.slice(1)}
            </a>
          </Col>
          <Col span={2}>
            {loading ? (
              <LoadingTag />
            ) : gatewayDetail(g.name) != null ? (
              <SetTag />
            ) : (
              <NotSetTag />
            )}
          </Col>
          <Col span={10}>
            <div className="text-gray-500">{g.description}</div>
          </Col>
          <Col span={2}>
            <Button
              onClick={onGatewayClick(g.name)}
              disabled={loading}
              loading={loading}
            >
              {gatewayDetail(g.name) == null ? 'Setup' : 'Edit'}
            </Button>
          </Col>
        </Row>
      ))}
      {/* <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>
          <a href="http://www.stripe.com" target="_blank" rel="noreferrer">
            Stripe
          </a>
        </Col>
        <Col span={2}>
          {loading ? (
            <LoadingTag />
          ) : gatewayDetail('stripe') != null ? (
            <SetTag />
          ) : (
            <NotSetTag />
          )}
        </Col>
        <Col span={10}>
          <div className=" text-gray-500">
            Use public and private keys to secure the bank card payment.
          </div>
        </Col>
        <Col span={2}>
          <Button
            onClick={onGatewayClick('stripe')}
            disabled={loading}
            loading={loading}
          >
            {gatewayDetail('stripe') == null ? 'Setup' : 'Edit'}
          </Button>
        </Col>
        </Row> */}

      {/* <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>
          <a href="http://www.changelly.com" target="_blank" rel="noreferrer">
            Changelly
          </a>
        </Col>
        <Col span={2}>
          {loading ? (
            <LoadingTag />
          ) : gatewayDetail('changelly') != null ? (
            <SetTag />
          ) : (
            <NotSetTag />
          )}
        </Col>
        <Col span={10}>
          <div className=" text-gray-500">
            Use public and private keys to secure the crypto payment.
          </div>
        </Col>
        <Col span={2}>
          <Button
            onClick={onGatewayClick('changelly')}
            disabled={loading}
            loading={loading}
          >
            {gatewayDetail('changelly') == null ? 'Setup' : 'Edit'}
          </Button>
        </Col>
        </Row> */}
    </div>
  )
}

export default Index
