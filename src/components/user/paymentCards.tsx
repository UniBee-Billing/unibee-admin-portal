import { LoadingOutlined, MinusOutlined, SyncOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Empty,
  Popconfirm,
  Row,
  Spin,
  Tooltip,
  message
} from 'antd'
import { useEffect, useState } from 'react'
import {
  changeUserPaymentMethodReq,
  getUserPaymentMethodListReq,
  removeCardPaymentMethodReq
} from '../../requests'

type TCard = {
  id: string
  type: string
  isDefault: boolean
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

interface MethodData {
  brand: string
  country: string
  expYear: number
  expMonth: number
}

interface Method {
  id: string
  type: string
  isDefault: boolean
  data: MethodData
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
    const cards: TCard[] =
      methodList == null
        ? []
        : methodList.map((m: Method) => ({
            id: m.id,
            type: m.type,
            ...m.data,
            expiredAt: m.data.expYear + '-' + m.data.expMonth,
            isDefault: m.isDefault
          }))
    setCards(cards)
    const defaultCard = cards.find((c: { isDefault: boolean }) => c.isDefault)
    // console.log('fetching cards/def: ', cards, '//', defaultCard)
    setDefaultPaymentMethod(defaultCard == undefined ? '' : defaultCard.id)
  }

  const onDeleteCard = (paymentMethodId: string) => async () => {
    if (gatewayId == undefined) {
      return
    }

    const [_, err] = await removeCardPaymentMethodReq({
      userId,
      gatewayId,
      paymentMethodId
    })
    if (null != err) {
      message.error(err.message)
      return
    }
    refresh()
  }

  const onPaymentMethodChange: React.ChangeEventHandler<HTMLInputElement> = (
    evt
  ) => {
    setDefaultPaymentMethod(evt.target.value)
  }

  const setDefaultCard = async () => {
    if (gatewayId == undefined) {
      return
    }
    setLoading(true)
    const [_, err] = await changeUserPaymentMethodReq(
      userId,
      gatewayId,
      defaultPaymentMethodId
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    refresh()
  }

  const refresh = () => {
    if (refreshUserProfile != null) {
      refreshUserProfile()
      fetchCards()
    }
  }

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
          <Tooltip title="Refresh">
            <span className="cursor-pointer" onClick={refresh}>
              <SyncOutlined />
            </span>
          </Tooltip>
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
                  // disabled={readonly}
                  type="radio"
                  name="payment-methods"
                  id={c.id}
                  value={c.id}
                  checked={defaultPaymentMethodId == c.id}
                  onChange={onPaymentMethodChange}
                />
              </Col>
              <Col span={4}>
                {' '}
                <label
                  className="inline-block w-full cursor-pointer"
                  htmlFor={c.id}
                >
                  {c.brand}
                </label>
              </Col>
              <Col span={4}>
                {' '}
                <label
                  className="inline-block w-full cursor-pointer"
                  htmlFor={c.id}
                >
                  {c.country}
                </label>
              </Col>
              <Col span={5}>
                {' '}
                <label
                  className="inline-block w-full cursor-pointer"
                  htmlFor={c.id}
                >
                  {c.expiredAt}
                </label>
              </Col>
              <Col span={5}>
                {' '}
                <label
                  className="inline-block w-full cursor-pointer"
                  htmlFor={c.id}
                >
                  {c.last4}
                </label>
              </Col>
              <Col span={2}>
                <Popconfirm
                  title="Delete confirm"
                  description="Are you sure to delete this payment card?"
                  onConfirm={onDeleteCard(c.id)}
                  // onCancel={cancel}
                  okText="Yes"
                  cancelText="No"
                >
                  <span style={{ cursor: 'pointer' }}>
                    <MinusOutlined />
                  </span>
                </Popconfirm>
              </Col>
            </Row>
          ))
        )}
      </div>
      <div className="my-2 flex items-center justify-end">
        <Button
          onClick={setDefaultCard}
          // loading={loading}
          // size="small"
          disabled={
            loading || defaultPaymentId == undefined || defaultPaymentId == ''
          }
        >
          Set as auto payment card
        </Button>
      </div>
    </>
  )
}

export default Index
