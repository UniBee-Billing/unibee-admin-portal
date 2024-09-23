import { LoadingOutlined, SyncOutlined } from '@ant-design/icons'
import { Col, Empty, Row, Spin, Tooltip, message } from 'antd'
import { useEffect, useState } from 'react'
import { getUserPaymentMethodListReq } from '../../requests'

type TCard = {
  id: string
  type: string
  brand: string
  country: string
  expiredAt: string
  last4: string
}

interface Props {
  userId: number
  gatewayId: number | undefined
  defaultPaymentId: string
  readonly: boolean
  refreshUserProfile: null | (() => void)
}
const Index = ({
  userId,
  gatewayId,
  defaultPaymentId,
  readonly,
  refreshUserProfile
}: Props) => {
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState<TCard[]>([])
  const [defaultPaymentMethodId, setDefaultPaymentMethod] =
    useState(defaultPaymentId)

  const fetchCards = async () => {
    if (gatewayId == undefined) {
      return
    }
    setLoading(true)
    const [methodList, err] = await getUserPaymentMethodListReq({
      userId,
      gatewayId
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const cards =
      methodList == null
        ? []
        : methodList.map((m: any) => ({
            id: m.id,
            type: m.type,
            ...m.data,
            expiredAt: m.data.expYear + '-' + m.data.expMonth
          }))
    setCards(cards)
    // on user portal, user might have updated paymentId, after we refresh the page, we need to update paymentId in local state
    if (defaultPaymentId != defaultPaymentMethodId) {
      setDefaultPaymentMethod(defaultPaymentId)
    }
  }

  const refresh = () => {
    if (refreshUserProfile != null) {
      refreshUserProfile()
      fetchCards()
    }
  }

  // defaultPaymentId is passed from parent
  useEffect(() => {
    fetchCards()
  }, [gatewayId, defaultPaymentId])

  return (
    <>
      <Row gutter={[16, 16]} style={{ fontWeight: 'bold', color: 'gray' }}>
        <Col span={4}>Current</Col>
        <Col span={4}>Brand</Col>
        <Col span={4}>Country</Col>
        <Col span={5}>Expired at</Col>
        <Col span={5}>Last 4 digits</Col>
        <Col span={2}>
          <div className="flex justify-evenly gap-2">
            <Tooltip title="Refresh">
              <span className="cursor-pointer" onClick={refresh}>
                <SyncOutlined />
              </span>
            </Tooltip>
          </div>
        </Col>
      </Row>
      <div className="flex w-full flex-col">
        {loading ? (
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        ) : cards.length == 0 ? (
          <div>
            <Empty
              description="No cards"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          cards.map((c) => (
            <Row
              gutter={[16, 16]}
              key={c.id}
              style={{
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                cursor: readonly ? 'not-allowed' : 'pointer',
                fontWeight: defaultPaymentMethodId == c.id ? 'bold' : 'unset'
              }}
            >
              <Col span={4}>
                <input
                  disabled={true}
                  type="radio"
                  name="payment-methods"
                  id={c.id}
                  value={c.id}
                  checked={defaultPaymentMethodId == c.id}
                />
              </Col>
              <Col span={4}>{c.brand}</Col>
              <Col span={4}>{c.country}</Col>
              <Col span={5}>{c.expiredAt}</Col>
              <Col span={5}>{c.last4}</Col>
              <Col span={2}></Col>
            </Row>
          ))
        )}
      </div>
    </>
  )
}

export default Index
